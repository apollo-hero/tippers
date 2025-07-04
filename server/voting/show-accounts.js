const { spawn } = require('child_process');

console.log('🔗 Starting Hardhat node to show accounts...\n');

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

// Start Hardhat node
const hardhatNode = spawn('npx', ['hardhat', 'node'], {
    stdio: 'pipe',
    shell: true
});

let hardhatOutput = '';

// Capture Hardhat node output
hardhatNode.stdout.on('data', (data) => {
    const output = data.toString();
    hardhatOutput += output;
    process.stdout.write(output); // Show the output in real-time
});

hardhatNode.stderr.on('data', (data) => {
    const output = data.toString();
    hardhatOutput += output;
    process.stderr.write(output); // Show the output in real-time
});

// Wait for accounts to be displayed
setTimeout(() => {
    console.log('\n\n🔑 HARDHAT ACCOUNTS SUMMARY:');
    console.log('═══════════════════════════════════════════════════════════════');
    
    const accounts = extractAccounts(hardhatOutput);
    if (accounts.length > 0) {
        accounts.forEach(account => {
            console.log(`Account #${account.number}:`);
            console.log(`  Address: ${account.address}`);
            console.log(`  Private Key: ${account.privateKey}`);
            console.log(`  Balance: ${account.balance}`);
            console.log('');
        });
        
        console.log('═══════════════════════════════════════════════════════════════');
        console.log(`📝 OWNER ACCOUNT (for admin): ${accounts[0].address}`);
        console.log(`🔐 OWNER PRIVATE KEY: ${accounts[0].privateKey}`);
        console.log('');
        console.log('💡 Keep this information safe! These are your test accounts.');
        console.log('🛑 Press Ctrl+C to stop the Hardhat node');
    } else {
        console.log('❌ No accounts found in the output');
    }
}, 3000);

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Hardhat node...');
    hardhatNode.kill('SIGINT');
    console.log('✅ Hardhat node stopped');
    process.exit(0);
}); 