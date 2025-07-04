require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337
    },
    development: {
      url: "http://127.0.0.1:7545",
      chainId: 1337
    }
  },
  paths: {
    sources: "./server/voting",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
}; 