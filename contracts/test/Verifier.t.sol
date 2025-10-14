// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/Verifier.sol";
import "../src/libraries/CrossChainHasher.sol";

contract VerifierTest is Test {
    Verifier verifier;

    function setUp() public {
        verifier = new Verifier();
    }

    function testVerifier() public {
        // Define test inputs
        uint256 sourceChainId = 1;
        address sourceContract = address(0x123);
        address player = address(0x456);
        uint8 move = 2; // Corresponds to Move.Paper
        uint256 blockNumber = 100;
        uint256 balance = 1000;
        uint256 eventId = 42;

        // Create a Merkle tree root and proof
        bytes32 leaf = CrossChainHasher.computeGameMoveLeaf(
            sourceChainId,
            sourceContract,
            player,
            move,
            blockNumber,
            balance,
            eventId
        );
        bytes32[] memory proof = new bytes32[](1);
        proof[0] = leaf; // Simplified proof for testing
        bytes32 merkleRoot = leaf; // Simplified Merkle root for testing

        // Verify the proof
        bool isValid = verifier.verifyCrossChainProof(
            merkleRoot,
            proof,
            sourceChainId,
            sourceContract,
            player,
            move,
            blockNumber,
            balance
        );

        // Assert that the proof is valid
        assertTrue(isValid, "The proof verification failed");
    }
}
