const { ethers } = require('ethers');
const path = require('path');

// Hardhat network configuration
const HARDHAT_URL = "http://127.0.0.1:8545";
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Default Hardhat address

// Initialize provider and contract
let provider;
let votingContract;
let ownerAccount;

// Hardhat account mapping (address -> private key)
const ACCOUNT_MAPPING = {
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266": "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8": "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC": "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
  "0x90F79bf6EB2c4f870365E785982E1f101E93b906": "0x7c852118e8d7c8c6e8c2b4b2f4b4f4b4f4b4f4b4f4b4f4b4f4b4f4b4f4b4f4b",
  "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65": "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
  "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc": "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba",
  "0x976EA74026E726554dB657fA54763abd0C3a0aa9": "0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e",
  "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955": "0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f0702cce00b771f",
  "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f": "0xacf77d9c92e69b4c93e62f9a84e8c8e8c8e8c8e8c8e8c8e8c8e8c8e8c8e8c8e8c",
  "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720": "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984"
};

// Voting contract ABI (extracted from artifacts)
const VOTING_ABI = [
  "function addCandidate(string name, string party) public returns(uint)",
  "function getAllCandidates() public view returns (uint[], string[], string[], uint[])",
  "function vote(uint candidateID) public",
  "function getWinner() public view returns (uint, string, string, uint)",
  "function checkVote() public view returns(bool)",
  "function getCountCandidates() public view returns(uint)",
  "function getCandidate(uint candidateID) public view returns (uint, string, string, uint)",
  "function setDates(uint256 startDate, uint256 endDate) public",
  "function getDates() public view returns (uint256, uint256)",
  "function owner() public view returns(address)"
];

// Initialize blockchain connection
async function initializeBlockchain() {
  try {
    provider = new ethers.JsonRpcProvider(HARDHAT_URL);
    
    // Get the first account as owner/admin
    const accounts = await provider.listAccounts();
    if (accounts.length === 0) {
      throw new Error("No accounts found. Please start Hardhat node first.");
    }
    
    ownerAccount = accounts[0];
    console.log("Using owner account:", ownerAccount);
    
    // Initialize contract
    votingContract = new ethers.Contract(CONTRACT_ADDRESS, VOTING_ABI, provider);
    
    // Verify contract owner
    const contractOwner = await votingContract.owner();
    console.log("Contract owner:", contractOwner);
    
    console.log("Blockchain connection initialized successfully");
  } catch (error) {
    console.error("Failed to initialize blockchain connection:", error.message);
    console.log("Please ensure Hardhat node is running and contract is deployed");
  }
}

// Initialize blockchain connection on startup
initializeBlockchain();

// Helper function to get signer for owner transactions
function getOwnerSigner() {
  const privateKey = ACCOUNT_MAPPING[ownerAccount];
  if (!privateKey) {
    throw new Error(`Private key not found for owner account: ${ownerAccount}`);
  }
  return new ethers.Wallet(privateKey, provider);
}

// Add a candidate (only owner account)
exports.addCandidate = async (req, res) => {
  try {
    const { name, party, ownerAddress } = req.body;
    
    if (!name || !party || !ownerAddress) {
      return res.status(400).json({ 
        error: "Missing required fields", 
        message: "All fields 'name', 'party', and 'ownerAddress' are required" 
      });
    }
    
    if (!votingContract) {
      return res.status(500).json({ 
        error: "Contract not initialized", 
        message: "Please ensure Hardhat node is running and contract is deployed" 
      });
    }
    
    // Verify that the provided address is the contract owner
    const contractOwner = await votingContract.owner();
    if (ownerAddress.toLowerCase() !== contractOwner.toLowerCase()) {
      return res.status(403).json({ 
        error: "Unauthorized", 
        message: "Only the contract owner can add candidates. Provided address is not the owner." 
      });
    }
    
    // Verify that the owner address exists in our account mapping
    const privateKey = ACCOUNT_MAPPING[ownerAddress];
    if (!privateKey) {
      return res.status(400).json({ 
        error: "Invalid owner account", 
        message: "Owner address not found in the system. Use one of the Hardhat test accounts." 
      });
    }
    
    // Create owner signer for the transaction
    const ownerWallet = new ethers.Wallet(privateKey, provider);
    const contractWithSigner = votingContract.connect(ownerWallet);
    
    // Add candidate
    const tx = await contractWithSigner.addCandidate(name, party);
    await tx.wait();
    
    console.log(`Candidate added by owner ${ownerAddress}: ${name} (${party})`);
    
    res.json({ 
      success: true, 
      message: `Candidate ${name} added successfully by owner`,
      transactionHash: tx.hash,
      addedBy: ownerAddress
    });
    
  } catch (error) {
    console.error("Error adding candidate:", error);
    res.status(500).json({ 
      error: "Failed to add candidate", 
      message: error.message 
    });
  }
};

