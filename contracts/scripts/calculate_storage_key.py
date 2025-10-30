from web3 import Web3

# Input Parameters
GAME_ID = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"  # Replace with your gameId
BASE_SLOT = 2  # Storage slot of the `games` mapping
OFFSET = 2  # Offset for `move1` in the Game struct

# Step 1: Encode the gameId and baseSlot
encoded = Web3.solidity_keccak(
    ["bytes32", "uint256"],
    [Web3.to_bytes(hexstr=GAME_ID), BASE_SLOT]
)
print(f"Base Storage Key (keccak256(gameId, baseSlot)): {encoded.hex()}")

# Step 2: Add the offset for move1
storage_key_for_move1 = Web3.to_int(encoded) + OFFSET
storage_key_for_move1_hex = Web3.to_hex(storage_key_for_move1)

# Step 3: Format the result as a 256-bit hexadecimal value
storage_key_for_move1_hex_padded = f"0x{storage_key_for_move1_hex[2:].zfill(64)}"

# Output the result
print(f"Storage Key for move1: {storage_key_for_move1_hex_padded}")
