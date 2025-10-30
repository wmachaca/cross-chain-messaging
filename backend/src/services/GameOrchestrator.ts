import { EventListener } from './EventListener';
import { MerkleServiceBlockchain, TransactionInclusionProof } from './MerkleService';
import { GameMove } from '../models/GameMove';
import { CHAIN_NAMES } from '../config/config';
import { ProofRelayer } from './ProofRelayer';

/**
 * 🎮 GAME ORCHESTRATOR
 * 
 * This is the CORE of the cross-chain system!
 * 
 * 🎯 RESPONSIBILITIES:
 * - Listen to events from EventListener
 * - Generate transaction inclusion proofs using MerkleService
 * - Coordinate cross-chain game resolution
 * - Manage pending moves and game state
 */

export interface PendingGameMove {
  gameMove: GameMove;
  transactionHash: string;
  chainId: number;
  timestamp: number;
  proof?: TransactionInclusionProof;
}

export class GameOrchestrator {
  private pendingMoves: PendingGameMove[] = [];
  private merkleServices: Map<number, MerkleServiceBlockchain> = new Map();

  constructor(
    private eventListener: EventListener,
    private proofRelayer: ProofRelayer  // 🚀 Add ProofRelayer!
  ) {
    console.log('\n🎮 =======================================');
    console.log('🎮 GAME ORCHESTRATOR INITIALIZING');
    console.log('🎮 =======================================');
    console.log('🎯 Purpose: Coordinate cross-chain game moves');
    console.log('🔧 Method: Transaction inclusion proofs\n');
    
    this.setupEventListeners();
    this.initializeMerkleServices();
  }

  /**
   * 🔧 Initialize Merkle services for each chain
   */
  private initializeMerkleServices(): void {
    console.log('🌳 Initializing Merkle services for all chains...');
    
    // Get clients from EventListener and create MerkleServices
    for (const chainId of this.eventListener.getMonitoredChains()) {
      const client = this.eventListener.getClient(chainId);
      if (client) {
        const merkleService = new MerkleServiceBlockchain(client);
        this.merkleServices.set(chainId, merkleService);
        console.log(`✅ MerkleService initialized for ${CHAIN_NAMES[chainId]} (${chainId})`);
      }
    }
    
    console.log(`🌳 ${this.merkleServices.size} Merkle services ready`);
  }

  /**
   * 🎧 Setup event listeners
   */
  private setupEventListeners(): void {
    console.log('🎧 Setting up event listeners...');
    
    this.eventListener.on('gameMoveDetected', async (eventData) => {
      await this.processGameMove(eventData);
    });
    
    console.log('✅ Event listeners configured');
  }

  /**
   * 🚀 Start the orchestrator
   */
  async start(): Promise<void> {
    console.log('\n🚀 Starting Game Orchestrator...');
    
    try {
      // Start the event listener
      await this.eventListener.startListening();
      
      console.log('✅ Game Orchestrator started successfully!');
      console.log('🎮 Ready to process cross-chain game moves');
      console.log(`📡 Monitoring chains: ${this.eventListener.getMonitoredChains().map(id => CHAIN_NAMES[id]).join(', ')}`);
      
    } catch (error) {
      console.error('❌ Failed to start Game Orchestrator:', error);
      throw error;
    }
  }

  /**
   * 🎯 Process a detected game move
   * This is where the magic happens!
   */
  private async processGameMove(eventData: any): Promise<void> {
    try {
      const { gameMove, chainId, transactionHash } = eventData;
      
      console.log(`\n🎯 ===== PROCESSING GAME MOVE =====`);
      console.log(`🔗 Chain: ${CHAIN_NAMES[chainId]} (${chainId})`);
      console.log(`🎮 Game ID: ${gameMove.gameId}`);
      console.log(`👤 Player: ${gameMove.player}`);
      console.log(`✊ Move: ${gameMove.move} (${this.getMoveText(gameMove.move)})`);
      console.log(`📦 Block: ${gameMove.blockNumber}`);
      console.log(`🆔 Transaction: ${transactionHash}`);

      // Add to pending moves
      const pendingMove: PendingGameMove = {
        gameMove,
        transactionHash,
        chainId,
        timestamp: Date.now(),
      };

      this.pendingMoves.push(pendingMove);
      console.log(`📝 Added to pending moves (total: ${this.pendingMoves.length})`);

      // Generate transaction inclusion proof
      await this.generateTransactionProof(pendingMove);

      // Determine if we need to resolve a cross-chain game
      await this.checkForCrossChainResolution(pendingMove);

      // Clean up old moves
      this.cleanupOldMoves();

    } catch (error) {
      console.error('❌ Error processing game move:', error);
    }
  }

