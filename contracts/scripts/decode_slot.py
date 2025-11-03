#!/usr/bin/env python3
"""
Decode a 32-byte storage slot word coming from `cast storage` or `eth_getProof`.

Usage:
  python3 decode_slot.py 0x000000000000000000000003f39fd6e51aad88f6f4ce6ab8827279cfffb92266

Output:
  Owner: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
  myMove (decimal): 3
  myMove (hex): 0x03

Notes:
- This assumes the layout reported by `forge inspect` where:
    _owner (address) -> slot 0, offset 0, 20 bytes (lowest-order 20 bytes)
    myMove (enum)    -> slot 0, offset 20, 1 byte (the byte immediately left of the owner)
- If your layout differs, adjust the shifts/masks below accordingly.
"""
import sys


def decode_slot(hexword: str):
    h = hexword.strip().lower()
    if h.startswith('0x'):
        h = h[2:]
    if len(h) > 64:
        # accept longer strings but keep last 64 hex chars (low-order 32 bytes)
        h = h[-64:]
    h = h.rjust(64, '0')

    # owner: lowest-order 20 bytes => rightmost 40 hex chars
    owner_hex = h[-40:]
    owner_addr = '0x' + owner_hex

    # myMove: at offset 20 bytes => the byte immediately left of owner's 20 bytes
    mymove_index = len(h) - 40 - 2
    if mymove_index < 0:
        mymove_hex = '00'
    else:
        mymove_hex = h[mymove_index:mymove_index + 2]

    mymove_val = int(mymove_hex, 16)

    return owner_addr, mymove_val, '0x' + mymove_hex


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: python3 decode_slot.py <hex-word>')
        print('Example: python3 decode_slot.py 0x000000000000000000000003f39fd6e51aad88f6f4ce6ab8827279cfffb92266')
        sys.exit(1)
    word = sys.argv[1]
    owner, mm_val, mm_hex = decode_slot(word)
    print(f'Owner: {owner}')
    print(f'myMove (decimal): {mm_val}')
    print(f'myMove (hex): {mm_hex}')
