// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Verifier.sol";
import "./libraries/MoveCalculator.sol";

contract CrossChainRPS {
    using MoveCalculator for uint256;
    
    enum Move { None, Rock, Paper, Scissors }
    enum GameResult { Pending, Player1Win, Player2Win, Draw }
    
    struct Game {
        address player1;
        address player2;
        Move move1;
        Move move2;
        uint256 stake;
        uint256 chainId1;
        uint256 chainId2;
        bool resolved;
        GameResult result;
    }
    
    Verifier public verifier;
    uint256 public chainId;
    
    mapping(bytes32 => Game) public games;
    mapping(address => uint256) public balances;
    
    event GameInitiated(bytes32 indexed gameId, address player1, uint256 stake);
    event MoveCommitted(bytes32 indexed gameId, address player, Move move, uint256 blockNumber);
    event CrossChainProofSubmitted(bytes32 indexed gameId, bool proofValid);
    event GameResolved(bytes32 indexed gameId, address winner, address loser, uint256 burnedAmount);
    
    constructor(address _verifier) {
        verifier = Verifier(_verifier);
        chainId = block.chainid;
    }
    
    receive() external payable {
        balances[msg.sender] += msg.value;
    }
    
    /**
     * @dev Simple move commitment - this emits the event that will be proven cross-chain
     */
    function commitMove(bytes32 gameId) external {
        Game storage game = games[gameId];
        require(game.player1 != address(0), "Game not found");
        require(!game.resolved, "Game already resolved");
        
        // Calculate move based on block number (as per requirements)
        Move move = block.number.calculateMove();
        
        if (msg.sender == game.player1) {
            require(game.move1 == Move.None, "Player 1 already moved");
            game.move1 = move;
        } else {
            require(game.player2 == address(0) || game.player2 == msg.sender, "Not a player");
            if (game.player2 == address(0)) {
                game.player2 = msg.sender;
            }
            require(game.move2 == Move.None, "Player 2 already moved");
            game.move2 = move;
        }
        
        emit MoveCommitted(gameId, msg.sender, move, block.number);
    }
    
    /**
     * @dev Resolve game using cross-chain Merkle proof
     * This is where the MAGIC happens - proving the opponent's move from another chain
     */
    function resolveWithCrossChainProof(
        bytes32 gameId,
        bytes32 merkleRoot,
        bytes32[] calldata proof,
        uint256 opponentChainId,
        address opponentContract,
        address opponent,
        uint8 opponentMove,
        uint256 opponentBlockNumber,
        uint256 opponentBalance
    ) external {
        Game storage game = games[gameId];
        require(game.player1 != address(0), "Game not found");
        require(!game.resolved, "Game already resolved");
        require(game.move1 != Move.None, "Player 1 hasn't moved");
        
        // VERIFY THE CROSS-CHAIN PROOF
        bool proofValid = verifier.verifyCrossChainProof(
            merkleRoot,
            proof,
            opponentChainId,
            opponentContract,
            opponent,
            opponentMove,
            opponentBlockNumber,
            opponentBalance
        );
        
        require(proofValid, "Invalid cross-chain proof");
        
        // Set opponent's move from the verified proof
        game.move2 = Move(opponentMove);
        game.player2 = opponent;
        game.chainId2 = opponentChainId;
        
        emit CrossChainProofSubmitted(gameId, proofValid);
        
        // Resolve the game
        _resolveGame(gameId);
    }
    
    function _resolveGame(bytes32 gameId) internal {
        Game storage game = games[gameId];
        require(game.move1 != Move.None && game.move2 != Move.None, "Both moves required");
        
        uint8 winner = MoveCalculator.determineWinner(game.move1, game.move2);
        
        if (winner == 0) {
            // Draw - return stakes
            game.result = GameResult.Draw;
            balances[game.player1] += game.stake;
            if (game.player2 != address(0)) {
                balances[game.player2] += game.stake;
            }
        } else if (winner == 1) {
            // Player 1 wins
            game.result = GameResult.Player1Win;
            _burnStake(game.player2, game.stake);
            emit GameResolved(gameId, game.player1, game.player2, game.stake);
        } else {
            // Player 2 wins  
            game.result = GameResult.Player2Win;
            _burnStake(game.player1, game.stake);
            emit GameResolved(gameId, game.player2, game.player1, game.stake);
        }
        
        game.resolved = true;
    }
    
    function _burnStake(address loser, uint256 amount) internal {
        require(balances[loser] >= amount, "Insufficient balance to burn");
        balances[loser] -= amount;
        payable(address(0)).transfer(amount);
    }
}