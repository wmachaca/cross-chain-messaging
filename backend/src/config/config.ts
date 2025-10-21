// Load environment variables FIRST - before any other imports!
import dotenv from 'dotenv';
dotenv.config();

import { anvilChain1, anvilChain2 } from './chains/anvil';

// Debug environment loading
console.log('🔍 Environment Debug:');
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('   ANVIL_CONTRACT_ADDRESS:', process.env.ANVIL_CONTRACT_ADDRESS);
console.log('   ANVIL_CONTRACT_ADDRESS_2:', process.env.ANVIL_CONTRACT_ADDRESS_2);
console.log('   ANVIL_VERIFIER_ADDRESS:', process.env.ANVIL_VERIFIER_ADDRESS);
console.log('   ANVIL_VERIFIER_ADDRESS_2:', process.env.ANVIL_VERIFIER_ADDRESS_2);

// Determine which chains to use based on environment
export const getActiveChains = () => {
  // Fix the environment detection
  const isDevelopment = process.env.NODE_ENV === 'development';
  const useTestnets = process.env.USE_TESTNETS === 'true';
  
  console.log('🔍 Chain Selection Debug:');
  console.log('   isDevelopment:', isDevelopment);
  console.log('   useTestnets:', useTestnets);
  
  if (isDevelopment && !useTestnets) {
    // Local development: only Anvil chains
    console.log('🔧 Using local Anvil chains for development');
    return [anvilChain1, anvilChain2];
  } else if (isDevelopment && useTestnets) {
    // Development with testnets - you can add more chains here later
    console.log('🌐 Using Anvil chains + testnets for development');
    return [anvilChain1, anvilChain2]; // Add testnets when needed
  } else {
    // Production - for now, just return Anvil chains
    console.log('🚀 Using configured chains for production');
    return [anvilChain1, anvilChain2];
  }
};

// Export active chains
export const SUPPORTED_CHAINS = getActiveChains();

// Contract addresses by chain ID - with debug logging
console.log('🔍 Building CONTRACT_ADDRESSES...');
export const CONTRACT_ADDRESSES: Record<number, `0x${string}`> = {
  [anvilChain1.id]: (process.env.ANVIL_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`,
  [anvilChain2.id]: (process.env.ANVIL_CONTRACT_ADDRESS_2 || '0x0000000000000000000000000000000000000000') as `0x${string}`,
};

console.log('📋 Final CONTRACT_ADDRESSES:', CONTRACT_ADDRESSES);

// Verifier addresses by chain ID
export const VERIFIER_ADDRESSES: Record<number, `0x${string}`> = {
  [anvilChain1.id]: (process.env.ANVIL_VERIFIER_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`,
  [anvilChain2.id]: (process.env.ANVIL_VERIFIER_ADDRESS_2 || '0x0000000000000000000000000000000000000000') as `0x${string}`,
};

// RPC URLs configuration
export const RPC_URLS: Record<number, string> = {
  [anvilChain1.id]: process.env.ANVIL_RPC_URL || anvilChain1.rpcUrls.default.http[0],
  [anvilChain2.id]: process.env.ANVIL_RPC_URL_2 || anvilChain2.rpcUrls.default.http[0],
};

// Chain names for logging (dynamically generated from chain objects)
export const CHAIN_NAMES: Record<number, string> = {
  [anvilChain1.id]: anvilChain1.name,
  [anvilChain2.id]: anvilChain2.name,
};

// Export configuration summary
export const CONFIG_SUMMARY = {
  supportedChains: SUPPORTED_CHAINS.length,
  chainIds: SUPPORTED_CHAINS.map(chain => chain.id),
  chainNames: SUPPORTED_CHAINS.map(chain => chain.name),
  rpcUrls: SUPPORTED_CHAINS.map(chain => RPC_URLS[chain.id]),
  contractAddresses: SUPPORTED_CHAINS.map(chain => CONTRACT_ADDRESSES[chain.id]),
  verifierAddresses: SUPPORTED_CHAINS.map(chain => VERIFIER_ADDRESSES[chain.id]),
  isDevelopment: process.env.NODE_ENV === 'development',
  useTestnets: process.env.USE_TESTNETS === 'true',
};

// Helper functions for chain management
export const getContractAddress = (chainId: number): `0x${string}` | null => {
  const address = CONTRACT_ADDRESSES[chainId];
  return address && address !== '0x0000000000000000000000000000000000000000' ? address : null;
};

export const getVerifierAddress = (chainId: number): `0x${string}` | null => {
  const address = VERIFIER_ADDRESSES[chainId];
  return address && address !== '0x0000000000000000000000000000000000000000' ? address : null;
};

export const isChainSupported = (chainId: number): boolean => {
  return SUPPORTED_CHAINS.some(chain => chain.id === chainId);
};