  /**
   * 🛡️ Generate transaction inclusion proof
   */
  private async generateTransactionProof(pendingMove: PendingGameMove): Promise<void> {
    try {
      console.log(`\n🛡️ Generating transaction inclusion proof...`);
      
      const merkleService = this.merkleServices.get(pendingMove.chainId);
      if (!merkleService) {
        throw new Error(`No MerkleService for chain ${pendingMove.chainId}`);
      }

      // Generate the complete transaction inclusion proof
      const proof = await merkleService.createCompleteTransactionProof(
        pendingMove.transactionHash,
        pendingMove.gameMove
      );

      // Store the proof
      pendingMove.proof = proof;

      console.log('✅ Transaction inclusion proof generated successfully!');
      console.log(`📊 Proof details:`);
      console.log(`  🆔 Transaction: ${proof.transactionHash}`);
      console.log(`  🌳 Merkle Root: ${proof.transactionsRoot}`);
      console.log(`  🍃 Game Move Leaf: ${proof.gameMoveLeaf}`);
      console.log(`  📋 Proof Elements: ${proof.merkleProof.length}`);

      // Verify the proof locally (for debugging)
      const isValid = merkleService.verifyTransactionInclusionProof(proof);
      console.log(`🔍 Local proof verification: ${isValid ? '✅ VALID' : '❌ INVALID'}`);

    } catch (error) {
      console.error('❌ Error generating transaction proof:', error);
    }
  }

  /**
   * 🔍 Check if we can resolve a cross-chain game
   */
  private async checkForCrossChainResolution(newMove: PendingGameMove): Promise<void> {
    console.log(`\n🔍 Checking for cross-chain resolution opportunities...`);

    // Look for moves from other chains with the same game ID
    const relatedMoves = this.pendingMoves.filter(move => 
      move.gameMove.gameId === newMove.gameMove.gameId && 
      move.chainId !== newMove.chainId &&
      move.proof // Only consider moves with proofs
    );

    if (relatedMoves.length > 0) {
      console.log(`🎯 Found ${relatedMoves.length} related moves from other chains!`);
      
      // 🚀 NOW WE ACTUALLY RELAY THE PROOF!
      for (const relatedMove of relatedMoves) {
        console.log(`🔗 Cross-chain opportunity:`);
        console.log(`  📋 Game ID: ${relatedMove.gameMove.gameId}`);
        console.log(`  🔗 Source Chain: ${CHAIN_NAMES[relatedMove.chainId]} (${relatedMove.chainId})`);
        console.log(`  🎯 Target Chain: ${CHAIN_NAMES[newMove.chainId]} (${newMove.chainId})`);
        console.log(`  🛡️ Proof Ready: ${relatedMove.proof ? '✅' : '❌'}`);

        if (relatedMove.proof) {
          try {
            // 🎯 THIS IS WHERE resolveWithCrossChainProof() GETS CALLED!
            const txHash = await this.proofRelayer.relayProof(
              relatedMove.gameMove.gameId,
              relatedMove.proof,
              newMove.chainId
            );
            
            console.log('🎉 Cross-chain proof submitted successfully!');
            console.log('🆔 Transaction:', txHash);
          } catch (error) {
            console.error('❌ Failed to relay cross-chain proof:', error);
          }
        }
      }
    } else {
      console.log(`📭 No cross-chain resolution opportunities found yet`);
    }
  }

  /**
   * 🧹 Clean up old moves
   */
  private cleanupOldMoves(): void {
    const maxAge = 30 * 60 * 1000; // 30 minutes
    const maxMoves = 50; // Keep only last 50 moves
    const now = Date.now();

    // Remove old moves
    const beforeCount = this.pendingMoves.length;
    this.pendingMoves = this.pendingMoves
      .filter(move => (now - move.timestamp) < maxAge)
      .slice(-maxMoves);

    const afterCount = this.pendingMoves.length;
    if (beforeCount !== afterCount) {
      console.log(`🧹 Cleaned up ${beforeCount - afterCount} old moves (${afterCount} remaining)`);
    }
  }

  /**
   * 📊 Get orchestrator status
   */
  getStatus(): object {
    return {
      active: this.eventListener.isActive(),
      pendingMoves: this.pendingMoves.length,
      merkleServices: this.merkleServices.size,
      chainsMonitored: this.eventListener.getMonitoredChains(),
      chainNames: this.eventListener.getMonitoredChains().map(id => CHAIN_NAMES[id]),
    };
  }

  /**
   * 🎯 Get human-readable move text
   */
  private getMoveText(move: number): string {
    const moves = ['Rock', 'Paper', 'Scissors'];
    return moves[move] || 'Unknown';
  }

  /**
   * 🛑 Stop the orchestrator
   */
  async stop(): Promise<void> {
    console.log('🛑 Stopping Game Orchestrator...');
    await this.eventListener.stopListening();
    console.log('✅ Game Orchestrator stopped');
  }
}