// List all candidates and their vote counts
exports.getCandidates = async (req, res) => {
  try {
    if (!votingContract) {
      return res.status(500).json({ 
        error: "Contract not initialized", 
        message: "Please ensure Hardhat node is running and contract is deployed" 
      });
    }
    
    // Get all candidates
    const [ids, names, parties, voteCounts] = await votingContract.getAllCandidates();
    
    // Format the response
    const candidates = ids.map((id, index) => ({
      id: id.toString(),
      name: names[index],
      party: parties[index],
      voteCount: voteCounts[index].toString()
    }));
    
    res.json({ 
      success: true, 
      candidates: candidates,
      totalCandidates: candidates.length
    });
    
  } catch (error) {
    console.error("Error getting candidates:", error);
    res.status(500).json({ 
      error: "Failed to get candidates", 
      message: error.message 
    });
  }
};

// Cast a vote for a candidate
exports.castVote = async (req, res) => {
  try {
    const { accountAddress, candidateIndex } = req.body;
    
    if (!accountAddress || candidateIndex === undefined) {
      return res.status(400).json({ 
        error: "Missing required fields", 
        message: "Both 'accountAddress' and 'candidateIndex' are required" 
      });
    }
    
    if (!votingContract) {
      return res.status(500).json({ 
        error: "Contract not initialized", 
        message: "Please ensure Hardhat node is running and contract is deployed" 
      });
    }
    
    // Get private key for the account address
    const privateKey = ACCOUNT_MAPPING[accountAddress];
    if (!privateKey) {
      return res.status(400).json({ 
        error: "Invalid account", 
        message: "Account address not found in the system. Use one of the Hardhat test accounts." 
      });
    }
    
    // Create a new wallet instance for the voter
    const voterWallet = new ethers.Wallet(privateKey, provider);
    
    // Check if user has already voted
    const hasVoted = await votingContract.checkVote({ from: accountAddress });
    if (hasVoted) {
      return res.status(400).json({ 
        error: "Already voted", 
        message: "This account has already cast a vote" 
      });
    }
    
    const contractWithSigner = votingContract.connect(voterWallet);
    
    // Cast vote
    const tx = await contractWithSigner.vote(candidateIndex);
    await tx.wait();
    
    console.log(`Vote cast by ${accountAddress} for candidate ${candidateIndex}`);
    
    res.json({ 
      success: true, 
      message: "Vote cast successfully",
      transactionHash: tx.hash
    });
    
  } catch (error) {
    console.error("Error casting vote:", error);
    res.status(500).json({ 
      error: "Failed to cast vote", 
      message: error.message 
    });
  }
};

// Set voting period (owner only)
exports.setVotingDates = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: "Missing required fields", 
        message: "Both 'startDate' and 'endDate' are required" 
      });
    }
    
    if (!votingContract) {
      return res.status(500).json({ 
        error: "Contract not initialized", 
        message: "Please ensure Hardhat node is running and contract is deployed" 
      });
    }
    
    // Get owner signer for the transaction
    const ownerSigner = getOwnerSigner();
    const contractWithSigner = votingContract.connect(ownerSigner);
    
    // Set voting dates
    const tx = await contractWithSigner.setDates(startDate, endDate);
    await tx.wait();
    
    console.log(`Voting period set: ${new Date(startDate * 1000)} to ${new Date(endDate * 1000)}`);
    
    res.json({ 
      success: true, 
      message: "Voting period set successfully",
      transactionHash: tx.hash
    });
    
  } catch (error) {
    console.error("Error setting voting dates:", error);
    res.status(500).json({ 
      error: "Failed to set voting dates", 
      message: error.message 
    });
  }
};

