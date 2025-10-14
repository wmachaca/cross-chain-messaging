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
}