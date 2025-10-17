import { createConfig, http } from 'wagmi';
import { sepolia, polygonMumbai } from 'wagmi/chains';
import { anvil } from './chains/anvil'; // Import the Anvil chain configuration

// Wagmi configuration for the backend
export const config = createConfig({
  chains: [anvil, sepolia, polygonMumbai], // Include Anvil, Sepolia, and Polygon Mumbai
  transports: {
    [anvil.id]: http(),
    [sepolia.id]: http(process.env.ETH_SEPOLIA_RPC), // Use environment variable for Sepolia RPC
    [polygonMumbai.id]: http(process.env.POLYGON_MUMBAI_RPC), // Use environment variable for Polygon Mumbai RPC
  },
});

// Contract addresses for each chain
export const CONTRACT_ADDRESSES = {
  [anvil.id]: process.env.ANVIL_CONTRACT_ADDRESS || '0x...', // Replace with your deployed contract address on Anvil
  [sepolia.id]: process.env.SEPOLIA_CONTRACT_ADDRESS || '0x...', // Replace with your deployed contract address on Sepolia
  [polygonMumbai.id]: process.env.MUMBAI_CONTRACT_ADDRESS || '0x...', // Replace with your deployed contract address on Polygon Mumbai
} as const;
