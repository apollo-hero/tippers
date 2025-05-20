// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "hardhat/console.sol";   // optional, for logging

contract TestToken {
    string  public name;
    string  public symbol;
    uint8   public immutable decimals;
    uint256 public totalSupply;

    mapping(address => uint256)            public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    constructor(string memory _n, string memory _s, uint8 _d) {
        name = _n; symbol = _s; decimals = _d;
    }

    function _mint(address to, uint256 amt) internal {
        balanceOf[to] += amt;
        totalSupply   += amt;
    }

    function mint(address to, uint256 amt) external {
        _mint(to, amt);
    }

    function approve(address spender, uint256 amt) external returns (bool){
        allowance[msg.sender][spender] = amt;
        return true;
    }

    function transfer(address to, uint256 amt) external returns (bool){
        _transfer(msg.sender, to, amt);
        return true;
    }

    function transferFrom(address from, address to, uint256 amt) external returns (bool){
        uint256 allowed = allowance[from][msg.sender];
        require(allowed >= amt, "allowance");
        allowance[from][msg.sender] = allowed - amt;
        _transfer(from, to, amt);
        return true;
    }

    function _transfer(address from, address to, uint256 amt) internal {
        require(balanceOf[from] >= amt, "balance");
        balanceOf[from] -= amt;
        balanceOf[to]   += amt;
    }
}
