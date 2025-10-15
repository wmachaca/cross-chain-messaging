// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

library CrossChainHasher {
    function computeGameMoveLeaf(
        uint256 chainId,
        address contractAddress,
        address player,
        uint8 move,
        uint256 blockNumber,
        uint256 balance
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            chainId, contractAddress, player, move, blockNumber, balance
        ));
    }

    function verifyMerkleProof(
        bytes32[] memory proof,
        bytes32 root,
        bytes32 leaf
    ) internal pure returns (bool) {
        bytes32 computedHash = leaf;

        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];

            if (computedHash <= proofElement) {
                // Hash current computed hash with the current proof element
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                // Hash current proof element with the current computed hash
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
        }

        // Check if the computed hash (root of the tree) is equal to the provided root
        return computedHash == root;
    }
}