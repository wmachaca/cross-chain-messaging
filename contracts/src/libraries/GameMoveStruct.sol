// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

library GameMoveStruct {
    struct GameMove {
        uint256 sourceChainId;
        address sourceContract;
        address player;
        uint8 move;
        uint256 blockNumber;
        uint256 balance;
    }
}
