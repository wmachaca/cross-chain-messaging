import { config, CONTRACT_ADDRESSES } from '../config/wagmi';
import { createPublicClient, getContract, http, parseAbi, parseAbiItem } from 'viem';
import type { PublicClient, WatchBlockNumberReturnType, Log, Address } from 'viem';
import { GameMove } from '../models/GameMove';
import { EventEmitter } from 'events';

interface ChainState {
  lastProcessedBlock: number;
  isHealthy: boolean;
  consecutiveErrors: number;
  lastError?: string;
}

interface EventListenerMetrics {
  totalEventsProcessed: number;
  eventsPerChain: Map<number, number>;
  lastEventTimestamp: number;
  startTime: number;
}

export class EventListener extends EventEmitter {
  private clients: Map<number, PublicClient> = new Map();
  private contracts: Map<number, any> = new Map();
  private unwatchFunctions: Map<number, WatchBlockNumberReturnType> = new Map();
  private chainStates: Map<number, ChainState> = new Map();
  private isListening: boolean = false;
  private metrics: EventListenerMetrics;
  private healthCheckInterval?: NodeJS.Timeout;
  
  // Configuration
  private readonly MAX_CONSECUTIVE_ERRORS = 5;
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
  private readonly RETRY_DELAY = 5000; // 5 seconds
  private readonly BLOCK_CONFIRMATION_BUFFER = 3; // Extra confirmations for safety

  constructor() {
    super();
    this.metrics = {
      totalEventsProcessed: 0,
      eventsPerChain: new Map(),
      lastEventTimestamp: 0,
      startTime: Date.now(),
    };
    this.initializeClients();
    this.startHealthCheck();
  }

