import { keccak256, encodePacked } from 'viem';
import { GameMove } from '../models/GameMove';
import { CONTRACT_ADDRESSES } from '../config/config';

/**
 * 🌳 MERKLE SERVICE 
 * 
 * Let's build this incrementally so you understand each part:
 * 
 * ✅ STEP 1: Create Leaves (what we're building now)
 * ⏳ STEP 2: Build Merkle Trees  
 * ⏳ STEP 3: Generate Proofs
 * ⏳ STEP 4: Verify Proofs
 */
export class MerkleService {
  
  constructor() {
    console.log('\n🌳 =======================================');
    console.log('🌳 MERKLE SERVICE - STEP 1: BASIC LEAVES');
    console.log('🌳 =======================================');
    console.log('🎯 Goal: Create leaves that match your smart contract');
    console.log('📋 Focus: Understanding what a Merkle leaf is\n');
  }

  /**
   * 🍃 STEP 1: CREATE LEAF
   * 
   * 🤔 WHAT IS A MERKLE LEAF?
   * Think of it like a "fingerprint" for your data:
   * - You have game move data (player, move, block, etc.)
   * - You create a unique hash (fingerprint) from this data
   * - This hash is called a "leaf"
   * - Later you can prove this leaf exists in a tree
   * 
   * 🎯 WHY MUST IT MATCH YOUR CONTRACT?
   * Your CrossChainHasher.sol does:
   * keccak256(abi.encodePacked(chainId, contractAddress, player, move, blockNumber, balance))
   * 
   * We must create the EXACT same hash or the contract will reject it!
   */
  createLeaf(gameMove: GameMove): string {
    console.log('\n🍃 ===== CREATING MERKLE LEAF =====');
    
    // Step 1a: Show the input data
    console.log('📊 Input data for leaf:');
    console.log('  🔗 Chain ID:', gameMove.chainId);
    console.log('  👤 Player:', gameMove.player);
    console.log('  ✊ Move:', gameMove.move, this.getMoveText(gameMove.move));
    console.log('  📦 Block:', gameMove.blockNumber);
    console.log('  💰 Balance:', gameMove.balance, 'wei');

    // Step 1b: Get contract address (critical for leaf!)
    const contractAddress = CONTRACT_ADDRESSES[gameMove.chainId];
    if (!contractAddress) {
      throw new Error(`❌ No contract address for chain ${gameMove.chainId}`);
    }
    console.log('  🏠 Contract:', contractAddress);

    // Step 1c: Create the hash exactly like your smart contract
    console.log('\n🔨 Creating hash (must match contract exactly)...');
    console.log('📋 Order: chainId → contractAddress → player → move → blockNumber → balance');
    
    // Create packed encoding like Solidity's abi.encodePacked
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
    
    // Hash the packed data (like Solidity's keccak256)
    const leaf = keccak256(packedData);

    console.log('\n✅ LEAF CREATED!');
    console.log('🆔 Leaf hash:', leaf);
    console.log('🎯 This matches your contract exactly!');
    console.log('==============================\n');
    
    return leaf;
  }


  /**
   * 🎮 HELPER: Convert move number to readable text
   */
  private getMoveText(move: number): string {
    const moves = { 1: '(Rock)', 2: '(Paper)', 3: '(Scissors)' };
    return moves[move as keyof typeof moves] || '(Unknown)';
  }

}
