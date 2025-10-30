export interface GameMove {
  gameId: string;
  player: string;
  move: number;
  blockNumber: number;
  balance: string;
  chainId: number;
  txHash: string;
  timestamp?: number;
  processed?: boolean;
}

export class GameMoveBuilder {
  // From blockchain event (most common)
  static fromContractEvent(
    eventData: any,
    chainId: number,
    txHash: string
  ): GameMove {
    return {
      gameId: eventData.args.gameId,                    // bytes32 → string
      player: eventData.args.player,                    // address → string  
      move: Number(eventData.args.move),                // uint8 → number
      blockNumber: Number(eventData.args.blockNumber),  // uint256 → number (safe conversion)
      balance: eventData.args.balance.toString(),       // uint256 → string (prevents overflow)
      chainId,                                          // Added by relayer
      txHash,                                           // Added by relayer
      timestamp: Date.now(),                            // Added by relayer
      processed: false,                                 // Added by relayer
    };
  }

  // From database (when reloading)
  static fromDatabase(dbRecord: any): GameMove {
    return {
      gameId: dbRecord.game_id,
      player: dbRecord.player_address,
      move: parseInt(dbRecord.move),
      blockNumber: parseInt(dbRecord.block_number),
      balance: dbRecord.balance.toString(),
      chainId: parseInt(dbRecord.chain_id),
      txHash: dbRecord.tx_hash,
      timestamp: dbRecord.timestamp,
      processed: dbRecord.processed || false,
    };
  }

  // For testing purposes
  static createMock(
    gameId: string,
    player: string,
    move: number,
    chainId: number
  ): GameMove {
    return {
      gameId,
      player,
      move,
      blockNumber: 123456,
      balance: "1000000000000000000", // 1 ETH in wei
      chainId,
      txHash: "0x" + "0".repeat(64),
      timestamp: Date.now(),
      processed: false,
    };
  }

  // Validate a GameMove object
  static validate(gameMove: GameMove): boolean {
    return !!(
      gameMove.gameId &&
      gameMove.player &&
      gameMove.move >= 1 && gameMove.move <= 3 &&
      gameMove.blockNumber > 0 &&
      gameMove.balance &&
      gameMove.chainId &&
      gameMove.txHash
    );
  }
}

export interface CrossChainGameMove extends GameMove {
  sourceChainId: number;
  destinationChainId: number;
  merkleRoot?: string;
  proofHash?: string;
}