// Get winner and voting status
exports.getWinner = async (req, res) => {
  try {
    if (!votingContract) {
      return res.status(500).json({ 
        error: "Contract not initialized", 
        message: "Please ensure Hardhat node is running and contract is deployed" 
      });
    }
    
    // Get voting dates
    const [votingStart, votingEnd] = await votingContract.getDates();
    const votingStartNum = Number(votingStart);
    const votingEndNum = Number(votingEnd);
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Check if voting is still active
    const isVotingActive = votingStartNum <= currentTime && currentTime < votingEndNum;
    
    if (isVotingActive) {
      // Voting is still active, get current leader
      const [ids, names, parties, voteCounts] = await votingContract.getAllCandidates();
      
      if (ids.length === 0) {
        return res.json({
          success: true,
          votingStatus: "active",
          message: "No candidates have been added yet",
          timeRemaining: {
            hours: Math.floor((votingEndNum - currentTime) / 3600),
            minutes: Math.floor(((votingEndNum - currentTime) % 3600) / 60)
          }
        });
      }
      
      // Find the current leader
      let leaderIndex = 0;
      let maxVotes = Number(voteCounts[0]);
      
      for (let i = 1; i < voteCounts.length; i++) {
        if (Number(voteCounts[i]) > maxVotes) {
          maxVotes = Number(voteCounts[i]);
          leaderIndex = i;
        }
      }
      
      const timeRemaining = votingEndNum - currentTime;
      const hoursRemaining = Math.floor(timeRemaining / 3600);
      const minutesRemaining = Math.floor((timeRemaining % 3600) / 60);
      
      res.json({
        success: true,
        votingStatus: "active",
        message: "Voting is still active. Current leader:",
        currentLeader: {
          id: ids[leaderIndex].toString(),
          name: names[leaderIndex],
          party: parties[leaderIndex],
          voteCount: Number(voteCounts[leaderIndex])
        },
        timeRemaining: {
          hours: hoursRemaining,
          minutes: minutesRemaining,
          totalSeconds: timeRemaining
        },
        allCandidates: ids.map((id, index) => ({
          id: id.toString(),
          name: names[index],
          party: parties[index],
          voteCount: Number(voteCounts[index])
        }))
      });
      
    } else {
      // Voting has ended, get the official winner
      try {
        const [winnerId, winnerName, winnerParty, winnerVotes] = await votingContract.getWinner();
        
        res.json({
          success: true,
          votingStatus: "ended",
          message: "Voting has ended. Official winner:",
          winner: {
            id: winnerId.toString(),
            name: winnerName,
            party: winnerParty,
            voteCount: Number(winnerVotes)
          }
        });
      } catch (winnerError) {
        // If getWinner fails, it might be because voting hasn't started yet
        res.json({
          success: true,
          votingStatus: "not_started",
          message: "Voting has not started yet",
          votingStart: new Date(votingStartNum * 1000).toISOString(),
          votingEnd: new Date(votingEndNum * 1000).toISOString()
        });
      }
    }
    
  } catch (error) {
    console.error("Error getting winner:", error);
    res.status(500).json({ 
      error: "Failed to get winner", 
      message: error.message 
    });
  }
};

// Get voting dates
exports.getVotingDates = async (req, res) => {
  try {
    if (!votingContract) {
      return res.status(500).json({ 
        error: "Contract not initialized", 
        message: "Please ensure Hardhat node is running and contract is deployed" 
      });
    }
    
    const [votingStart, votingEnd] = await votingContract.getDates();
    const currentTime = Math.floor(Date.now() / 1000);
    
    res.json({
      success: true,
      votingStart: votingStart.toString(),
      votingEnd: votingEnd.toString(),
      votingStartDate: new Date(votingStart * 1000).toISOString(),
      votingEndDate: new Date(votingEnd * 1000).toISOString(),
      currentTime: currentTime,
      isVotingActive: votingStart <= currentTime && currentTime < votingEnd,
      timeRemaining: votingEnd > currentTime ? votingEnd - currentTime : 0
    });
    
  } catch (error) {
    console.error("Error getting dates:", error);
    res.status(500).json({ 
      error: "Failed to get dates", 
      message: error.message 
    });
  }
};

// Health check endpoint
exports.getHealth = async (req, res) => {
  res.json({ 
    status: "OK", 
    contractAddress: CONTRACT_ADDRESS,
    ownerAccount: ownerAccount,
    blockchainConnected: !!votingContract
  });
}; 