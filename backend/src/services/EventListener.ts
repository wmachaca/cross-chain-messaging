import { config, CONTRACT_ADDRESSES } from '../config/wagmi';
import { createPublicClient, getContract, http, parseAbi } from 'viem';

export class EventListener {
  private clients: Map<number, any> = new Map();

  constructor() {
    this.initializeClients();
  }

  private initializeClients() {
    for (const chain of config.chains) {
      const client = createPublicClient({
        chain,
        transport: http(),
      });

      this.clients.set(chain.id, client);
    }
  }

  async startListening() {
    console.log('🚀 Starting event listener...');
    for (const [chainId, client] of this.clients) {
      client.watchBlockNumber({
        onBlockNumber: async (blockNumber: bigint) => {
          console.log(`📡 New block on chain ${chainId}: ${blockNumber}`);
        },
      });
    }
  }
}
