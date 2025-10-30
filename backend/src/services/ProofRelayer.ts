import { createWalletClient, http, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { TransactionProof } from './MerkleService';
import { GameMove } from '../models/GameMove';
import { CONTRACT_ADDRESSES, RPC_URLS, SUPPORTED_CHAINS, CHAIN_NAMES } from '../config/config';

/**
 * 🚀 PROOF RELAYER
 * 
 * This is where resolveWithCrossChainProof() gets called!
 * 
 * 🎯 RESPONSIBILITIES:
 * - Take proofs from MerkleService
 * - Submit them to destination chains
 * - Call resolveWithCrossChainProof() on target contracts
 */

export class ProofRelayer {
  private walletClients: Map<number, any> = new Map();
  private relayerAddress: string;

  constructor() {
    console.log('\n🚀 =======================================');
    console.log('🚀 PROOF RELAYER INITIALIZING');
    console.log('🚀 =======================================');
    console.log('🎯 Purpose: Submit cross-chain proofs');
    console.log('🔧 Method: Call resolveWithCrossChainProof()\n');
    
    this.initializeWalletClients();
  }

  /**
   * 🔧 Initialize wallet clients for submitting transactions
   */
  private initializeWalletClients(): void {
    try {
      // Get relayer private key from environment
      const privateKey = process.env.RELAYER_PRIVATE_KEY as `0x${string}`;
      if (!privateKey) {
        throw new Error('RELAYER_PRIVATE_KEY not found in environment variables');
      }

      const account = privateKeyToAccount(privateKey);
      this.relayerAddress = account.address;
      
      console.log('👤 Relayer address:', this.relayerAddress);

      // Create wallet clients for each supported chain
      for (const chain of SUPPORTED_CHAINS) {
        const walletClient = createWalletClient({
          chain,
          transport: http(RPC_URLS[chain.id]),
          account,
        });

        this.walletClients.set(chain.id, walletClient);
        console.log(`✅ Wallet client initialized for ${CHAIN_NAMES[chain.id]} (${chain.id})`);
      }

      console.log(`🚀 ${this.walletClients.size} wallet clients ready`);

    } catch (error) {
      console.error('❌ Error initializing wallet clients:', error);
      throw error;
    }
  }

  /**
   * 🎯 THIS IS WHERE THE MAGIC HAPPENS!
   * Submit proof to destination chain by calling resolveWithCrossChainProof()
   */
  async relayProof(
    gameId: string,
    sourceProof: TransactionProof,
    destinationChainId: number
  ): Promise<string> {
    console.log('\n🎯 ===== RELAYING CROSS-CHAIN PROOF =====');
    console.log('🎮 Game ID:', gameId);
    console.log('🔗 Source Chain:', CHAIN_NAMES[sourceProof.chainId], `(${sourceProof.chainId})`);
    console.log('🎯 Destination Chain:', CHAIN_NAMES[destinationChainId], `(${destinationChainId})`);

    try {
      const walletClient = this.walletClients.get(destinationChainId);
      if (!walletClient) {
        throw new Error(`No wallet client for destination chain ${destinationChainId}`);
      }

      const contractAddress = CONTRACT_ADDRESSES[destinationChainId];
      if (!contractAddress) {
        throw new Error(`No contract address for destination chain ${destinationChainId}`);
      }

      console.log('📄 Target contract:', contractAddress);
      console.log('🛡️ Submitting proof...');

      // THIS IS THE CALL YOU'RE LOOKING FOR! 🎯
      const { request } = await walletClient.simulateContract({
        address: contractAddress,
        abi: parseAbi([
          'function resolveWithCrossChainProof(bytes32 gameId, bytes32 merkleRoot, bytes32[] calldata proof, uint256 opponentChainId, address opponentContract, address opponent, uint8 opponentMove, uint256 opponentBlockNumber, uint256 opponentBalance) external',
        ]),
        functionName: 'resolveWithCrossChainProof',
        args: [
          gameId as `0x${string}`,                           // gameId
          sourceProof.transactionsRoot as `0x${string}`,     // merkleRoot (from blockchain)
          [], // TODO: Add actual Merkle proof array             // proof
          BigInt(sourceProof.chainId),                       // opponentChainId
          CONTRACT_ADDRESSES[sourceProof.chainId],           // opponentContract
          sourceProof.gameMove.player,                       // opponent
          sourceProof.gameMove.move,                         // opponentMove
          BigInt(sourceProof.gameMove.blockNumber),          // opponentBlockNumber
          BigInt(sourceProof.gameMove.balance),              // opponentBalance
        ],
      });

      // Execute the transaction
      const txHash = await walletClient.writeContract(request);

      console.log('✅ CROSS-CHAIN PROOF SUBMITTED!');
      console.log('🆔 Transaction Hash:', txHash);
      console.log('⛓️ resolveWithCrossChainProof() called successfully!');

      return txHash;

    } catch (error) {
      console.error('❌ Error relaying proof:', error);
      throw error;
    }
  }

  /**
   * 📊 Get relayer status
   */
  getStatus(): object {
    return {
      relayerAddress: this.relayerAddress,
      walletClientsInitialized: this.walletClients.size,
      supportedChains: Array.from(this.walletClients.keys()).map(id => CHAIN_NAMES[id]),
    };
  }
}
