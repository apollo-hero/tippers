// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Voting {
    struct Candidate {
        uint id;
        string name;
        string party; 
        uint voteCount;
    }

    mapping (uint => Candidate) public candidates;
    mapping (address => bool) public voters;

    address public owner;
    uint public countCandidates;
    uint256 public votingEnd;
    uint256 public votingStart;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    function addCandidate(string memory name, string memory party) public onlyOwner returns(uint) {
        countCandidates++;
        candidates[countCandidates] = Candidate(countCandidates, name, party, 0);
        return countCandidates;
    }
   
    function vote(uint candidateID) public {
       require((votingStart <= block.timestamp) && (votingEnd > block.timestamp), "Voting is not active");
       require(candidateID > 0 && candidateID <= countCandidates, "Invalid candidate ID");
       require(!voters[msg.sender], "You have already voted");
              
       voters[msg.sender] = true;
       candidates[candidateID].voteCount++;      
    }
    
    function checkVote() public view returns(bool){
        return voters[msg.sender];
    }
       
    function getCountCandidates() public view returns(uint) {
        return countCandidates;
    }

    function getCandidate(uint candidateID) public view returns (uint,string memory, string memory,uint) {
        require(candidateID > 0 && candidateID <= countCandidates, "Invalid candidate ID");
        return (candidateID,candidates[candidateID].name,candidates[candidateID].party,candidates[candidateID].voteCount);
    }

    function getAllCandidates() public view returns (uint[] memory, string[] memory, string[] memory, uint[] memory) {
        uint[] memory ids = new uint[](countCandidates);
        string[] memory names = new string[](countCandidates);
        string[] memory parties = new string[](countCandidates);
        uint[] memory voteCounts = new uint[](countCandidates);
        
        for (uint i = 1; i <= countCandidates; i++) {
            ids[i-1] = candidates[i].id;
            names[i-1] = candidates[i].name;
            parties[i-1] = candidates[i].party;
            voteCounts[i-1] = candidates[i].voteCount;
        }
        
        return (ids, names, parties, voteCounts);
    }

    function getWinner() public view returns (uint, string memory, string memory, uint) {
        require(block.timestamp > votingEnd, "Voting is still active");
        require(countCandidates > 0, "No candidates exist");
        
        uint winningCandidateId = 1;
        uint maxVotes = candidates[1].voteCount;
        
        for (uint i = 2; i <= countCandidates; i++) {
            if (candidates[i].voteCount > maxVotes) {
                maxVotes = candidates[i].voteCount;
                winningCandidateId = i;
            }
        }
        
        return (
            candidates[winningCandidateId].id,
            candidates[winningCandidateId].name,
            candidates[winningCandidateId].party,
            candidates[winningCandidateId].voteCount
        );
    }

    function setDates(uint256 _startDate, uint256 _endDate) public onlyOwner {
        require((votingEnd == 0) && (votingStart == 0) && (_startDate + 1000000 > block.timestamp) && (_endDate > _startDate));
        votingEnd = _endDate;
        votingStart = _startDate;
    }

    function getDates() public view returns (uint256,uint256) {
      return (votingStart,votingEnd);
    }
} 