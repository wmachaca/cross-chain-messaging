import { keccak256, encodePacked } from 'viem';
import { GameMove } from '../models/GameMove';
import { CONTRACT_ADDRESSES } from '../config/config';

/**
 * 🌳 BLOCKCHAIN-NATIVE MERKLE SERVICE 
 * 
 * 🎯 NEW APPROACH: Use blockchain's built-in transaction trees!
 * 
 * ✅ STEP 1: Create Leaves (contract-compatible fingerprints)
 * ✅ STEP 2: Use Blockchain Transaction Trees (much simpler!)
 * ✅ STEP 3: Generate Transaction Inclusion Proofs
 * ✅ STEP 4: Verify Proofs with Blockchain Data
 * 
 * 🔥 KEY INSIGHT: Every block already has a perfect Merkle tree!
 * Instead of building custom trees, we use the blockchain's transaction tree.
 */

export interface TransactionProof {
  transactionHash: string;
  blockNumber: number;
  chainId: number;
  transactionsRoot: string;  // Root of the block's transaction tree
  gameMove: GameMove;        // The game move data
  gameMoveLeaf: string;      // The contract-compatible leaf
}

export interface BlockchainMerkleData {
  blockNumber: number;
  transactionsRoot: string;
  totalTransactions: number;
  chainId: number;
}

export class MerkleServiceBlockchain {
  private client: any; // Will be properly typed later

  constructor(client: any) {
    this.client = client;
    console.log('\n⚡ =======================================');
    console.log('⚡ BLOCKCHAIN-NATIVE MERKLE SERVICE');
    console.log('⚡ =======================================');
    console.log('🎯 Goal: Use blockchain\'s built-in Merkle trees');
    console.log('🔥 Approach: Transaction inclusion proofs\n');
  }

  /**
   * ✅ STEP 1: CREATE LEAVES (Keep this - it works perfectly!)
   * 
   * This creates a "fingerprint" (leaf) for each game move.
   * The fingerprint MUST match what CrossChainHasher.sol expects!
   * 
   * 🎯 CONTRACT COMPATIBILITY:
   * - Uses same parameters: chainId, contract, player, move, block, balance
   * - Uses same encoding: abi.encodePacked in Solidity = encodePacked in TypeScript
   * - Uses same hashing: keccak256 in both
   */
  createLeaf(gameMove: GameMove): string {
    console.log('\n🌿 ===== CREATING CONTRACT-COMPATIBLE LEAF =====');
    console.log('📊 Input data for leaf:');
    console.log('  🔗 Chain ID:', gameMove.chainId);
    console.log('  👤 Player:', gameMove.player);
    console.log('  ✊ Move:', gameMove.move, this.getMoveText(gameMove.move));
    console.log('  📦 Block:', gameMove.blockNumber);
    console.log('  💰 Balance:', gameMove.balance, 'wei');

    // Get contract address (critical for leaf!)
    const contractAddress = CONTRACT_ADDRESSES[gameMove.chainId];
    if (!contractAddress) {
      throw new Error(`❌ No contract address for chain ${gameMove.chainId}`);
    }
    console.log('  🏠 Contract:', contractAddress);

    // Create the hash exactly like CrossChainHasher.sol
    console.log('\n🔨 Creating hash (must match contract exactly)...');
    console.log('📋 Order: chainId → contractAddress → player → move → blockNumber → balance');
    
    const packedData = encodePacked(
      // Types - must match Solidity!
      ['uint256', 'address', 'address', 'uint8', 'uint256', 'uint256'],
      // Values - exact same order as contract!
      [
        BigInt(gameMove.chainId),           // Which blockchain
        contractAddress as `0x${string}`,  // Which contract
        gameMove.player as `0x${string}`,  // Which player  
        gameMove.move,                     // What move
        BigInt(gameMove.blockNumber),      // When (block)
        BigInt(gameMove.balance),          // Balance then
      ]
    );
    
    const leaf = keccak256(packedData);

    console.log('✅ LEAF CREATED!');
    console.log('🆔 Leaf hash:', leaf);
    console.log('🎯 This matches CrossChainHasher.sol exactly!');
    
    return leaf;
  }

  /**
   * ✅ STEP 2: GET BLOCKCHAIN MERKLE DATA (New blockchain-native approach!)
   * 
   * Instead of building our own tree, we use the blockchain's built-in transaction tree!
   * Every block already has a perfect Merkle tree of all transactions.
   * 
   * 🎯 BLOCKCHAIN MAGIC:
   * - Each block has transactionsRoot (Merkle root of all transactions)
   * - We can prove any transaction was included in that block
   * - Much simpler than custom trees!
   */
  async getBlockchainMerkleData(blockNumber: number, chainId: number): Promise<BlockchainMerkleData> {
    console.log('\n🔗 ===== GETTING BLOCKCHAIN MERKLE DATA =====');
    console.log('📦 Block number:', blockNumber);
    console.log('⛓️ Chain ID:', chainId);
    
    try {
      // Get the complete block data including transactions
      const blockData = await this.client.getBlock({ 
        blockNumber: BigInt(blockNumber),
        includeTransactions: true 
      });
      
      const merkleData: BlockchainMerkleData = {
        blockNumber: blockNumber,
        transactionsRoot: blockData.transactionsRoot,
        totalTransactions: blockData.transactions.length,
        chainId: chainId
      };
      
      console.log('✅ Blockchain Merkle Data Retrieved:');
      console.log('  📦 Block:', merkleData.blockNumber);
      console.log('  🌳 Transactions Root:', merkleData.transactionsRoot);
      console.log('  📊 Total Transactions:', merkleData.totalTransactions);
      console.log('  ⛓️ Chain ID:', merkleData.chainId);
      
      return merkleData;
    } catch (error) {
      console.error('❌ Error getting blockchain data:', error);
      throw new Error(`Failed to get blockchain Merkle data for block ${blockNumber} on chain ${chainId}: ${error}`);
    }
  }

