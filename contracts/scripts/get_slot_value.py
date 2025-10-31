from eth_utils import to_checksum_address

# The value from Slot 0 (replace with the actual value from eth_getProof)
slot_value = "0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266"

# Decode player1 (first 20 bytes)
player1 = "0x" + slot_value[2:42]
player1_address = to_checksum_address(player1)

# Decode player2 (next 20 bytes)
player2 = "0x" + slot_value[42:82]
if len(player2) == 2:  # If it's just "0x", set it to None
    player2_address = None
else:
    player2_address = to_checksum_address(player2)

# Decode move1 (1 byte at byte 40)
move1 = int(slot_value[82:84], 16)

# Decode move2 (1 byte at byte 41)
move2 = int(slot_value[84:86], 16)

# Print the results
print(f"Player 1: {player1_address}")
print(f"Player 2: {player2_address if player2_address else 'None'}")
print(f"Move 1: {move1}")
print(f"Move 2: {move2}")