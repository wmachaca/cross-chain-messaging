import { config, CONTRACT_ADDRESSES } from '../config/wagmi';
import { createPublicClient, getContract, http, parseAbi, parseAbiItem } from 'viem';
import type { PublicClient, WatchBlockNumberReturnType, Log } from 'viem';
import { GameMove } from '../models/GameMove';
import { EventEmitter } from 'events';

export class EventListener extends EventEmitter {
  private clients: Map<number, PublicClient> = new Map();
  private contracts: Map<number, any> = new Map();
  private unwatchFunctions: Map<number, WatchBlockNumberReturnType> = new Map();
  private isListening: boolean = false;

  constructor() {
    super();
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

      // Initialize contract instances for CrossChainRPS
      const contract = getContract({
        address: CONTRACT_ADDRESSES[chain.id],
        abi: parseAbi([
          // Events from your real CrossChainRPS contract
          'event GameInitiated(bytes32 indexed gameId, address player1, uint256 stake)',
          'event MoveCommitted(bytes32 indexed gameId, address player, uint8 move, uint256 blockNumber)', 
          'event CrossChainProofSubmitted(bytes32 indexed gameId, bool proofValid)',
          'event GameResolved(bytes32 indexed gameId, address winner, address loser, uint256 burnedAmount)',
          // Functions from your real contract
          'function createGame() external payable returns (bytes32)',
          'function commitMove(bytes32 gameId) external'
        ]),
        client,
      });

      this.contracts.set(chain.id, contract);
    }
  }

  async startListening(): Promise<void> {
    if (this.isListening) {
      console.log('⚠️  EventListener is already running');
      return;
    }

    console.log('🚀 Starting cross-chain event listener...');
    this.isListening = true;

    for (const [chainId, client] of this.clients) {
      try {
        // Watch for new blocks on each chain
        const unwatch = client.watchBlockNumber({
          onBlockNumber: async (blockNumber: bigint) => {
            if (this.isListening) {
              await this.processNewBlock(chainId, Number(blockNumber));
            }
          },
          poll: true,
          pollingInterval: 1000, // Poll every second
        });

        this.unwatchFunctions.set(chainId, unwatch);
        console.log(`📡 Listening to chain ${chainId}`);
      } catch (error) {
        console.error(`❌ Failed to start listening on chain ${chainId}:`, error);
      }
    }

    console.log(`Event listener started for ${this.unwatchFunctions.size} chains`);
  }

  async stopListening(): Promise<void> {
    if (!this.isListening) {
      return;
    }

    console.log('� Stopping event listener...');
    this.isListening = false;

    for (const [chainId, unwatch] of this.unwatchFunctions) {
      try {
        unwatch();
        console.log(`Stopped listening on chain ${chainId}`);
      } catch (error) {
        console.error(`❌ Error stopping listener on chain ${chainId}:`, error);
      }
    }

    this.unwatchFunctions.clear();
    console.log('Event listener stopped');
  }

  private async processNewBlock(chainId: number, blockNumber: number) {
    try {
      // Check if block has finality
      if (!(await this.hasFinality(chainId, blockNumber))) {
        return; // Wait for finality
      }

      // Get MoveCommitted events from this block
      const events = await this.getMoveCommittedEvents(chainId, blockNumber);
      
      for (const event of events) {
        await this.handleRawEvent(event, chainId);
      }
    } catch (error) {
      console.error(`❌ Error processing block ${blockNumber} on chain ${chainId}:`, error);
    }
  }

  private async handleRawEvent(eventLog: Log, chainId: number): Promise<void> {
    try {
      // Parse the raw event log to extract move data
      const { args, transactionHash, blockNumber } = eventLog;
      
      if (!args) {
        console.warn('⚠️  Event log has no args, skipping');
        return;
      }

      // Extract event arguments from your real CrossChainRPS contract
      const [gameId, player, move, eventBlockNumber] = args as [string, string, number, bigint];

      const gameMove: GameMove = {
        gameId,
        player,
        move,
        chainId,
        blockNumber: Number(eventBlockNumber),
        balance: '0', // Will be fetched separately if needed
        txHash: transactionHash || '',
        timestamp: Math.floor(Date.now() / 1000),
      };

      console.log('📡 EventListener detected game move:', {
        gameId: gameMove.gameId.slice(0, 10) + '...',
        player: gameMove.player.slice(0, 6) + '...' + gameMove.player.slice(-4),
        move: gameMove.move,
        chainId: gameMove.chainId,
        block: gameMove.blockNumber,
      });

      // Emit event for GameOrchestrator and other services to handle
      this.emit('gameMoveDetected', gameMove);

    } catch (error) {
      console.error('❌ Error handling raw event:', error);
    }
  }

  private async getMoveCommittedEvents(chainId: number, blockNumber: number) {
    const client = this.clients.get(chainId);
    
    try {
      const logs = await client.getLogs({
        address: CONTRACT_ADDRESSES[chainId],
        event: parseAbiItem('event MoveCommitted(bytes32 indexed gameId, address player, uint8 move, uint256 blockNumber)'),
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

  // Helper methods for external access
  getMonitoredChains(): number[] {
    return Array.from(this.clients.keys());
  }

  isActive(): boolean {
    return this.isListening;
  }

  getStatus() {
    return {
      isListening: this.isListening,
      chainsMonitored: this.getMonitoredChains(),
      activeWatchers: this.unwatchFunctions.size,
    };
  }
}
