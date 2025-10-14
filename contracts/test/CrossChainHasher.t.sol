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
}