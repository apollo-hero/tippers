require("@nomicfoundation/hardhat-chai-matchers");
require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-network-helpers"); // optional but handy

module.exports = {
  solidity: "0.8.20",
  paths: { sources: "./contracts", tests: "./test" }
};
