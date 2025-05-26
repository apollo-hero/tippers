// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract VotingContract {
    address public owner;
    
    struct Candidate {
        string name;
        uint voteCount;
    }
    
    Candidate[] public candidates;
    mapping(address => bool) public hasVoted;
    mapping(address => uint) public voterChoice;
    
    event CandidateAdded(string name, uint index);
    event VoteCasted(address voter, uint candidateIndex);
    event WinnerDeclared(string winner, uint voteCount);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }
    
    modifier hasNotVoted() {
        require(!hasVoted[msg.sender], "You have already voted");
        _;
    }
    
    modifier validCandidate(uint _candidateIndex) {
        require(_candidateIndex < candidates.length, "Invalid candidate index");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    function addCandidate(string memory _name) public onlyOwner {
        require(bytes(_name).length > 0, "Candidate name cannot be empty");
        
        // Check if candidate already exists
        for (uint i = 0; i < candidates.length; i++) {
            require(
                keccak256(abi.encodePacked(candidates[i].name)) != keccak256(abi.encodePacked(_name)),
                "Candidate already exists"
            );
        }
        
        candidates.push(Candidate({
            name: _name,
            voteCount: 0
        }));
        
        emit CandidateAdded(_name, candidates.length - 1);
    }
    
    function vote(uint _candidateIndex) 
        public 
        hasNotVoted 
        validCandidate(_candidateIndex) 
    {
        hasVoted[msg.sender] = true;
        voterChoice[msg.sender] = _candidateIndex;
        candidates[_candidateIndex].voteCount++;
        
        emit VoteCasted(msg.sender, _candidateIndex);
    }
    
    function getCandidates() public view returns (Candidate[] memory) {
        return candidates;
    }
    
    function getWinner() public view returns (string memory name) {
        require(candidates.length > 0, "No candidates available");
        
        uint winningVoteCount = 0;
        uint winningIndex = 0;
        
        for (uint i = 0; i < candidates.length; i++) {
            if (candidates[i].voteCount > winningVoteCount) {
                winningVoteCount = candidates[i].voteCount;
                winningIndex = i;
            }
        }
        
        // Check for tie
        uint tieCount = 0;
        for (uint i = 0; i < candidates.length; i++) {
            if (candidates[i].voteCount == winningVoteCount) {
                tieCount++;
            }
        }
        
        if (tieCount > 1 && winningVoteCount > 0) {
            return "Tie - No clear winner";
        } else if (winningVoteCount == 0) {
            return "No votes cast yet";
        }
        
        return candidates[winningIndex].name;
    }
    
    function getCandidateCount() public view returns (uint) {
        return candidates.length;
    }
    
    function getTotalVotes() public view returns (uint) {
        uint total = 0;
        for (uint i = 0; i < candidates.length; i++) {
            total += candidates[i].voteCount;
        }
        return total;
    }
    
    function getVoterInfo(address _voter) public view returns (bool voted, uint choice) {
        return (hasVoted[_voter], voterChoice[_voter]);
    }
}