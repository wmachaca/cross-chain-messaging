import { defineChain } from 'viem';

// Primary Anvil instance (port 8545)
export const anvilChain1 = defineChain({
  id: 31337,
  name: 'Anvil Chain 1',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
    public: {
      http: ['http://127.0.0.1:8545'],
    },
  },
  blockExplorers: {
    default: { name: 'Local Explorer', url: 'http://127.0.0.1:8545' },
  },
  testnet: true,
});

// Secondary Anvil instance (port 8546) - for cross-chain testing
export const anvilChain2 = defineChain({
  id: 31338,
  name: 'Anvil Chain 2',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8546'],
    },
    public: {
      http: ['http://127.0.0.1:8546'],
    },
  },
  blockExplorers: {
    default: { name: 'Local Explorer 2', url: 'http://127.0.0.1:8546' },
  },
  testnet: true,
});
