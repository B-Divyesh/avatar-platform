import { ethers } from "ethers";
import AvatarContractABI from "../contracts/AvatarContract.json";

/**
 * Get contract address based on network ID
 * @param {string} networkId Ethereum network ID
 * @returns {string} Contract address for the network
 */
export const getContractAddress = (networkId) => {
  const deployedNetworks = {
    "1": process.env.REACT_APP_MAINNET_CONTRACT_ADDRESS, // Mainnet
    "5": process.env.REACT_APP_GOERLI_CONTRACT_ADDRESS,  // Goerli
    "11155111": process.env.REACT_APP_SEPOLIA_CONTRACT_ADDRESS, // Sepolia
  };
  
  return deployedNetworks[networkId] || process.env.REACT_APP_CONTRACT_ADDRESS;
};

/**
 * Get blockchain explorer URL based on network ID
 * @param {string} networkId Ethereum network ID
 * @returns {string} Explorer base URL
 */
export const getExplorerUrl = (networkId) => {
  const explorers = {
    "1": "https://etherscan.io",
    "5": "https://goerli.etherscan.io",
    "11155111": "https://sepolia.etherscan.io",
  };
  
  return explorers[networkId] || "https://etherscan.io";
};

/**
 * Create a contract transaction and wait for it to be mined
 * @param {Object} contract Ethers.js contract instance
 * @param {string} method Contract method to call
 * @param {Array} args Arguments for the method
 * @param {Object} options Transaction options (value, gasLimit, etc.)
 * @returns {Promise<Object>} Transaction receipt
 */
export const executeContractTransaction = async (contract, method, args = [], options = {}) => {
  try {
    const tx = await contract[method](...args, options);
    const receipt = await tx.wait();
    return receipt;
  } catch (error) {
    console.error(`Error executing ${method}:`, error);
    
    // Extract more useful error message
    let errorMessage = error.message;
    
    // Handle specific error types better
    if (error.code === 'ACTION_REJECTED') {
      errorMessage = "Transaction was rejected by the user";
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.data?.message) {
      errorMessage = error.data.message;
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * Format contract error messages to be more user-friendly
 * @param {Error} error Error object from contract call
 * @returns {string} User-friendly error message
 */
export const formatContractError = (error) => {
  let message = error.message || "An unknown error occurred";
  
  // Common error patterns
  if (message.includes("insufficient funds")) {
    return "Insufficient funds in your wallet to complete this transaction";
  }
  
  if (message.includes("user rejected transaction")) {
    return "Transaction was cancelled";
  }
  
  if (message.includes("execution reverted")) {
    // Extract revert reason if available
    const reasonMatch = message.match(/reason="([^"]+)"/);
    if (reasonMatch && reasonMatch[1]) {
      return `Transaction failed: ${reasonMatch[1]}`;
    }
    return "Transaction failed on the blockchain";
  }
  
  return message;
};

/**
 * Parse contract event from transaction receipt
 * @param {Object} receipt Transaction receipt
 * @param {Object} contract Ethers.js contract instance
 * @param {string} eventName Name of the event to parse
 * @returns {Object|null} Parsed event or null if not found
 */
export const parseContractEvent = (receipt, contract, eventName) => {
  if (!receipt || !receipt.logs) {
    return null;
  }
  
  // Find the event log
  for (const log of receipt.logs) {
    try {
      const parsedLog = contract.interface.parseLog(log);
      if (parsedLog.name === eventName) {
        return {
          name: parsedLog.name,
          args: parsedLog.args,
          signature: parsedLog.signature
        };
      }
    } catch (e) {
      // Skip logs that can't be parsed by this contract
      continue;
    }
  }
  
  return null;
};