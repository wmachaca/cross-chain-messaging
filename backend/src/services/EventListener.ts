import { config, CONTRACT_ADDRESSES } from '../config/wagmi';
import { createPublicClient, getContract, http, parseAbi, parseAbiItem } from 'viem';

export class EventListener {
  private clients: Map<number, any> = new Map();
  private contracts: Map<number, any> = new Map();

  constructor() {
    this.initializeClients();
  }

  private initializeClients() {
    // Create Viem clients for each chain (Wagmi-compatible)
    for (const chain of config.chains) {
      const client = createPublicClient({
        chain,
        transport: http(),
      });

      this.clients.set(chain.id, client);

      // Initialize contract instances
      const contract = getContract({
        address: CONTRACT_ADDRESSES[chain.id],
        abi: parseAbi([
          'event MoveCommitted(bytes32 indexed gameId, address indexed player, uint8 move, uint256 blockNumber, uint256 balance)',
          'function commitMove(bytes32 gameId) external',
        ]),
        client,
      });

      this.contracts.set(chain.id, contract);
    }
  }

  async startListening() {
    console.log('🚀 Starting cross-chain event listener...');

    for (const [chainId, client] of this.clients) {
      // Watch for new blocks on each chain
      const unwatch = client.watchBlockNumber({
        onBlockNumber: async (blockNumber: bigint) => {
          await this.processNewBlock(chainId, Number(blockNumber));
        },
        poll: true, // Poll for new blocks
      });

      console.log(`📡 Listening to chain ${chainId}`);
    }
  }

  private async processNewBlock(chainId: number, blockNumber: number) {
    // Check if block has finality
    if (!(await this.hasFinality(chainId, blockNumber))) {
      return; // Wait for finality
    }

    // Get MoveCommitted events from this block
    const events = await this.getMoveCommittedEvents(chainId, blockNumber);
    
    for (const event of events) {
      await this.processGameMove(event, chainId);
    }
  }

  private async getMoveCommittedEvents(chainId: number, blockNumber: number) {
    const client = this.clients.get(chainId);
    
    try {
      const logs = await client.getLogs({
        address: CONTRACT_ADDRESSES[chainId],
        event: parseAbiItem('event MoveCommitted(bytes32 indexed gameId, address indexed player, uint8 move, uint256 blockNumber, uint256 balance)'),
        fromBlock: BigInt(blockNumber),
        toBlock: BigInt(blockNumber),
      });

      return logs;
    } catch (error) {
      console.error(`Error getting events for chain ${chainId}:`, error);
      return [];
    }
  }

  private async hasFinality(chainId: number, blockNumber: number): Promise<boolean> {
    const client = this.clients.get(chainId);
    const currentBlock = Number(await client.getBlockNumber());
    
    const finalityBlocks = this.getFinalityBlocks(chainId);
    return (currentBlock - blockNumber) >= finalityBlocks;
  }

  private getFinalityBlocks(chainId: number): number {
    // Different finality for different chains
    const finalityMap: Record<number, number> = {
      31337: 1,    // Anvil - instant finality for testing
      11155111: 12, // Sepolia - 12 blocks
      80001: 128,   // Mumbai - 128 blocks
    };

    return finalityMap[chainId] || 12; // Default to 12
  }
}
