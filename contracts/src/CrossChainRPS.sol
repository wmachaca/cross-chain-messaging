// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "./Verifier.sol";
import "./libraries/MoveCalculator.sol";


contract CrossChainRPS is Ownable {
    using MoveCalculator for uint256;
    
    enum Move { None, Rock, Paper, Scissors }
    enum GameResult { Pending, Player1Win, Player2Win, Draw }
    
    Verifier public verifier;
    uint256 public chainId;
    address public oponent;
    Move public myMove;

    
    event MoveCommitted(address indexed player, uint8 move, uint256 blockNumber);
    event GameResolved(bytes32 indexed gameId, address winner, address loser, uint256 burnedAmount);
    
    constructor(address _verifier) {
        verifier = Verifier(_verifier);
        chainId = block.chainid;
    }
    

    /**
     * @dev Creates a new game and emits the GameInitiated event.
     * @param gameId The unique identifier for the game.
     * @param stake The amount of ETH each player must stake to participate.
     */
    function playGame() onlyOwner {

     // Calculate move based on block number (as per requirements)
        myMove = Move(uint8(block.number.calculateMove()));

        
        emit MoveCommitted(msg.sender, uint8(myMove), block.number);
    }
    
    /**
     * @dev Resolve game using cross-chain Merkle proof
     * This is where the MAGIC happens - proving the opponent's move from another chain
     */
    // function resolveWithCrossChainProof(
    //     bytes32 gameId,
    //     bytes32 merkleRoot,
    //     bytes32[] calldata proof,
    //     uint256 opponentChainId,
    //     address opponentContract,
    //     address opponent,
    //     uint8 opponentMove,
    //     uint256 opponentBlockNumber,
    //     uint256 opponentBalance
    // ) external {
    //     Game storage game = games[gameId];
    //     require(game.player1 != address(0), "Game not found");
    //     require(!game.resolved, "Game already resolved");
    //     require(game.move1 != Move.None, "Player 1 hasn't moved");
        
    //     GameMoveStruct.GameMove memory gameMove = GameMoveStruct.GameMove({
    //         sourceChainId: opponentChainId,
    //         sourceContract: opponentContract,
    //         player: opponent,
    //         move: opponentMove,
    //         blockNumber: opponentBlockNumber,
    //         balance: opponentBalance
    //     });

    //     bool proofValid = verifier.verifyCrossChainProof(
    //         merkleRoot,
    //         proof,
    //         gameMove
    //     );
        
    //     require(proofValid, "Invalid cross-chain proof");
        
    //     // Set opponent's move from the verified proof
    //     game.move2 = Move(opponentMove);
    //     game.player2 = opponent;
    //     game.chainId2 = opponentChainId;
        
    //     emit CrossChainProofSubmitted(gameId, proofValid);
        
    //     // Resolve the game
    //     _resolveGame(gameId);
    // }
    
    // function _resolveGame(bytes32 gameId) internal {
    //     Game storage game = games[gameId];
    //     require(game.move1 != Move.None && game.move2 != Move.None, "Both moves required");
        
    //     uint8 winner = MoveCalculator.determineWinner(
    //         MoveCalculator.Move(uint8(game.move1)),
    //         MoveCalculator.Move(uint8(game.move2))
    //     );
        
    //     if (winner == 0) {
    //         // Draw - return stakes
    //         game.result = GameResult.Draw;
    //         balances[game.player1] += game.stake;
    //         if (game.player2 != address(0)) {
    //             balances[game.player2] += game.stake;
    //         }
    //     } else if (winner == 1) {
    //         // Player 1 wins
    //         game.result = GameResult.Player1Win;
    //         _burnStake(game.player2, game.stake);
    //         emit GameResolved(gameId, game.player1, game.player2, game.stake);
    //     } else {
    //         // Player 2 wins  
    //         game.result = GameResult.Player2Win;
    //         _burnStake(game.player1, game.stake);
    //         emit GameResolved(gameId, game.player2, game.player1, game.stake);
    //     }
        
    //     game.resolved = true;
    // }
    
    // function _burnStake(address loser, uint256 amount) internal {
    //     require(balances[loser] >= amount, "Insufficient balance to burn");
    //     balances[loser] -= amount;
    //     payable(address(0)).transfer(amount);
    // }
}