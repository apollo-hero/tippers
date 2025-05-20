// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
}

abstract contract Ownable {
    address public owner;
    
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Ownable: caller is not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Ownable: zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}

abstract contract ReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
}

contract StakingPool is Ownable, ReentrancyGuard {
    IERC20 public immutable stakingToken;
    
    // Reward tracking
    uint256 public rewardRate; // Reward tokens per staked token per second (scaled by 1e18)
    uint256 public rewardPoolBalance; // Track reward pool separately
    uint256 public totalStaked;
    uint256 public lastRewardUpdate; // Timestamp of last reward rate update
    
    // Stake information
    struct StakeInfo {
        uint256 amount;
        uint256 rewardDebt;
        uint256 lastUpdate;
        uint256 pendingRewards;
    }
    
    mapping(address => StakeInfo) public stakes;
    
    // Contract state
    bool public paused;
    
    // Events
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 reward);
    event RewardFunded(uint256 amount);
    event RewardRateUpdated(uint256 newRate);
    event Paused(bool isPaused);
    event EmergencyWithdraw(address indexed user, uint256 amount);
    
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }
    
    constructor(IERC20 _token, uint256 _initialRate) {
        require(address(_token) != address(0), "Invalid token");
        stakingToken = _token;
        rewardRate = _initialRate;
        lastRewardUpdate = block.timestamp;
    }
    
    /* ---------------------------------------------------------------------- */
    /*                                Admin                                   */
    /* ---------------------------------------------------------------------- */
    
    /// @notice Fund the reward pool
    function fundRewards(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount = 0");
        rewardPoolBalance += amount;
        require(stakingToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        emit RewardFunded(amount);
    }
    
    /// @notice Update reward rate (per token per second, scaled by 1e18)
    function setRewardRate(uint256 _rate) external onlyOwner {
        _updateAllRewards();
        rewardRate = _rate;
        lastRewardUpdate = block.timestamp;
        emit RewardRateUpdated(_rate);
    }
    
    /// @notice Withdraw excess rewards from the contract
    function withdrawExcessRewards(uint256 amount) external onlyOwner {
        uint256 available = rewardPoolBalance;
        require(amount <= available, "Amount exceeds available rewards");
        rewardPoolBalance -= amount;
        require(stakingToken.transfer(owner, amount), "Transfer failed");
    }
    
    /// @notice Pause/unpause the contract
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit Paused(_paused);
    }
    
    /* ---------------------------------------------------------------------- */
    /*                               Staking                                  */
    /* ---------------------------------------------------------------------- */
    
    /// @notice Stake tokens to earn rewards
    function stake(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Stake 0");
        StakeInfo storage s = stakes[msg.sender];
        _updateUserRewards(msg.sender);
        
        s.amount += amount;
        totalStaked += amount;
        
        require(stakingToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        emit Staked(msg.sender, amount);
    }
    
    /// @notice Unstake tokens
    function unstake(uint256 amount) external nonReentrant whenNotPaused {
        StakeInfo storage s = stakes[msg.sender];
        require(amount > 0 && amount <= s.amount, "Bad amount");
        _updateUserRewards(msg.sender);
        
        s.amount -= amount;
        totalStaked -= amount;
        
        require(stakingToken.transfer(msg.sender, amount), "Transfer failed");
        emit Unstaked(msg.sender, amount);
    }
    
    /// @notice Claim accumulated rewards
    function claim() external nonReentrant {
        _updateUserRewards(msg.sender);
        StakeInfo storage s = stakes[msg.sender];
        
        uint256 rewardToSend = s.pendingRewards;
        require(rewardToSend > 0, "No rewards to claim");
        require(rewardToSend <= rewardPoolBalance, "Insufficient reward pool");
        
        s.pendingRewards = 0;
        rewardPoolBalance -= rewardToSend;
        
        require(stakingToken.transfer(msg.sender, rewardToSend), "Reward transfer failed");
        emit RewardClaimed(msg.sender, rewardToSend);
    }
    
    /// @notice Emergency withdraw without claiming rewards
    function emergencyWithdraw() external nonReentrant {
        require(paused, "Only when paused");
        StakeInfo storage s = stakes[msg.sender];
        uint256 amount = s.amount;
        require(amount > 0, "No stake");
        
        totalStaked -= amount;
        s.amount = 0;
        s.pendingRewards = 0;
        s.rewardDebt = 0;
        s.lastUpdate = block.timestamp;
        
        require(stakingToken.transfer(msg.sender, amount), "Transfer failed");
        emit EmergencyWithdraw(msg.sender, amount);
    }
    
    /* ---------------------------------------------------------------------- */
    /*                            View helpers                                */
    /* ---------------------------------------------------------------------- */
    
    /// @notice Calculate pending rewards for a user
    function pendingReward(address account) external view returns (uint256) {
        StakeInfo storage s = stakes[account];
        if (s.amount == 0) return s.pendingRewards;
        
        uint256 delta = block.timestamp - s.lastUpdate;
        uint256 accrued = (s.amount * rewardRate * delta) / 1e18;
        return s.pendingRewards + accrued;
    }
    
    /// @notice Get total rewards available in the pool
    function availableRewards() external view returns (uint256) {
        return rewardPoolBalance;
    }
    
    /* ---------------------------------------------------------------------- */
    /*                           Internal logic                               */
    /* ---------------------------------------------------------------------- */
    
    /// @dev Update rewards for all stakers (when reward rate changes)
    function _updateAllRewards() internal {
        // This would ideally update all stakers, but is impractical
        // In a production environment, consider a more scalable approach
        lastRewardUpdate = block.timestamp;
    }
    
    /// @dev Update rewards for a specific user
    function _updateUserRewards(address user) internal {
        StakeInfo storage s = stakes[user];
        if (s.amount > 0) {
            uint256 delta = block.timestamp - s.lastUpdate;
            uint256 accrued = (s.amount * rewardRate * delta) / 1e18;
            s.pendingRewards += accrued;
        }
        s.lastUpdate = block.timestamp;
    }
}