  private initializeClients() {
    console.log('🔧 Initializing blockchain clients...');
    
    for (const chain of config.chains) {
      try {
        const client = createPublicClient({
          chain,
          transport: http(undefined, {
            timeout: 10000, // 10 second timeout
            retryCount: 3,
            retryDelay: 1000,
          }),
        });

        this.clients.set(chain.id, client);

        // Enhanced ABI with all relevant events
        const contract = getContract({
          address: CONTRACT_ADDRESSES[chain.id] as Address,
          abi: parseAbi([
            'event GameInitiated(bytes32 indexed gameId, address player1, uint256 stake)',
            'event MoveCommitted(bytes32 indexed gameId, address indexed player, uint8 move, uint256 blockNumber)',
            'event CrossChainProofSubmitted(bytes32 indexed gameId, bool proofValid)',
            'event GameResolved(bytes32 indexed gameId, address winner, address loser, uint256 burnedAmount)',
            // Additional helper functions
            'function getPlayerBalance(address player) external view returns (uint256)',
            'function getGameState(bytes32 gameId) external view returns (uint8)',
          ]),
          client,
        });

        this.contracts.set(chain.id, contract);

        // Initialize chain state
        this.chainStates.set(chain.id, {
          lastProcessedBlock: 0,
          isHealthy: true,
          consecutiveErrors: 0,
        });

        // Initialize metrics
        this.metrics.eventsPerChain.set(chain.id, 0);

        console.log(`✅ Initialized client for chain ${chain.id} (${chain.name})`);
      } catch (error) {
        console.error(`❌ Failed to initialize chain ${chain.id}:`, error);
        this.chainStates.set(chain.id, {
          lastProcessedBlock: 0,
          isHealthy: false,
          consecutiveErrors: 1,
          lastError: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  async startListening(): Promise<void> {
    if (this.isListening) {
      console.log('⚠️  EventListener is already running');
      return;
    }

    console.log('🚀 Starting cross-chain event listener...');
    this.isListening = true;
    this.metrics.startTime = Date.now();

    for (const [chainId, client] of this.clients) {
      await this.startChainListener(chainId, client);
    }

    console.log(`✅ Event listener started for ${this.unwatchFunctions.size} chains`);
    this.emit('listenerStarted', {
      chains: this.getMonitoredChains(),
      timestamp: new Date().toISOString(),
    });
  }

  private async startChainListener(chainId: number, client: PublicClient) {
    try {
      // Get current block as starting point
      const currentBlock = await client.getBlockNumber();
      const chainState = this.chainStates.get(chainId)!;
      chainState.lastProcessedBlock = Number(currentBlock);

      // Watch for new blocks with enhanced error handling
      const unwatch = client.watchBlockNumber({
        onBlockNumber: async (blockNumber: bigint) => {
          if (this.isListening) {
            await this.processNewBlock(chainId, Number(blockNumber));
          }
        },
        onError: (error) => {
          console.error(`❌ Block watcher error on chain ${chainId}:`, error);
          this.handleChainError(chainId, error);
        },
        poll: true,
        pollingInterval: this.getPollingInterval(chainId),
      });

      this.unwatchFunctions.set(chainId, unwatch);
      chainState.isHealthy = true;
      chainState.consecutiveErrors = 0;
      
      console.log(`📡 Listening to chain ${chainId} from block ${currentBlock}`);
    } catch (error) {
      console.error(`❌ Failed to start listener on chain ${chainId}:`, error);
      this.handleChainError(chainId, error);
      
      // Retry after delay
      setTimeout(() => {
        if (this.isListening) {
          this.startChainListener(chainId, client);
        }
      }, this.RETRY_DELAY);
    }
  }

  private getPollingInterval(chainId: number): number {
    // Optimize polling based on chain characteristics
    const intervalMap: Record<number, number> = {
      31337: 1000,   // Anvil - fast polling for development
      1: 12000,      // Ethereum Mainnet - 12 second blocks
      11155111: 12000, // Sepolia - 12 second blocks
      137: 2000,     // Polygon - 2 second blocks
      80001: 2000,   // Mumbai - 2 second blocks
    };

    return intervalMap[chainId] || 3000; // Default 3 seconds
  }

  private async processNewBlock(chainId: number, blockNumber: number) {
    const chainState = this.chainStates.get(chainId);
    if (!chainState || !chainState.isHealthy) {
      return;
    }

    try {
      // Only process blocks we haven't seen yet
      if (blockNumber <= chainState.lastProcessedBlock) {
        return;
      }

      // Check if block has sufficient finality
      if (!(await this.hasFinality(chainId, blockNumber))) {
        return;
      }

      // Get all relevant events from this block
      const events = await this.getMoveCommittedEvents(chainId, blockNumber);
      
      for (const event of events) {
        await this.processGameMoveEvent(event, chainId);
      }

      // Update processed block
      chainState.lastProcessedBlock = blockNumber;
      
      // Log progress for important milestones
      if (events.length > 0) {
        console.log(`📦 Processed ${events.length} events from block ${blockNumber} on chain ${chainId}`);
      }

    } catch (error) {
      console.error(`❌ Error processing block ${blockNumber} on chain ${chainId}:`, error);
      this.handleChainError(chainId, error);
    }
  }

  private async getMoveCommittedEvents(chainId: number, blockNumber: number): Promise<Log[]> {
    const client = this.clients.get(chainId);
    if (!client) {
      throw new Error(`Client not found for chain ${chainId}`);
    }
    
    try {
      const contractAddress = CONTRACT_ADDRESSES[chainId] as Address;
      
      const logs = await client.getLogs({
        address: contractAddress,
        event: parseAbiItem('event MoveCommitted(bytes32 indexed gameId, address indexed player, uint8 move, uint256 blockNumber)'),
        fromBlock: BigInt(blockNumber),
        toBlock: BigInt(blockNumber),
      });

      return logs;
    } catch (error) {
      console.error(`❌ Error getting events for chain ${chainId}, block ${blockNumber}:`, error);
      throw error;
    }
  }

  private async processGameMoveEvent(eventLog: Log, chainId: number): Promise<void> {
    try {
      const client = this.clients.get(chainId)!;
      
      // Parse the event log
      const parsedLog = client.parseEventLogs({
        abi: parseAbi(['event MoveCommitted(bytes32 indexed gameId, address indexed player, uint8 move, uint256 blockNumber)']),
        logs: [eventLog],
      })[0];

      if (!parsedLog) {
        console.warn('⚠️  Could not parse event log, skipping');
        return;
      }

      const { args, transactionHash, blockNumber } = parsedLog;
      const [gameId, player, move, eventBlockNumber] = args as [string, string, number, bigint];

      // Fetch additional data (player balance, gas used, etc.)
      const [balance, block] = await Promise.all([
        this.getPlayerBalance(chainId, player),
        client.getBlock({ blockNumber: eventLog.blockNumber! }),
      ]);

      const gameMove: GameMove = {
        gameId,
        player,
        move,
        chainId,
        blockNumber: Number(eventBlockNumber),
        balance: balance.toString(),
        txHash: transactionHash || '',
        timestamp: Number(block.timestamp),
      };

      // Update metrics
      this.metrics.totalEventsProcessed++;
      this.metrics.eventsPerChain.set(chainId, (this.metrics.eventsPerChain.get(chainId) || 0) + 1);
      this.metrics.lastEventTimestamp = Date.now();

      console.log(`🎮 Game move detected on chain ${chainId}:`, {
        gameId: gameMove.gameId.slice(0, 10) + '...',
        player: gameMove.player.slice(0, 6) + '...' + gameMove.player.slice(-4),
        move: this.getMoveLabel(gameMove.move),
        block: gameMove.blockNumber,
        txHash: gameMove.txHash.slice(0, 10) + '...',
      });

      // Emit event for other services
      this.emit('gameMoveDetected', gameMove);

    } catch (error) {
      console.error('❌ Error processing game move event:', error);
      throw error;
    }
  }

  private async getPlayerBalance(chainId: number, player: string): Promise<bigint> {
    try {
      const contract = this.contracts.get(chainId);
      if (!contract) {
        return BigInt(0);
      }

      const balance = await contract.read.getPlayerBalance([player as Address]);
      return balance as bigint;
    } catch (error) {
      console.warn(`⚠️  Could not fetch balance for ${player} on chain ${chainId}:`, error);
      return BigInt(0);
    }
  }

  private async hasFinality(chainId: number, blockNumber: number): Promise<boolean> {
    const client = this.clients.get(chainId);
    if (!client) {
      return false;
    }

    try {
      const currentBlock = Number(await client.getBlockNumber());
      const requiredConfirmations = this.getFinalityBlocks(chainId) + this.BLOCK_CONFIRMATION_BUFFER;
      
      return (currentBlock - blockNumber) >= requiredConfirmations;
    } catch (error) {
      console.warn(`⚠️  Could not check finality for chain ${chainId}:`, error);
      return false;
    }
  }

  private getFinalityBlocks(chainId: number): number {
    // Conservative finality requirements for cross-chain security
    const finalityMap: Record<number, number> = {
      31337: 1,      // Anvil - instant finality for testing
      1: 20,         // Ethereum Mainnet - 20 blocks for extra safety
      11155111: 15,  // Sepolia - 15 blocks
      137: 256,      // Polygon - 256 blocks (recommended)
      80001: 128,    // Mumbai - 128 blocks
    };

    return finalityMap[chainId] || 15; // Conservative default
  }

  private handleChainError(chainId: number, error: any) {
    const chainState = this.chainStates.get(chainId);
    if (!chainState) return;

    chainState.consecutiveErrors++;
    chainState.lastError = error instanceof Error ? error.message : String(error);

    if (chainState.consecutiveErrors >= this.MAX_CONSECUTIVE_ERRORS) {
      chainState.isHealthy = false;
      console.error(`💀 Chain ${chainId} marked as unhealthy after ${this.MAX_CONSECUTIVE_ERRORS} consecutive errors`);
      
      this.emit('chainUnhealthy', {
        chainId,
        error: chainState.lastError,
        consecutiveErrors: chainState.consecutiveErrors,
      });
    }
  }

  private startHealthCheck() {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, this.HEALTH_CHECK_INTERVAL);
  }

  private async performHealthCheck() {
    for (const [chainId, chainState] of this.chainStates) {
      if (!chainState.isHealthy && chainState.consecutiveErrors >= this.MAX_CONSECUTIVE_ERRORS) {
        console.log(`🏥 Attempting to restore chain ${chainId}...`);
        
        try {
          const client = this.clients.get(chainId);
          if (client) {
            // Test if chain is responsive
            await client.getBlockNumber();
            
            // Reset state and restart listener
            chainState.consecutiveErrors = 0;
            chainState.isHealthy = true;
            
            if (this.isListening && !this.unwatchFunctions.has(chainId)) {
              await this.startChainListener(chainId, client);
            }
            
            console.log(`✅ Chain ${chainId} restored to healthy state`);
            this.emit('chainRestored', { chainId });
          }
        } catch (error) {
          console.warn(`⚠️  Chain ${chainId} still unhealthy:`, error);
        }
      }
    }
  }

  private getMoveLabel(move: number): string {
    const labels: Record<number, string> = {
      1: 'Rock 🪨',
      2: 'Paper 📄',
      3: 'Scissors ✂️',
    };
    return labels[move] || `Unknown(${move})`;
  }

  async stopListening(): Promise<void> {
    if (!this.isListening) {
      return;
    }

    console.log('🛑 Stopping event listener...');
    this.isListening = false;

    // Stop health check
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Stop all watchers
    for (const [chainId, unwatch] of this.unwatchFunctions) {
      try {
        unwatch();
        console.log(`✅ Stopped listening on chain ${chainId}`);
      } catch (error) {
        console.error(`❌ Error stopping listener on chain ${chainId}:`, error);
      }
    }

    this.unwatchFunctions.clear();
    
    // Emit final metrics
    this.emit('listenerStopped', {
      runtime: Date.now() - this.metrics.startTime,
      totalEvents: this.metrics.totalEventsProcessed,
      eventsPerChain: Object.fromEntries(this.metrics.eventsPerChain),
    });

    console.log('✅ Event listener stopped gracefully');
  }

  // Public API methods
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
      chainStates: Object.fromEntries(this.chainStates),
      metrics: {
        ...this.metrics,
        eventsPerChain: Object.fromEntries(this.metrics.eventsPerChain),
        uptime: Date.now() - this.metrics.startTime,
      },
    };
  }

  getChainHealth(): Map<number, boolean> {
    const health = new Map<number, boolean>();
    for (const [chainId, state] of this.chainStates) {
      health.set(chainId, state.isHealthy);
    }
    return health;
  }

  // Force restart a specific chain listener
  async restartChainListener(chainId: number): Promise<void> {
    console.log(`🔄 Manually restarting listener for chain ${chainId}...`);
    
    // Stop existing watcher
    const unwatch = this.unwatchFunctions.get(chainId);
    if (unwatch) {
      unwatch();
      this.unwatchFunctions.delete(chainId);
    }

    // Reset chain state
    const chainState = this.chainStates.get(chainId);
    if (chainState) {
      chainState.consecutiveErrors = 0;
      chainState.isHealthy = true;
    }

    // Restart listener
    const client = this.clients.get(chainId);
    if (client && this.isListening) {
      await this.startChainListener(chainId, client);
    }
  }
}
