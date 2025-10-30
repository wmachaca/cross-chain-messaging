import { EventEmitter } from 'events';
import { createPublicClient, getContract, http, parseAbi, parseAbiItem } from 'viem';
import { GameMove, GameMoveBuilder } from '../models/GameMove';
import { 
  CONTRACT_ADDRESSES, 
  VERIFIER_ADDRESSES, 
  RPC_URLS, 
  SUPPORTED_CHAINS,
  CHAIN_NAMES,
  CONFIG_SUMMARY
} from '../config/config';

export class EventListener extends EventEmitter {
  private clients: Map<number, any> = new Map();
  private contracts: Map<number, any> = new Map();
  private isListening: boolean = false;
  private unwatchFunctions: Array<() => void> = [];

  constructor() {
    super();
    console.log('🎯 EventListener: Initializing with simple configuration...');
    console.log('📋 Config Summary:', CONFIG_SUMMARY);
    console.log(`🔧 Active chains: ${SUPPORTED_CHAINS.map(c => `${c.name} (${c.id})`).join(', ')}`);
  }

  // STEP 1: Basic initialization (IMPLEMENT FIRST)
  async initialize(): Promise<void> {
    console.log('🔧 EventListener: Starting initialization...');
    
    try {
      await this.initializeClients();
      console.log('✅ EventListener: Initialization complete');
    } catch (error) {
      console.error('❌ EventListener: Initialization failed:', error);
      throw error;
    }
  }

  // STEP 2: Client setup (IMPLEMENT SECOND)
  private async initializeClients(): Promise<void> {
    console.log('📡 EventListener: Setting up blockchain clients...');
    console.log(`🎯 Target chains: ${SUPPORTED_CHAINS.length} chains`);
    
    try {
      // Clear existing clients/contracts
      this.clients.clear();
      this.contracts.clear();
      
      // Create Viem clients for each configured chain
      for (const chain of SUPPORTED_CHAINS) {
        console.log(`🔗 Connecting to ${CHAIN_NAMES[chain.id]} (ID: ${chain.id})...`);
        
        try {
          // Create public client with configured transport
          const client = createPublicClient({
            chain,
            transport: http(RPC_URLS[chain.id], {
              retryCount: 3,
              retryDelay: 1000,
            }),
          });

          // Test the connection by fetching latest block
          const blockNumber = await client.getBlockNumber();
          const chainId = await client.getChainId();
          
          console.log(`✅ ${CHAIN_NAMES[chain.id]}: Connected successfully!`);
          console.log(`   📊 Latest block: ${blockNumber.toString()}`);
          console.log(`   🔍 Chain ID verified: ${chainId}`);
          console.log(`   🌐 RPC URL: ${RPC_URLS[chain.id]}`);
          
          // Store the client
          this.clients.set(chain.id, client);
          
          // Initialize contract if address is available
          await this.initializeContract(chain.id, client);
          
        } catch (chainError) {
          console.error(`❌ Failed to connect to ${CHAIN_NAMES[chain.id]} (${chain.id}):`, {
            error: chainError instanceof Error ? chainError.message : chainError,
            rpcUrl: RPC_URLS[chain.id],
          });
          
          // Don't throw - continue with other chains
        }
      }
      
      const successfulChains = this.clients.size;
      const totalChains = SUPPORTED_CHAINS.length;
      
      if (successfulChains === 0) {
        throw new Error('❌ Failed to connect to any blockchain networks');
      }
      
      console.log(`✅ Client initialization complete:`);
      console.log(`   🎯 Connected: ${successfulChains}/${totalChains} chains`);
      console.log(`   📡 Active clients: ${Array.from(this.clients.keys()).map(id => CHAIN_NAMES[id]).join(', ')}`);
      console.log(`   📄 Contracts initialized: ${this.contracts.size}`);
      
    } catch (error) {
      console.error('❌ Critical error during client initialization:', error);
      throw error;
    }
  }

