export const anvil = {
  id: 31337,
  name: 'Anvil',
  network: 'anvil',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'], // Local Anvil RPC URL
    },
    public: {
      http: ['http://127.0.0.1:8545'], // Public fallback (same as default for Anvil)
    },
  },
} as const;
