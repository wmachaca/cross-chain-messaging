// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

library MoveCalculator {
    enum Move { None, Rock, Paper, Scissors }
    
    function calculateMove(uint256 blockNumber) internal pure returns (Move) {
        if (blockNumber % 3 == 0) return Move.Paper;
        if (blockNumber % 2 == 0) return Move.Scissors;
        return Move.Rock;
    }
    
    function determineWinner(Move move1, Move move2) internal pure returns (uint8) {
        if (move1 == move2) return 0; // Draw
        
        if (
            (move1 == Move.Rock && move2 == Move.Scissors) ||
            (move1 == Move.Paper && move2 == Move.Rock) || 
            (move1 == Move.Scissors && move2 == Move.Paper)
        ) {
            return 1; // Move1 wins
        }
        
        return 2; // Move2 wins
    }
}