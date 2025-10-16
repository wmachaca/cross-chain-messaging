// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/CrossChainRPC.sol"; // Corrected file name
import "../src/Verifier.sol";
import "../src/libraries/GameMoveStruct.sol";

contract CrossChainRPSTest is Test {
    CrossChainRPS public game;
    Verifier public verifier;

    address player1 = address(0x1);
    address player2 = address(0x2);

    uint256 chain1 = 1;
    uint256 chain2 = 2;

    function setUp() public {
        verifier = new Verifier();
        game = new CrossChainRPS(address(verifier));

        // Fund players
        vm.deal(player1, 10 ether);
        vm.deal(player2, 10 ether);

        // Set chain ID for testing
        vm.chainId(chain1);
    }

    function testGameCreation() public {
        vm.startPrank(player1);

        // Send Ether to the contract to fund the player's balance
        (bool success, ) = address(game).call{value: 1 ether}("");
        require(success, "Ether transfer failed");

        // Create a new game
        game.createGame("game123", 0.5 ether);
        vm.stopPrank();

        // Verify game state
        (address p1, address p2, , , uint256 stake, , , bool resolved, ) = game.games("game123");
        assertEq(p1, player1, "Player 1 mismatch");
        assertEq(p2, address(0), "Player 2 should not be set yet");
        assertEq(stake, 0.5 ether, "Stake mismatch");
        assertFalse(resolved, "Game should not be resolved");
    }

    function testCommitMove() public {
        vm.startPrank(player1);

        // Send Ether to the contract to fund the player's balance
        (bool success, ) = address(game).call{value: 1 ether}("");
        require(success, "Ether transfer failed");
        game.createGame("game123", 0.5 ether);
        game.commitMove("game123");
        vm.stopPrank();

        // Verify move commitment
        (, , CrossChainRPS.Move move1, , , , , , ) = game.games("game123");
        assertTrue(uint8(move1) != uint8(CrossChainRPS.Move.None), "Move 1 should be committed");
    }

    function testResolveWithCrossChainProof() public {
        // Player 1 creates and commits to a game
        vm.startPrank(player1);

        // Send Ether to the contract to fund the player's balance
        (bool success, ) = address(game).call{value: 1 ether}("");
        require(success, "Ether transfer failed");
        game.createGame("game123", 0.5 ether);
        game.commitMove("game123");
        vm.stopPrank();

        // Simulate Player 2's move on another chain
        GameMoveStruct.GameMove memory gameMove2 = GameMoveStruct.GameMove({
            sourceChainId: chain2,
            sourceContract: address(game),
            player: player2,
            move: uint8(CrossChainRPS.Move.Rock),
            blockNumber: 100,
            balance: 1 ether
        });

        // Compute two leaves
        bytes32 leaf1 = CrossChainHasher.computeGameMoveLeaf(
            chain1,
            address(game),
            player1,
            uint8(CrossChainRPS.Move.Paper),
            99,
            1 ether
        );

        bytes32 leaf2 = CrossChainHasher.computeGameMoveLeaf(
            gameMove2.sourceChainId,
            gameMove2.sourceContract,
            gameMove2.player,
            gameMove2.move,
            gameMove2.blockNumber,
            gameMove2.balance
        );

        // Compute the Merkle root
        bytes32 merkleRoot = keccak256(abi.encodePacked(
            leaf1 < leaf2 ? abi.encodePacked(leaf1, leaf2) : abi.encodePacked(leaf2, leaf1)
        ));

        // Create a valid proof for leaf2
        bytes32[] memory proof = new bytes32[](1);
        proof[0] = leaf1;

        // Player 1 resolves the game with Player 2's move
        vm.startPrank(player1);
        game.resolveWithCrossChainProof(
            "game123",
            merkleRoot,
            proof,
            gameMove2.sourceChainId,
            gameMove2.sourceContract,
            gameMove2.player,
            gameMove2.move,
            gameMove2.blockNumber,
            gameMove2.balance
        );
        vm.stopPrank();

        // Verify game resolution
        ( , , , CrossChainRPS.Move move2, , , , bool resolved, CrossChainRPS.GameResult result) = game.games("game123");
        assertTrue(resolved, "Game should be resolved");
        assertEq(uint8(move2), uint8(CrossChainRPS.Move.Rock), "Move 2 mismatch");
        assertEq(uint8(result), uint8(CrossChainRPS.GameResult.Draw), "Game result mismatch");
    }
}
