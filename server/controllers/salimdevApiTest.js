const ethers = require("ethers");

const abi = [
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function balanceOf(address a) view returns (uint)"
];

const USDC_ADDRESS = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
const RPC_URL = "https://arbitrum.llamarpc.com";
const USER_ID = "0xF7F1f95421ECeCD2Df65af5cdF86d0cc2Ecc374a";

// Get User USDC Balance
exports.getUserUSDCBalance = async (req, res, next) => {
    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);

        const contract = new ethers.Contract(USDC_ADDRESS, abi, provider);
        const balance = await contract.balanceOf(USER_ID);
        const decimals = await contract.decimals();
        const formattedBalance = ethers.formatUnits(balance, decimals);

        const symbol = await contract.symbol();
        
        // Convert all potential BigInt values to strings to avoid serialization issues
        const responseData = {
            success: true,
            balance: formattedBalance.toString(),
            decimals: decimals.toString(),
            symbol: symbol.toString(),
            rawBalance: balance.toString()
        };
        
        res.status(200).json(responseData);
    } catch (error) {
        console.error("Error fetching USDC balance:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching USDC balance",
            error: error.message
        });
    }
};
