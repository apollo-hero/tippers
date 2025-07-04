# Voting System API Documentation

This document describes the REST API endpoints for the decentralized voting system, now integrated into the tippers-main backend.

## Base URL
```
http://localhost:3000/api/voting
```

## Authentication
The API uses the first account from the Hardhat node as the owner/admin account. All owner-only operations are performed using this account.

## Endpoints

### 1. Health Check
**GET** `/health`

Returns the health status of the API and blockchain connection.

**Response:**
```json
{
  "status": "OK",
  "contractAddress": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  "ownerAccount": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "blockchainConnected": true
}
```

### 2. Add Candidate (Owner Only)
**POST** `/candidates`

Adds a new candidate to the voting system. Only the contract owner can perform this action.

**Request Body:**
```json
{
  "name": "John Doe",
  "party": "Democratic Party",
  "ownerAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Candidate John Doe added successfully",
  "transactionHash": "0x...",
  "addedBy": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
}
```

**Error Response:**
```json
{
  "error": "Failed to add candidate",
  "message": "Only owner can call this function"
}
```

### 3. List All Candidates
**GET** `/candidates`

Returns all candidates and their current vote counts.

**Response:**
```json
{
  "success": true,
  "candidates": [
    {
      "id": "1",
      "name": "John Doe",
      "party": "Democratic Party",
      "voteCount": "5"
    },
    {
      "id": "2",
      "name": "Jane Smith",
      "party": "Republican Party",
      "voteCount": "3"
    }
  ],
  "totalCandidates": 2
}
```

### 4. Cast Vote
**POST** `/vote`

Casts a vote for a specific candidate. Each account can vote only once.

**Request Body:**
```json
{
  "accountAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "candidateIndex": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Vote cast successfully",
  "transactionHash": "0x..."
}
```

**Error Responses:**

Already voted:
```json
{
  "error": "Already voted",
  "message": "This account has already cast a vote"
}
```

Invalid candidate:
```json
{
  "error": "Failed to cast vote",
  "message": "Invalid candidate ID"
}
```

### 5. Set Voting Dates (Owner Only)
**POST** `/set-dates`

Set the start and end time for the voting period.

**Request Body:**
```json
{
  "startDate": 1640995200,
  "endDate": 1641081600
}
```

**Response:**
```json
{
  "success": true,
  "message": "Voting period set successfully",
  "transactionHash": "0x..."
}
```

### 6. Get Winner
**GET** `/winner`

Returns the candidate with the highest vote count. Can only be called after voting has ended.

**Response:**
```json
{
  "success": true,
  "votingStatus": "ended",
  "message": "Voting has ended. Official winner:",
  "winner": {
    "id": "1",
    "name": "John Doe",
    "party": "Democratic Party",
    "voteCount": 5
  }
}
```

**Response (if voting is still active):**
```json
{
  "success": true,
  "votingStatus": "active",
  "message": "Voting is still active. Current leader:",
  "currentLeader": {
    "id": "1",
    "name": "John Doe",
    "party": "Democratic Party",
    "voteCount": 5
  },
  "timeRemaining": {
    "hours": 2,
    "minutes": 30,
    "totalSeconds": 9000
  }
}
```

### 7. Get Voting Dates
**GET** `/dates`

Returns the start and end time for the voting period.

**Response:**
```json
{
  "success": true,
  "votingStart": "1640995200",
  "votingEnd": "1641081600",
  "votingStartDate": "2022-01-01T00:00:00.000Z",
  "votingEndDate": "2022-01-02T00:00:00.000Z",
  "currentTime": 1640995800,
  "isVotingActive": true,
  "timeRemaining": 85800
}
```

## Setup Instructions

1. **Install dependencies**
   ```sh
   npm install
   ```
2. **Start Hardhat Node**
   ```sh
   npm run node
   ```
3. **Deploy Contract**
   ```sh
   npm run deploy:local
   ```
4. **Start API Server**
   ```sh
   npm run server
   ```
   Or, for all at once (node, deploy, server):
   ```sh
   npm run voting:dev
   ```

## Environment Variables

Create a `.env` file in `tippers-main` with the following variables:

```env
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
PORT=3000
```

## Example Usage

### Using curl

1. **Add a candidate:**
```bash
curl -X POST http://localhost:3000/api/voting/candidates \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "party": "Democratic Party", "ownerAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"}'
```

2. **Get all candidates:**
```bash
curl http://localhost:3000/api/voting/candidates
```

3. **Cast a vote:**
```bash
curl -X POST http://localhost:3000/api/voting/vote \
  -H "Content-Type: application/json" \
  -d '{"accountAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", "candidateIndex": 1}'
```

4. **Get winner:**
```bash
curl http://localhost:3000/api/voting/winner
```

5. **Set voting dates:**
```bash
curl -X POST http://localhost:3000/api/voting/set-dates \
  -H "Content-Type: application/json" \
  -d '{"startDate": 1640995200, "endDate": 1641081600}'
```

6. **Get voting dates:**
```bash
curl http://localhost:3000/api/voting/dates
```

### Using JavaScript/Node.js

```javascript
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/voting';

// Add candidate
const addCandidate = async (name, party, ownerAddress) => {
  const response = await axios.post(`${BASE_URL}/candidates`, { 
    name, 
    party, 
    ownerAddress 
  });
  return response.data;
};

// Get candidates
const getCandidates = async () => {
  const response = await axios.get(`${BASE_URL}/candidates`);
  return response.data;
};

// Cast vote
const castVote = async (accountAddress, candidateIndex) => {
  const response = await axios.post(`${BASE_URL}/vote`, { 
    accountAddress, 
    candidateIndex 
  });
  return response.data;
};

// Get winner
const getWinner = async () => {
  const response = await axios.get(`${BASE_URL}/winner`);
  return response.data;
};

// Set voting dates
const setVotingDates = async (startDate, endDate) => {
  const response = await axios.post(`${BASE_URL}/set-dates`, { 
    startDate, 
    endDate 
  });
  return response.data;
};

// Get voting dates
const getVotingDates = async () => {
  const response = await axios.get(`${BASE_URL}/dates`);
  return response.data;
};

// Health check
const getHealth = async () => {
  const response = await axios.get(`${BASE_URL}/health`);
  return response.data;
};

// Example usage
async function example() {
  try {
    // Check health
    const health = await getHealth();
    console.log('Health:', health);

    // Add a candidate
    const candidate = await addCandidate(
      'John Doe', 
      'Democratic Party',
      '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
    );
    console.log('Candidate added:', candidate);

    // Get all candidates
    const candidates = await getCandidates();
    console.log('Candidates:', candidates);

    // Cast a vote
    const vote = await castVote(
      '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', 
      1
    );
    console.log('Vote cast:', vote);

    // Get winner
    const winner = await getWinner();
    console.log('Winner:', winner);

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

example();
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200`: Success
- `400`: Bad Request (missing fields, already voted, invalid candidate, etc.)
- `403`: Forbidden (unauthorized owner operations)
- `500`: Internal Server Error (contract not deployed, blockchain issues, etc.)

## Security Notes

- Only the contract owner can add candidates and set voting dates
- Each account can vote only once per voting period
- Voting is restricted to the configured time period
- All transactions are signed and verified on the blockchain
- Use only the provided Hardhat test accounts for testing
- The contract owner is the first account from the Hardhat node

## Testing Accounts

The system uses these Hardhat test accounts:

- `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` (Owner)
- `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
- And more...

Use these accounts for testing the voting functionality.