// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/libraries/CrossChainHasher.sol";

contract CrossChainHasherTest is Test {
    function testMerkleLeafCreation() public {
        // Define test inputs
        uint256 chainId = 1;
        address contractAddress = address(0x123);
        address player = address(0x456);
        uint8 move = 2; // Corresponds to Move.Paper
        uint256 blockNumber = 100;
        uint256 balance = 1000;
        uint256 eventId = 42;

        // Expected hash
        bytes32 expectedHash = keccak256(abi.encodePacked(
            chainId, contractAddress, player, move, blockNumber, balance
        ));

        // Compute hash using the library
        bytes32 computedHash = CrossChainHasher.computeGameMoveLeaf(
            chainId, contractAddress, player, move, blockNumber, balance
        );

        // Assert that the computed hash matches the expected hash
        assertEq(computedHash, expectedHash, "The computed hash does not match the expected hash");
    }

    function testMerkleProofVerification() public {
        // Define test inputs for two leaves
        uint256 chainId = 1;
        address contractAddress = address(0x123);
        address player1 = address(0x456);
        address player2 = address(0x789);
        uint8 move1 = 2; // Corresponds to Move.Paper
        uint8 move2 = 1; // Corresponds to Move.Rock
        uint256 blockNumber = 100;
        uint256 balance = 1000;

        // Compute two leaves
        bytes32 leaf1 = CrossChainHasher.computeGameMoveLeaf(
            chainId,
            contractAddress,
            player1,
            move1,
            blockNumber,
            balance
        );

        bytes32 leaf2 = CrossChainHasher.computeGameMoveLeaf(
            chainId,
            contractAddress,
            player2,
            move2,
            blockNumber,
            balance
        );

        // Compute the Merkle root
        bytes32 merkleRoot = keccak256(abi.encodePacked(
            leaf1 < leaf2 ? abi.encodePacked(leaf1, leaf2) : abi.encodePacked(leaf2, leaf1)
        ));

        // Create a valid proof for leaf1
        bytes32[] memory proof = new bytes32[](1);
        proof[0] = leaf2;

        // Verify the Merkle proof for leaf1
        bool isValid = CrossChainHasher.verifyMerkleProof(proof, merkleRoot, leaf1);

        // Assert that the proof is valid
        assertTrue(isValid, "The Merkle proof verification failed");
    }
}