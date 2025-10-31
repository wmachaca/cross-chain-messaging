from web3 import Web3

# Input Parameters
GAME_ID = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"  # Replace with your gameId
BASE_SLOT = 2  # Storage slot of the `games` mapping
# slot 0 has player1 (20 bytes), player 2 (20 bytes), so move1 starts at byte 40
OFFSET = 0  # Offset for `move1` in the Game struct

# Step 1: Encode the gameId and baseSlot
encoded = Web3.solidity_keccak(
    ["bytes32", "uint256"],
    [Web3.to_bytes(hexstr=GAME_ID), BASE_SLOT]
)
print(f"Base Storage Key (keccak256(gameId, baseSlot)): {encoded.hex()}")

# Step 2: Calculate the first three slots
base_storage_key = Web3.to_int(encoded)

# Slot 0
slot_0 = Web3.to_hex(base_storage_key)
slot_0_padded = f"0x{slot_0[2:].zfill(64)}"
print(f"Slot 0: {slot_0_padded}")

# Slot 1
slot_1 = Web3.to_hex(base_storage_key + 1)
slot_1_padded = f"0x{slot_1[2:].zfill(64)}"
print(f"Slot 1: {slot_1_padded}")

# Slot 2
slot_2 = Web3.to_hex(base_storage_key + 2)
slot_2_padded = f"0x{slot_2[2:].zfill(64)}"
print(f"Slot 2: {slot_2_padded}")

# Step 3: Add the offset for move1
storage_key_for_move1 = Web3.to_int(encoded) + OFFSET
storage_key_for_move1_hex = Web3.to_hex(storage_key_for_move1)

# Step 4: Format the result as a 256-bit hexadecimal value
storage_key_for_move1_hex_padded = f"0x{storage_key_for_move1_hex[2:].zfill(64)}"

# Output the result
print(f"Storage Key for move1: {storage_key_for_move1_hex_padded}")
