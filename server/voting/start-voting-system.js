const { spawn } = require('child_process');
let open;
try {
    open = require('open');
} catch (error) {
    // Fallback for different open package versions
    open = require('open').default || require('open');
}

console.log('🚀 Starting Voting System...\n');

// Function to run a command and return a promise
function runCommand(command, args, name) {
    return new Promise((resolve, reject) => {
        console.log(`📦 Starting ${name}...`);
        
        const child = spawn(command, args, {
            stdio: 'inherit',
            shell: true
        });
        
        child.on('error', (error) => {
            console.error(`❌ Error starting ${name}:`, error);
            reject(error);
        });
        
        child.on('close', (code) => {
            if (code === 0) {
                console.log(`✅ ${name} completed successfully`);
                resolve();
            } else {
                console.error(`❌ ${name} exited with code ${code}`);
                reject(new Error(`${name} exited with code ${code}`));
            }
        });
        
        // Store the child process for later termination
        child.name = name;
        global.childProcesses = global.childProcesses || [];
        global.childProcesses.push(child);
    });
}

// Function to wait for a specific time
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to extract accounts from Hardhat node output
function extractAccounts(output) {
    const accounts = [];
    const lines = output.split('\n');
    
    for (const line of lines) {
        // Look for lines that contain account addresses and private keys
        const match = line.match(/Account #(\d+): (0x[a-fA-F0-9]{40}) \(([0-9]+) ETH\)/);
        if (match) {
            const accountNumber = match[1];
            const address = match[2];
            
            // Find the corresponding private key in the next few lines
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
    
    return accounts;
}

// Main startup sequence
async function startSystem() {
    try {
        // Step 1: Start Hardhat node
        console.log('🔗 Starting Hardhat node...');
        const hardhatNode = spawn('npx', ['hardhat', 'node'], {
            stdio: 'pipe',
            shell: true
        });
        
        let hardhatOutput = '';
        
        // Capture Hardhat node output
        hardhatNode.stdout.on('data', (data) => {
            const output = data.toString();
            hardhatOutput += output;
            process.stdout.write(output); // Still show the output in real-time
        });
        
        hardhatNode.stderr.on('data', (data) => {
            const output = data.toString();
            hardhatOutput += output;
            process.stderr.write(output); // Still show the output in real-time
        });
        
        // Wait for Hardhat node to start and extract accounts
        await wait(5000);
        console.log('✅ Hardhat node started');
        
        // Extract and display accounts
        const accounts = extractAccounts(hardhatOutput);
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
            console.log('');
        }
        
        // Step 2: Deploy contract
        console.log('📄 Deploying smart contract...');
        await runCommand('npx', ['hardhat', 'run', 'scripts/deploy.js', '--network', 'localhost'], 'Contract Deployment');
        
        // Step 3: Start backend server
        console.log('🔧 Starting backend server...');
        const backendServer = spawn('node', ['server.js'], {
            stdio: 'pipe',
            shell: true
        });
        
        // Wait for backend to start
        await wait(2000);
        console.log('✅ Backend server started');
        

        
        console.log('\n🎉 Voting System is now running!');
        console.log('\n📱 API Server: http://localhost:3000');
        console.log('\n🌐 Web UI: http://localhost:3000');
        console.log('\n🔗 Available API Endpoints:');
        console.log('  • POST /candidates - Add a candidate (owner only)');
        console.log('  • GET /candidates - List all candidates');
        console.log('  • POST /vote - Cast a vote');
        console.log('  • GET /winner - Get the winner');
        console.log('  • GET /health - Health check');
        console.log('\n💡 Press Ctrl+C to stop all services');
        
        // Open the web UI in the default browser
        setTimeout(() => {
            try {
                open('http://localhost:3000');
                console.log('\n🚀 Opening web UI in your browser...');
            } catch (error) {
                console.log('\n🌐 Please open http://localhost:3000 in your browser');
            }
        }, 2000);
        
        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down services...');
            
            if (global.childProcesses) {
                global.childProcesses.forEach(child => {
                    child.kill('SIGINT');
                });
            }
            
            hardhatNode.kill('SIGINT');
            backendServer.kill('SIGINT');
            
            console.log('✅ All services stopped');
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ Error starting system:', error.message);
        process.exit(1);
    }
}

// Start the system
startSystem(); 