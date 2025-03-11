// Import the controller function directly
const { getUserUSDCBalance } = require('../server/controllers/salimdevApiTest');

// Create mock request and response objects
const mockRequest = {};

const mockResponse = {
  status: function(statusCode) {
    console.log(`Response Status: ${statusCode}`);
    this.statusCode = statusCode;
    return this;
  },
  json: function(data) {
    console.log('Response Data:', JSON.stringify(data, null, 2));
    this.data = data;
    return this;
  }
};

// Create mock next function
const mockNext = (error) => {
  if (error) {
    console.error('Error passed to next:', error);
  }
};

// Test the controller function
console.log('Testing getUserUSDCBalance controller function...');
console.log('---------------------------------------------------');

getUserUSDCBalance(mockRequest, mockResponse, mockNext)
  .then(() => {
    console.log('---------------------------------------------------');
    console.log('Test completed successfully!');
    
    if (mockResponse.statusCode === 200 && mockResponse.data.success) {
      console.log(`\nUSER_ID: ${require('../server/controllers/salimdevApiTest').USER_ID}`);
      console.log(`USDC Balance: ${mockResponse.data.balance} ${mockResponse.data.symbol}`);
      console.log(`Raw Balance: ${mockResponse.data.rawBalance}`);
      console.log(`Decimals: ${mockResponse.data.decimals}`);
    }
  })
  .catch(error => {
    console.error('Test failed with error:', error);
  });
