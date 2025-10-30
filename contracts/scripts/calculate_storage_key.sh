#!/bin/bash

# Simple Move1 Storage Key Calculator
GAME_ID="0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
BASE_SLOT="2" # Storage slot of the `games` mapping
OFFSET="0x0000000000000000000000000000000000000000000000000000000000000002" # Offset for `move1` as a 256-bit hex value

# Step 1: Encode the gameId and baseSlot
ENCODED=$(cast abi-encode "f(bytes32,uint256)" "$GAME_ID" "$BASE_SLOT")
echo "Encoded (gameId + baseSlot): $ENCODED"

# Step 2: Calculate the base storage key
BASE_STORAGE_KEY=$(cast keccak "$ENCODED")
echo "Base Storage Key: $BASE_STORAGE_KEY"

# Step 3: Add the offset for move1 using bc
BASE_STORAGE_KEY_DEC=$(echo "$BASE_STORAGE_KEY" | sed 's/0x//') # Remove 0x prefix
OFFSET_DEC=$(echo "$OFFSET" | sed 's/0x//') # Remove 0x prefix from the offset
STORAGE_KEY_FOR_MOVE1=$(echo "ibase=16; obase=16; $BASE_STORAGE_KEY_DEC + $OFFSET_DEC" | bc | tr -d '\\\n') # Remove any unexpected newlines

# Step 4: Format the result as a 256-bit hexadecimal value
STORAGE_KEY_FOR_MOVE1=$(printf "0x%064s" "$STORAGE_KEY_FOR_MOVE1" | tr ' ' '0')

# Output the result
echo "Storage Key for move1: $STORAGE_KEY_FOR_MOVE1"