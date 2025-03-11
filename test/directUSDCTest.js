const ethers = require('ethers');

// Define the same constants as in the controller
const abi = [
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function balanceOf(address a) view returns (uint)"
];

const USDC_ADDRESS = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
const RPC_URL = "https://arbitrum.llamarpc.com";
const USER_ID = "0xF7F1f95421ECeCD2Df65af5cdF86d0cc2Ecc374a";

async function testGetUserUSDCBalance() {
    try {
        console.log('Testing USDC Balance function directly...');
        console.log(`Checking balance for user: ${USER_ID}`);
        console.log(`Using RPC URL: ${RPC_URL}`);
        console.log(`USDC Contract Address: ${USDC_ADDRESS}`);
        
        // Create provider and contract instances
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(USDC_ADDRESS, abi, provider);
        
        // Get balance and token information
        console.log('Fetching balance...');
        const balance = await contract.balanceOf(USER_ID);
        console.log('Fetching decimals...');
        const decimals = await contract.decimals();
        console.log('Fetching symbol...');
        const symbol = await contract.symbol();
        
        // Format and display results
        const formattedBalance = ethers.formatUnits(balance, decimals);
        
        console.log('\nResults:');
        console.log('---------------------------');
        console.log(`USDC Balance: ${formattedBalance} ${symbol}`);
        console.log(`Raw Balance: ${balance.toString()}`);
        console.log(`Decimals: ${decimals}`);
        console.log('---------------------------');
        
        return {
            success: true,
            balance: formattedBalance,
            rawBalance: balance.toString(), // Convert BigInt to string
            decimals,
            symbol
        };
    } catch (error) {
        console.error('\nError testing the USDC balance function:');
        console.error(error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Run the test
testGetUserUSDCBalance()
    .then(result => {
        // Use a custom replacer function to handle BigInt serialization
        const replacer = (key, value) => 
            typeof value === 'bigint' ? value.toString() : value;
            
        console.log('\nTest completed with result:', JSON.stringify(result, replacer, 2));
    })
    .catch(error => {
        console.error('\nTest failed with error:', error);
    });
