export interface GameMove {
  gameId: string;
  player: string;
  move: number;
  chainId: number;
  blockNumber: number;
  balance: string;
  txHash: string;
  timestamp?: number;
  nonce?: number;
}

export interface CrossChainGameMove extends GameMove {
  sourceChainId: number;
  destinationChainId: number;
  merkleRoot?: string;
  proofHash?: string;
}