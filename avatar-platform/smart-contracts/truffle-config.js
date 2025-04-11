// Fix the Truffle configuration in avatar-platform/smart-contracts/truffle-config.js

const HDWalletProvider = require('@truffle/hdwallet-provider');
require('dotenv').config({ path: '../.env' });

// Get these values from environment variables
const MNEMONIC = process.env.MNEMONIC || '';
const INFURA_API_KEY = process.env.INFURA_API_KEY || '';
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || '';

module.exports = {
  /**
   * Networks define how you connect to your ethereum client and let you set the
   * defaults web3 uses to send transactions.
   */
  networks: {
    // For local development
    development: {
      host: "127.0.0.1",     // Localhost (default: none)
      port: 8545,            // Standard Ethereum port (default: none)
      network_id: "*",       // Any network (default: none)
    },
    
    // Sepolia testnet
    sepolia: {
      provider: () => new HDWalletProvider({
        mnemonic: MNEMONIC,
        providerOrUrl: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
        addressIndex: 0
      }),
      network_id: 11155111,  // Sepolia's network id
      gas: 5500000,          // Gas limit
      confirmations: 2,      // # of confirmations to wait between deployments
      timeoutBlocks: 200,    // # of blocks before deployment times out
      skipDryRun: true       // Skip dry run before migrations
    },
    
    // Goerli testnet
    goerli: {
      provider: () => new HDWalletProvider({
        mnemonic: MNEMONIC,
        providerOrUrl: `https://goerli.infura.io/v3/${INFURA_API_KEY}`,
        addressIndex: 0
      }),
      network_id: 5,         // Goerli's network id
      gas: 5500000,          // Gas limit
      confirmations: 2,      // # of confirmations to wait between deployments
      timeoutBlocks: 200,    // # of blocks before deployment times out
      skipDryRun: true       // Skip dry run before migrations
    },
    
    // Mainnet
    mainnet: {
      provider: () => new HDWalletProvider({
        mnemonic: MNEMONIC,
        providerOrUrl: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
        addressIndex: 0
      }),
      network_id: 1,         // Mainnet's id
      gas: 5500000,          // Gas limit
      gasPrice: 50000000000, // 50 gwei (in wei)
      confirmations: 2,      // # of confirmations to wait between deployments
      timeoutBlocks: 200,    // # of blocks before deployment times out
      skipDryRun: true       // Skip dry run before migrations
    },
  },

  // Set default mocha options
  mocha: {
    timeout: 100000
  },

  // Configure compilers
  compilers: {
    solc: {
      version: "0.8.17",     // Fetch exact version from solc-bin
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
        evmVersion: "london"
      }
    }
  },
  
  // Plugin for contract verification
  plugins: [
    'truffle-plugin-verify'
  ],
  
  // Verification API keys
  api_keys: {
    etherscan: ETHERSCAN_API_KEY
  }
};

