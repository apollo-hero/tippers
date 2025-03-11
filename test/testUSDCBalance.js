const axios = require('axios');

// Define the API endpoint
const API_URL = 'http://localhost:4098/api/v1/userUSDCBalance';

async function testUSDCBalanceRoute() {
  try {
    console.log('Testing USDC Balance Route...');
    console.log(`Making GET request to: ${API_URL}`);
    
    const response = await axios.get(API_URL);
    
    console.log('\nResponse Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log(`\nSuccess! USDC Balance: ${response.data.balance} ${response.data.symbol}`);
    } else {
      console.log('\nAPI request was not successful');
    }
  } catch (error) {
    console.error('\nError testing the route:');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received. Is the server running?');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
  }
}

// Run the test
testUSDCBalanceRoute();
