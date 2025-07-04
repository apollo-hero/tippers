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
  "party": "Democratic Party"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Candidate John Doe added successfully",
  "transactionHash": "0x..."
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

### 6. Get Winner
**GET** `/winner`

Returns the candidate with the highest vote count. Can only be called after voting has ended.

**Response:**
```json
{
  "success": true,
  "winner": {
    "id": "1",
    "name": "John Doe",
    "party": "Democratic Party",
    "voteCount": "5"
  }
}
```

**Error Response (if voting is still active):**
```json
{
  "error": "Failed to get winner",
  "message": "Voting is still active"
}
```

### 7. Get Voting Dates
**GET** `/dates`

Returns the start and end time for the voting period.

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
  -d '{"name": "John Doe", "party": "Democratic Party", "ownerAddress": "<OWNER_ADDRESS>"}'
```

2. **Get all candidates:**
```bash
curl http://localhost:3000/api/voting/candidates
```

3. **Cast a vote:**
```bash
curl -X POST http://localhost:3000/api/voting/vote \
  -H "Content-Type: application/json" \
  -d '{"accountAddress": "<ACCOUNT_ADDRESS>", "candidateIndex": 1}'
```

4. **Get winner:**
```bash
curl http://localhost:3000/api/voting/winner
```

### Using JavaScript/Node.js

```javascript
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/voting';

// Add candidate
const addCandidate = async (name, party) => {
  const response = await axios.post(`