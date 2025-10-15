// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./libraries/CrossChainHasher.sol";
import "./libraries/GameMoveStruct.sol";

contract Verifier {
    using CrossChainHasher for bytes32;

    // Track used proofs to prevent replay attacks
    mapping(bytes32 => bool) public usedProofs;

    event ProofVerified(
        bytes32 indexed proofId,
        address indexed verifier,
        uint256 sourceChainId
    );

    /**
     * @dev Verifies a cross-chain message proof
     * Called by the oracle/relayer to prove an event happened on another chain
     * @param merkleRoot The root of the Merkle tree
     * @param proof The Merkle proof
     * @param gameMove The game move data (source chain, contract, player, etc.)
     * @return isValid True if the proof is valid, false otherwise
     */
    function verifyCrossChainProof(
        bytes32 merkleRoot,
        bytes32[] calldata proof,
        GameMoveStruct.GameMove calldata gameMove
    ) external returns (bool) {
        // Prevent replay attacks
        bytes32 proofId = keccak256(abi.encodePacked(merkleRoot, gameMove.sourceChainId, gameMove.player));
        require(!usedProofs[proofId], "Proof already used");
        usedProofs[proofId] = true;

        // Create the leaf that should be in the Merkle tree
        bytes32 leaf = CrossChainHasher.computeGameMoveLeaf(
            gameMove.sourceChainId,
            gameMove.sourceContract,
            gameMove.player,
            gameMove.move,
            gameMove.blockNumber,
            gameMove.balance
        );

        // Verify the proof
        bool isValid = CrossChainHasher.verifyMerkleProof(proof, merkleRoot, leaf);

        if (isValid) {
            emit ProofVerified(proofId, msg.sender, gameMove.sourceChainId);
        }

        return isValid;
    }
}