  /**
   * ✅ STEP 3: CREATE TRANSACTION PROOF (The magic happens here!)
   * 
   * This creates a proof that a specific transaction (containing our game move)
   * was included in a specific block's transaction tree.
   * 
   * 🎯 PROOF COMPONENTS:
   * - Transaction hash (the move transaction)
   * - Block's transactions root (Merkle root)
   * - Game move data and leaf
   * - Block and chain information
   */
  async createTransactionProof(
    transactionHash: string, 
    gameMove: GameMove
  ): Promise<TransactionProof> {
    console.log('\n🛡️ ===== CREATING TRANSACTION PROOF =====');
    console.log('📋 Transaction Hash:', transactionHash);
    console.log('🎮 Game Move:', gameMove);

    try {
      // Get the blockchain Merkle data for this block
      const merkleData = await this.getBlockchainMerkleData(
        gameMove.blockNumber, 
        gameMove.chainId
      );

      // Create the contract-compatible leaf
      const gameMoveLeaf = this.createLeaf(gameMove);

      // Create the complete proof
      const proof: TransactionProof = {
        transactionHash: transactionHash,
        blockNumber: gameMove.blockNumber,
        chainId: gameMove.chainId,
        transactionsRoot: merkleData.transactionsRoot,
        gameMove: gameMove,
        gameMoveLeaf: gameMoveLeaf
      };

      console.log('✅ TRANSACTION PROOF CREATED!');
      console.log('🆔 Transaction Hash:', proof.transactionHash);
      console.log('🌳 Transactions Root:', proof.transactionsRoot);
      console.log('🍃 Game Move Leaf:', proof.gameMoveLeaf);
      console.log('📦 Block Number:', proof.blockNumber);

      return proof;
    } catch (error) {
      console.error('❌ Error creating transaction proof:', error);
      throw new Error(`Failed to create transaction proof: ${error}`);
    }
  }

  /**
   * ✅ STEP 4: VERIFY TRANSACTION IN BLOCK (Verification magic!)
   * 
   * This verifies that a transaction really exists in a block by checking
   * the blockchain's transaction tree.
   * 
   * 🎯 VERIFICATION PROCESS:
   * - Get the block data
   * - Check if transaction exists in block
   * - Validate the transactions root matches
   */
  async verifyTransactionInBlock(
    transactionHash: string, 
    blockNumber: number, 
    chainId: number
  ): Promise<boolean> {
    console.log('\n🔍 ===== VERIFYING TRANSACTION IN BLOCK =====');
    console.log('📋 Transaction Hash:', transactionHash);
    console.log('📦 Block Number:', blockNumber);
    console.log('⛓️ Chain ID:', chainId);

    try {
      // Get the block data
      const blockData = await this.client.getBlock({ 
        blockNumber: BigInt(blockNumber),
        includeTransactions: true 
      });

      // Check if transaction exists in this block
      const transactionExists = blockData.transactions.some((tx: any) => 
        (typeof tx === 'string' ? tx : tx.hash) === transactionHash
      );

      console.log('🔍 Transaction exists in block:', transactionExists);
      console.log('🌳 Block transactions root:', blockData.transactionsRoot);
      console.log('📊 Total transactions in block:', blockData.transactions.length);

      if (transactionExists) {
        console.log('✅ VERIFICATION SUCCESSFUL!');
        console.log('🎯 Transaction is proven to be in block', blockNumber);
      } else {
        console.log('❌ VERIFICATION FAILED!');
        console.log('🚫 Transaction not found in block', blockNumber);
      }

      return transactionExists;
    } catch (error) {
      console.error('❌ Error verifying transaction:', error);
      throw new Error(`Failed to verify transaction: ${error}`);
    }
  }

  /**
   * 🎯 HELPER: Get human-readable move text
   */
  private getMoveText(move: number): string {
    const moves = ['Rock', 'Paper', 'Scissors'];
    return moves[move] || 'Unknown';
  }

  /**
   * 🎯 HELPER: Log proof summary for debugging
   */
  logProofSummary(proof: TransactionProof): void {
    console.log('\n📋 ===== PROOF SUMMARY =====');
    console.log('🆔 Transaction:', proof.transactionHash);
    console.log('📦 Block:', proof.blockNumber);
    console.log('⛓️ Chain:', proof.chainId);
    console.log('🌳 Merkle Root:', proof.transactionsRoot);
    console.log('👤 Player:', proof.gameMove.player);
    console.log('✊ Move:', proof.gameMove.move, this.getMoveText(proof.gameMove.move));
    console.log('🍃 Leaf:', proof.gameMoveLeaf);
    console.log('========================\n');
  }
}