#!/usr/bin/env node

const readline = require('readline');
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Helper function to make API calls
async function makeApiCall(method, endpoint, data = null) {
    try {
        const config = {
            method,
            url: `${API_BASE_URL}${endpoint}`,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (data) {
            config.data = data;
        }
        
        const response = await axios(config);
        return response.data;
    } catch (error) {
        if (error.response) {
            throw new Error(`API Error: ${error.response.data.error || error.response.statusText}`);
        } else {
            throw new Error(`Network Error: ${error.message}`);
        }
    }
}

// Display menu
function showMenu() {
    console.log('\n🗳️  VOTING SYSTEM CLI');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('1. Add a candidate (Owner only)');
    console.log('2. List all candidates');
    console.log('3. Cast a vote');
    console.log('4. Get winner/current leader');
    console.log('5. Set voting dates (Owner only)');
    console.log('6. Get voting dates');
    console.log('7. Health check');
    console.log('8. Show Hardhat accounts');
    console.log('0. Exit');
    console.log('═══════════════════════════════════════════════════════════════');
}

// Add candidate function
async function addCandidate() {
    try {
        const name = await question('Enter candidate name: ');
        const party = await question('Enter candidate party: ');
        
        console.log('\n⏳ Adding candidate...');
        const result = await makeApiCall('POST', '/candidates', { name, party });
        console.log('✅ Success:', result.message);
        console.log('📝 Transaction Hash:', result.transactionHash);
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

// List candidates function
async function listCandidates() {
    try {
        console.log('\n⏳ Fetching candidates...');
        const result = await makeApiCall('GET', '/candidates');
        
        if (result.candidates.length === 0) {
            console.log('📋 No candidates found');
        } else {
            console.log(`📋 Found ${result.totalCandidates} candidate(s):`);
            console.log('═══════════════════════════════════════════════════════════════');
            result.candidates.forEach((candidate, index) => {
                console.log(`${index + 1}. ${candidate.name} (${candidate.party})`);
                console.log(`   Votes: ${candidate.voteCount}`);
                console.log('');
            });
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

// Cast vote function
async function castVote() {
    try {
        // First get candidates to show options
        console.log('\n⏳ Fetching candidates...');
        const candidatesResult = await makeApiCall('GET', '/candidates');
        
        if (candidatesResult.candidates.length === 0) {
            console.log('❌ No candidates available for voting');
            return;
        }
        
        console.log('\n📋 Available candidates:');
        candidatesResult.candidates.forEach((candidate, index) => {
            console.log(`${index + 1}. ${candidate.name} (${candidate.party})`);
        });
        
        const candidateIndex = parseInt(await question('\nEnter candidate number: ')) - 1;
        const accountAddress = await question('Enter your account address: ');
        
        if (candidateIndex < 0 || candidateIndex >= candidatesResult.candidates.length) {
            console.log('❌ Invalid candidate number');
            return;
        }
        
        console.log('\n⏳ Casting vote...');
        const result = await makeApiCall('POST', '/vote', {
            accountAddress,
            candidateIndex
        });
        
        console.log('✅ Success:', result.message);
        console.log('📝 Transaction Hash:', result.transactionHash);
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

// Get winner function
async function getWinner() {
    try {
        console.log('\n⏳ Fetching winner/current leader...');
        const result = await makeApiCall('GET', '/winner');
        
        if (result.votingStatus === 'active') {
            console.log('🗳️  Voting is still active!');
            console.log(`⏰ Time remaining: ${result.timeRemaining.hours}h ${result.timeRemaining.minutes}m`);
            console.log('\n🏆 Current Leader:');
            console.log(`   Name: ${result.currentLeader.name}`);
            console.log(`   Party: ${result.currentLeader.party}`);
            console.log(`   Votes: ${result.currentLeader.voteCount}`);
            
            console.log('\n📊 All Candidates:');
            result.allCandidates.forEach((candidate, index) => {
                console.log(`${index + 1}. ${candidate.name} (${candidate.party}) - ${candidate.voteCount} votes`);
            });
        } else if (result.votingStatus === 'ended') {
            console.log('🏆 Official Winner:');
            console.log(`   Name: ${result.winner.name}`);
            console.log(`   Party: ${result.winner.party}`);
            console.log(`   Votes: ${result.winner.voteCount}`);
        } else {
            console.log('📅 Voting has not started yet');
            console.log(`   Start: ${result.votingStart}`);
            console.log(`   End: ${result.votingEnd}`);
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

// Set voting dates function
async function setVotingDates() {
    try {
        console.log('\n📅 Set Voting Period');
        console.log('Enter dates in Unix timestamp format (seconds since epoch)');
        
        const startDate = parseInt(await question('Enter start date (Unix timestamp): '));
        const endDate = parseInt(await question('Enter end date (Unix timestamp): '));
        
        console.log('\n⏳ Setting voting dates...');
        const result = await makeApiCall('POST', '/set-dates', { startDate, endDate });
        console.log('✅ Success:', result.message);
        console.log('📝 Transaction Hash:', result.transactionHash);
        console.log(`📅 Voting period: ${new Date(startDate * 1000)} to ${new Date(endDate * 1000)}`);
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

// Get voting dates function
async function getVotingDates() {
    try {
        console.log('\n⏳ Fetching voting dates...');
        const result = await makeApiCall('GET', '/dates');
        
        console.log('📅 Voting Dates:');
        console.log(`   Start: ${result.votingStartDate}`);
        console.log(`   End: ${result.votingEndDate}`);
        console.log(`   Status: ${result.isVotingActive ? 'Active' : 'Inactive'}`);
        
        if (result.isVotingActive) {
            const hours = Math.floor(result.timeRemaining / 3600);
            const minutes = Math.floor((result.timeRemaining % 3600) / 60);
            console.log(`   Time remaining: ${hours}h ${minutes}m`);
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

// Health check function
async function healthCheck() {
    try {
        console.log('\n⏳ Checking API health...');
        const result = await makeApiCall('GET', '/health');
        console.log('✅ API Status:', result.status);
        console.log('📊 Contract Address:', result.contractAddress);
        console.log('👤 Owner Account:', result.ownerAccount);
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

// Show Hardhat accounts
async function showAccounts() {
    try {
        console.log('\n⏳ Fetching Hardhat accounts...');
        const { spawn } = require('child_process');
        
        const hardhatNode = spawn('npx', ['hardhat', 'node'], {
            stdio: 'pipe',
            shell: true
        });
        
        let output = '';
        hardhatNode.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        // Wait for accounts to be displayed
        setTimeout(() => {
            const lines = output.split('\n');
            const accounts = [];
            
            for (const line of lines) {
                const match = line.match(/Account #(\d+): (0x[a-fA-F0-9]{40}) \(([0-9]+) ETH\)/);
                if (match) {
                    const accountNumber = match[1];
                    const address = match[2];
                    
                    for (let i = lines.indexOf(line) + 1; i < Math.min(lines.indexOf(line) + 5, lines.length); i++) {
                        const privateKeyMatch = lines[i].match(/Private Key: (0x[a-fA-F0-9]{64})/);
                        if (privateKeyMatch) {
                            accounts.push({
                                number: accountNumber,
                                address: address,
                                privateKey: privateKeyMatch[1],
                                balance: match[3] + ' ETH'
                            });
                            break;
                        }
                    }
                }
            }
            
            if (accounts.length > 0) {
                console.log('\n🔑 Hardhat Accounts:');
                console.log('═══════════════════════════════════════════════════════════════');
                accounts.forEach(account => {
                    console.log(`Account #${account.number}:`);
                    console.log(`  Address: ${account.address}`);
                    console.log(`  Private Key: ${account.privateKey}`);
                    console.log(`  Balance: ${account.balance}`);
                    console.log('');
                });
                console.log('═══════════════════════════════════════════════════════════════');
                console.log(`📝 Owner Account (for admin): ${accounts[0].address}`);
                console.log(`🔐 Owner Private Key: ${accounts[0].privateKey}`);
            } else {
                console.log('❌ No accounts found. Make sure Hardhat node is running.');
            }
            
            hardhatNode.kill('SIGINT');
        }, 3000);
        
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

// Helper function for user input
function question(query) {
    return new Promise((resolve) => {
        rl.question(query, resolve);
    });
}

// Main CLI loop
async function main() {
    console.log('🚀 Voting System CLI Started');
    console.log('📡 Connecting to API at:', API_BASE_URL);
    
    while (true) {
        showMenu();
        const choice = await question('\nEnter your choice (0-8): ');
        
        switch (choice) {
            case '1':
                await addCandidate();
                break;
            case '2':
                await listCandidates();
                break;
            case '3':
                await castVote();
                break;
            case '4':
                await getWinner();
                break;
            case '5':
                await setVotingDates();
                break;
            case '6':
                await getVotingDates();
                break;
            case '7':
                await healthCheck();
                break;
            case '8':
                await showAccounts();
                break;
            case '0':
                console.log('\n👋 Goodbye!');
                rl.close();
                process.exit(0);
            default:
                console.log('❌ Invalid choice. Please try again.');
        }
        
        await question('\nPress Enter to continue...');
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Goodbye!');
    rl.close();
    process.exit(0);
});

// Start the CLI
main().catch(console.error); 