# Postman Documentation for Voting System API

## Base URL
```
http://localhost:3000
```

## Authentication
No authentication required. The system uses blockchain accounts for authorization.

---

## 1. Health Check

### GET /health
Check if the API server is running and connected to the blockchain.

**Request:**
```
GET http://localhost:3000/health
```

**Response:**
```json
{
  "status": "OK",
  "contractAddress": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  "ownerAccount": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "blockchainConnected": true
}
```

---

## 2. Add Candidate (Owner Only)

### POST /candidates
Add a new candidate to the voting system. Only the contract owner can add candidates.

**Request:**
```
POST http://localhost:3000/candidates
Content-Type: application/json
```

**Body:**
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
  "message": "Candidate John Doe added successfully by owner",
  "transactionHash": "0x1234567890abcdef...",
  "addedBy": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
}
```

**Error Responses:**

Missing required fields:
```json
{
  "error": "Missing required fields",
  "message": "All fields 'name', 'party', and 'ownerAddress' are required"
}
```

Unauthorized (wrong owner):
```json
{
  "error": "Unauthorized",
  "message": "Only the contract owner can add candidates. Provided address is not the owner."
}
```

Invalid owner account:
```json
{
  "error": "Invalid owner account",
  "message": "Owner address not found in the system. Use one of the Hardhat test accounts."
}
```

Contract error:
```json
{
  "error": "Failed to add candidate",
  "message": "Only owner can call this function"
}
```

---

## 3. List All Candidates

### GET /candidates
Get all candidates and their current vote counts.

**Request:**
```
GET http://localhost:3000/candidates
```

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

---

## 4. Cast a Vote

### POST /vote
Cast a vote for a candidate using a private key.

**Request:**
```
POST http://localhost:3000/vote
Content-Type: application/json
```

**Body:**
```json
{
  "accountAddress": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "candidateIndex": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Vote cast successfully",
  "transactionHash": "0x1234567890abcdef..."
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

Voting not active:
```json
{
  "error": "Failed to cast vote",
  "message": "Voting is not active"
}
```

---

## 5. Get Winner/Current Leader

### GET /winner
Get the winner (if voting has ended) or current leader (if voting is active).

**Request:**
```
GET http://localhost:3000/winner
```

**Response - Voting Active:**
```json
{
  "success": true,
  "votingStatus": "active",
  "message": "Voting is still active. Current leader:",
  "currentLeader": {
    "id": "1",
    "name": "John Doe",
    "party": "Democratic Party",
    "voteCount": "5"
  },
  "timeRemaining": {
    "hours": 2,
    "minutes": 30,
    "totalSeconds": 9000
  },
  "allCandidates": [
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
  ]
}
```

**Response - Voting Ended:**
```json
{
  "success": true,
  "votingStatus": "ended",
  "message": "Voting has ended. Official winner:",
  "winner": {
    "id": "1",
    "name": "John Doe",
    "party": "Democratic Party",
    "voteCount": "8"
  }
}
```

**Response - No Candidates:**
```json
{
  "success": true,
  "votingStatus": "active",
  "message": "No candidates have been added yet",
  "timeRemaining": {
    "hours": 2,
    "minutes": 30
  }
}
```

---

## 6. Set Voting Dates (Owner Only)

### POST /set-dates
Set the voting period start and end dates. Only the contract owner can set dates.

**Request:**
```
POST http://localhost:3000/set-dates
Content-Type: application/json
```

**Body:**
```json
{
  "startDate": 1704067200,
  "endDate": 1704153600
}
```

**Notes:**
- `startDate` and `endDate` must be Unix timestamps (seconds since epoch)
- `startDate` must be in the future (within ~11 days)
- `endDate` must be after `startDate`
- Dates can only be set once

**Response:**
```json
{
  "success": true,
  "message": "Voting period set successfully",
  "transactionHash": "0x1234567890abcdef..."
}
```

**Error Response:**
```json
{
  "error": "Failed to set voting dates",
  "message": "Voting dates already set"
}
```

---

## 7. Get Voting Dates

### GET /dates
Get the current voting dates and status.

**Request:**
```
GET http://localhost:3000/dates
```

**Response:**
```json
{
  "success": true,
  "votingStart": "1704067200",
  "votingEnd": "1704153600",
  "votingStartDate": "2024-01-01T00:00:00.000Z",
  "votingEndDate": "2024-01-02T00:00:00.000Z",
  "currentTime": 1704070800,
  "isVotingActive": true,
  "timeRemaining": 82800
}
```

---

## Postman Collection Setup

### Environment Variables
Create a Postman environment with these variables:

```
BASE_URL: http://localhost:3000
OWNER_ADDRESS: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
OWNER_PRIVATE_KEY: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
VOTER1_ADDRESS: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
VOTER1_PRIVATE_KEY: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
VOTER2_ADDRESS: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
VOTER2_PRIVATE_KEY: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
```

### Collection Structure
```
Voting System API
├── Health Check
│   └── GET /health
├── Admin Functions
│   ├── POST /candidates
│   └── POST /set-dates
├── Voting Functions
│   ├── GET /candidates
│   ├── POST /vote
│   └── GET /winner
└── Utility Functions
    └── GET /dates
```

---

## Testing Workflow

### 1. Setup Voting Period
```bash
# Set voting dates (24 hours from now)
curl -X POST http://localhost:3000/set-dates \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": 1704067200,
    "endDate": 1704153600
  }'
```

### 2. Add Candidates
```bash
# Add first candidate
curl -X POST http://localhost:3000/candidates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "party": "Democratic Party",
    "ownerAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
  }'

# Add second candidate
curl -X POST http://localhost:3000/candidates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "party": "Republican Party",
    "ownerAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
  }'
```

### 3. Cast Votes
```bash
# Vote for candidate 1
curl -X POST http://localhost:3000/vote \
  -H "Content-Type: application/json" \
  -d '{
    "privateKey": "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
    "candidateIndex": 1
  }'

# Vote for candidate 2
curl -X POST http://localhost:3000/vote \
  -H "Content-Type: application/json" \
  -d '{
    "privateKey": "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
    "candidateIndex": 2
  }'
```

### 4. Check Results
```bash
# Get current results
curl http://localhost:3000/winner

# Get all candidates
curl http://localhost:3000/candidates
```

---

## Common Error Codes

| Status Code | Error | Description |
|-------------|-------|-------------|
| 400 | Missing required fields | Required parameters are missing |
| 400 | Already voted | Account has already cast a vote |
| 400 | Invalid candidate ID | Candidate index is out of range |
| 400 | Invalid owner account | Owner address not found in the system |
| 403 | Unauthorized | Provided address is not the contract owner |
| 500 | Contract not initialized | Hardhat node not running |
| 500 | Failed to add candidate | Only owner can add candidates |
| 500 | Failed to cast vote | Voting not active or other contract error |
| 500 | Failed to set voting dates | Dates already set or invalid |

---

## Hardhat Account Private Keys

For testing, use these Hardhat account private keys:

```
Account #0: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 (Owner)
Account #1: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
Account #2: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
Account #3: 0x7c852118e8d7c8c6e8c2b4b2f4b4f4b4f4b4f4b4f4b4f4b4f4b4f4b4f4b4f4b
Account #4: 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a
Account #5: 0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba
Account #6: 0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e
Account #7: 0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f0702cce00b771f
Account #8: 0xacf77d9c92e69b4c93e62f9a84e8c8e8c8e8c8e8c8e8c8e8c8e8c8e8c8e8c8e8c
Account #9: 0x1f9840a85d5af5bf1d1762f925bdaddc4201f984
```

---

## Tips for Testing

1. **Start the system first**: Run `npm run launch` before testing
2. **Use different private keys**: Each account can only vote once
3. **Check voting dates**: Ensure voting is active before casting votes
4. **Monitor transaction hashes**: Use them to track blockchain transactions
5. **Use the CLI**: `node voting-cli.js` for interactive testing
6. **Check Hardhat accounts**: Run `npm run accounts` to see available accounts
7. **Test owner verification**: Try adding candidates with different addresses to test the owner verification

## Testing Owner Verification

To test the owner verification feature, try these scenarios:

### Valid Owner (should work):
```json
{
  "name": "John Doe",
  "party": "Democratic Party",
  "ownerAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
}
```

### Wrong Owner (should fail with 403):
```json
{
  "name": "John Doe",
  "party": "Democratic Party",
  "ownerAddress": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
}
```

### Missing Owner Address (should fail with 400):
```json
{
  "name": "John Doe",
  "party": "Democratic Party"
}
``` 