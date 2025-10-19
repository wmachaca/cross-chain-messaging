export interface MerkleProof {
  root: string;
  proof: string[];
  leaf: string;
  index?: number;
}

export interface CrossChainMerkleProof extends MerkleProof {
  sourceChainId: number;
  destinationChainId: number;
  gameMove: {
    gameId: string;
    player: string;
    move: number;
    blockNumber: number;
    balance: string;
  };
  timestamp: number;
  verified?: boolean;
}