  /**
   * Initialize contract for a specific chain
   */
  private async initializeContract(chainId: number, client: any): Promise<void> {
    try {
      const contractAddress = CONTRACT_ADDRESSES[chainId];
      const verifierAddress = VERIFIER_ADDRESSES[chainId];
      
      if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
        console.log(`⚠️  No contract address configured for ${CHAIN_NAMES[chainId]}`);
        return;
      }

      // Create contract instance with comprehensive ABI
      const contract = getContract({
        address: contractAddress,
        abi: parseAbi([
          // Events we want to listen to
          'event MoveCommitted(bytes32 indexed gameId, address indexed player, uint8 move, uint256 blockNumber, uint256 balance)',
          'event GameInitiated(bytes32 indexed gameId, address player1, uint256 stake)',
          'event CrossChainProofSubmitted(bytes32 indexed gameId, bool proofValid)',
          'event GameResolved(bytes32 indexed gameId, address winner, address loser, uint256 burnedAmount)',
          
          // Functions we might need to call
          'function commitMove(bytes32 gameId) external',
          'function games(bytes32) external view returns (address,address,uint8,uint8,uint256,uint256,uint256,bool,uint8)',
          'function balances(address) external view returns (uint256)',
          'function chainId() external view returns (uint256)',
        ]),
        client,
      });

      this.contracts.set(chainId, contract);
      
      console.log(`✅ Contract initialized for ${CHAIN_NAMES[chainId]}:`);
      console.log(`   📄 Contract: ${contractAddress}`);
      console.log(`   🔍 Verifier: ${verifierAddress || 'Not configured'}`);
      
    } catch (error) {
      console.error(`❌ Failed to initialize contract for ${CHAIN_NAMES[chainId]}:`, 
        error instanceof Error ? error.message : error
      );
    }
  }

  // STEP 3: Start listening - REAL IMPLEMENTATION
  async startListening(): Promise<void> {
    console.log('🚀 EventListener: Starting to listen for events...');
    
    if (this.isListening) {
      console.log('⚠️  EventListener: Already listening');
      return;
    }

    try {
      await this.initialize();
      
      // Start watching for new blocks on each connected chain
      console.log('🔥 Starting block watchers for all chains...');
      
      for (const [chainId, client] of this.clients) {
        const chainName = CHAIN_NAMES[chainId];
        console.log(`📡 Setting up block watcher for ${chainName} (${chainId})`);
        
        // Watch for new blocks on this chain
        const unwatch = client.watchBlockNumber({
          onBlockNumber: async (blockNumber: bigint) => {
            console.log(`🆕 New block on ${chainName}: ${blockNumber.toString()}`);
            await this.processNewBlock(chainId, Number(blockNumber));
          },
          poll: true, // Use polling for reliability
          pollingInterval: 2000, // Poll every 2 seconds
          onError: (error: Error) => {
            console.error(`❌ Block watcher error on ${chainName}:`, error.message);
          }
        });

        // Store the unwatch function for cleanup
        this.unwatchFunctions.push(unwatch);
        console.log(`✅ Block watcher active for ${chainName}`);
      }
      
      this.isListening = true;
      
      console.log('✅ EventListener: Now listening for cross-chain events on all chains!');
      console.log('📊 EventListener: Status updated -', {
        active: this.isActive(),
        clientsInitialized: this.clients.size,
        contractsInitialized: this.contracts.size,
        watchersActive: this.unwatchFunctions.length,
      });
      
    } catch (error) {
      console.error('❌ EventListener: Failed to start listening:', error);
      throw error;
    }
  }

  // STEP 4: Enhanced stop listening with proper cleanup
  async stopListening(): Promise<void> {
    console.log('🛑 EventListener: Stopping event listener...');
    
    // Stop all block watchers
    console.log(`🧹 Stopping ${this.unwatchFunctions.length} block watchers...`);
    this.unwatchFunctions.forEach((unwatch, index) => {
      try {
        unwatch();
        console.log(`✅ Stopped watcher ${index + 1}`);
      } catch (error) {
        console.error(`❌ Error stopping watcher ${index + 1}:`, error);
      }
    });
    this.unwatchFunctions = [];
    
    this.isListening = false;
    console.log('✅ EventListener: Stopped listening');
  }

  // STEP 5: Status methods (IMPLEMENT FIFTH)
  isActive(): boolean {
    return this.isListening;
  }

  getStatus(): object {
    return {
      active: this.isListening,
      clientsInitialized: this.clients.size,
      contractsInitialized: this.contracts.size,
      chainsMonitored: Array.from(this.clients.keys()),
      chainNames: Array.from(this.clients.keys()).map(id => CHAIN_NAMES[id]),
      supportedChains: SUPPORTED_CHAINS.length,
      environment: process.env.NODE_ENV,
      useTestnets: process.env.USE_TESTNETS === 'true',
    };
  }

  getMonitoredChains(): number[] {
    return Array.from(this.clients.keys());
  }

  // STEP 6: Enhanced block processing - THE CORE LOGIC
  private async processNewBlock(chainId: number, blockNumber: number): Promise<void> {
    const chainName = CHAIN_NAMES[chainId];
    
    try {
      console.log(`📦 Processing block ${blockNumber} on ${chainName}...`);
      
      // Check if block has finality before processing
      if (!(await this.hasFinality(chainId, blockNumber))) {
        console.log(`⏳ Block ${blockNumber} on ${chainName} waiting for finality...`);
        return; // Wait for finality
      }

      console.log(`🔒 Block ${blockNumber} on ${chainName} has finality - processing events...`);

      // Get MoveCommitted events from this block
      const events = await this.getMoveCommittedEvents(chainId, blockNumber);
      
      if (events.length > 0) {
        console.log(`🎯 Found ${events.length} MoveCommitted events in block ${blockNumber} on ${chainName}`);
        
        // Process each event
        for (const event of events) {
          await this.processGameMove(event, chainId);
        }
      } else {
        console.log(`📭 No MoveCommitted events in block ${blockNumber} on ${chainName}`);
      }
      
    } catch (error) {
      console.error(`❌ Error processing block ${blockNumber} on ${chainName}:`, error);
    }
  }

  // STEP 7: Event fetching - REAL IMPLEMENTATION
  private async getMoveCommittedEvents(chainId: number, blockNumber: number): Promise<any[]> {
    const chainName = CHAIN_NAMES[chainId];
    const client = this.clients.get(chainId);
    const contractAddress = CONTRACT_ADDRESSES[chainId];
    
    if (!client || !contractAddress) {
      console.error(`❌ No client or contract for ${chainName}`);
      return [];
    }
    
    try {
      console.log(`🔍 Fetching MoveCommitted events from block ${blockNumber} on ${chainName}...`);
      
      const logs = await client.getLogs({
        address: contractAddress,
        event: parseAbiItem('event MoveCommitted(bytes32 indexed gameId, address indexed player, uint8 move, uint256 blockNumber, uint256 balance)'),
        fromBlock: BigInt(blockNumber),
        toBlock: BigInt(blockNumber),
      });

      console.log(`📋 Found ${logs.length} raw logs in block ${blockNumber} on ${chainName}`);
      return logs;
      
    } catch (error) {
      console.error(`❌ Error getting events for ${chainName} block ${blockNumber}:`, error);
      return [];
    }
  }

  // STEP 8: Finality checking - REAL IMPLEMENTATION  
  private async hasFinality(chainId: number, blockNumber: number): Promise<boolean> {
    const chainName = CHAIN_NAMES[chainId];
    const client = this.clients.get(chainId);
    
    if (!client) {
      console.error(`❌ No client for ${chainName}`);
      return false;
    }
    
    try {
      const currentBlock = Number(await client.getBlockNumber());
      const finalityBlocks = this.getFinalityBlocks(chainId);
      const blocksConfirmed = currentBlock - blockNumber;
      const hasFinality = blocksConfirmed >= finalityBlocks;
      
      console.log(`⏰ Finality check for ${chainName} block ${blockNumber}: ${blocksConfirmed}/${finalityBlocks} confirmations (${hasFinality ? 'FINAL' : 'PENDING'})`);
      
      return hasFinality;
      
    } catch (error) {
      console.error(`❌ Error checking finality for ${chainName}:`, error);
      return false;
    }
  }

  // STEP 9: Enhanced finality configuration
  private getFinalityBlocks(chainId: number): number {
    const finalityMap: Record<number, number> = {
      31337: 1,     // Anvil Chain 1 - instant
      31338: 1,     // Anvil Chain 2 - instant
      11155111: 12, // Sepolia - 12 blocks
      80001: 128,   // Mumbai - 128 blocks
    };

    const finality = finalityMap[chainId] || 12;
    console.log(`⚙️  Chain ${CHAIN_NAMES[chainId]} requires ${finality} blocks for finality`);
    return finality;
  }

  // STEP 10: Simplified event emission (removed game processing logic)
  private async processGameMove(event: any, chainId: number): Promise<void> {
    try {
      console.log(`🎮 EventListener: Detected game move event on chain ${chainId}`);
      
      // Just emit the raw event - let GameOrchestrator handle the processing
      this.emit('gameMoveDetected', event, chainId);
      
      console.log('✅ Game move event emitted to GameOrchestrator');
      
    } catch (error) {
      console.error('❌ Error emitting game move event:', error);
    }
  }
}
