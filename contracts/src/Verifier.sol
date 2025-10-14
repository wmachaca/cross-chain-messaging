// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./libraries/CrossChainHasher.sol";

contract Verifier {
    using CrossChainHasher for bytes32;
    
    // Track used proofs to prevent replay attacks
    mapping(bytes32 => bool) public usedProofs;
    
    event ProofVerified(
        bytes32 indexed proofId,
        address indexed verifier,
        uint256 sourceChainId
    );
    
    /**Verifies a cross-chain message proof
     * Called by the oracle/relayer to prove an event happened on another chain
     */
    function verifyCrossChainProof(
        bytes32 merkleRoot,
        bytes32[] calldata proof,
        uint256 sourceChainId,
        address sourceContract,
        address player,
        uint8 move,
        uint256 blockNumber,
        uint256 balance
    ) external returns (bool) {
        // Prevent replay attacks
        bytes32 proofId = keccak256(abi.encodePacked(merkleRoot, sourceChainId, player));
        require(!usedProofs[proofId], "Proof already used");
        usedProofs[proofId] = true;
        
        // Create the leaf that should be in the Merkle tree
        bytes32 leaf = CrossChainHasher.computeGameMoveLeaf(
            sourceChainId,
            sourceContract,
            player,
            move,
            blockNumber,
            balance
        );
        
        // Verify the proof
        bool isValid = CrossChainHasher.verifyMerkleProof(proof, merkleRoot, leaf);
        
        if (isValid) {
            emit ProofVerified(proofId, msg.sender, sourceChainId);
        }
        
        return isValid;
    }
}