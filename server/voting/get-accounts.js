const { ethers } = require('ethers');

async function getAccounts() {
    try {
        const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
        const accounts = await provider.listAccounts();
        
        console.log('🔑 Available Hardhat Accounts:');
        console.log('═══════════════════════════════════════════════════════════════');
        
        // Standard Hardhat private keys
        const privateKeys = [
            "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
            "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
            "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
            "0x7c852118e8d7c8c6e8c2b4b2f4b4f4b4f4b4f4b4f4b4f4b4f4b4f4b4f4b4f4b",
            "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
            "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba",
            "0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e",
            "0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f0702cce00b771f",
            "0xacf77d9c92e69b4c93e62f9a84e8c8e8c8e8c8e8c8e8c8e8c8e8c8e8c8e8c8e8c",
            "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984"
        ];
        
        accounts.forEach((address, index) => {
            console.log(`Account #${index}:`);
            console.log(`  Address: ${address.toString()}`);
            if (index < privateKeys.length) {
                console.log(`  Private Key: ${privateKeys[index]}`);
            }
            console.log('');
        });
        
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('💡 Use any of these addresses in your voting requests!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('💡 Make sure Hardhat node is running: npm run node');
    }
}

getAccounts(); 