// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/Verifier.sol";
import "../src/libraries/CrossChainHasher.sol";
import "../src/libraries/GameMoveStruct.sol";

contract VerifierTest is Test {
    Verifier verifier;

    function setUp() public {
        verifier = new Verifier();
    }

    function testVerifier() public {
        // Define test inputs for two leaves
        GameMoveStruct.GameMove memory gameMove1 = GameMoveStruct.GameMove({
            sourceChainId: 1,
            sourceContract: address(0x123),
            player: address(0x456),
            move: 2, // Corresponds to Move.Paper
            blockNumber: 100,
            balance: 1000
        });

        GameMoveStruct.GameMove memory gameMove2 = GameMoveStruct.GameMove({
            sourceChainId: 1,
            sourceContract: address(0x123),
            player: address(0x789),
            move: 1, // Corresponds to Move.Rock
            blockNumber: 100,
            balance: 1000
        });

        // Compute two leaves
        bytes32 leaf1 = CrossChainHasher.computeGameMoveLeaf(
            gameMove1.sourceChainId,
            gameMove1.sourceContract,
            gameMove1.player,
            gameMove1.move,
            gameMove1.blockNumber,
            gameMove1.balance
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

        // Create a valid proof for leaf1
        bytes32[] memory proof = new bytes32[](1);
        proof[0] = leaf2;

        // Verify the Merkle proof for leaf1
        bool isValid = verifier.verifyCrossChainProof(
            merkleRoot,
            proof,
            gameMove1
        );

        // Assert that the proof is valid
        assertTrue(isValid, "The proof verification failed");
    }
}
