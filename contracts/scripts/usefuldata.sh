#xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx#
# STEP1: play game in chain a and chain b
#xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx#

#chain 1
## see myMove
cast call 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 "myMove()" --rpc-url http://127.0.0.1:8545

## see verifier
cast call 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 "verifier()" --rpc-url http://127.0.0.1:8545

## see oponent
cast call 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 "oponent()" --rpc-url http://127.0.0.1:8545

## see details of the transaction
cast tx <TRANSACTION_HASH> --rpc-url http://127.0.0.1:8545

## retrieve the raw logs (events)
cast receipt <TRANSACTION_HASH> --rpc-url http://127.0.0.1:8545

## getStatus before play in chain 1
cast call 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 "getStatus()" --rpc-url http://127.0.0.1:8545

## play in chain 1
cast send 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 "playGame()" --rpc-url http://127.0.0.1:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

## getStatus after play in chain 1
cast call 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 "getStatus()" --rpc-url http://127.0.0.1:8545

## see myMove after play in chain 1
cast call 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 "myMove()" --rpc-url http://127.0.0.1:8545
0x0000000000000000000000000000000000000000000000000000000000000003

## see the blocknumber in chain 1
cast block-number --rpc-url http://127.0.0.1:8545
4

# chain 2
## see myMove
cast call 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 "myMove()" --rpc-url http://127.0.0.1:8546

## see verifier
cast call 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 "verifier()" --rpc-url http://127.0.0.1:8546

## see oponent
cast call 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 "oponent()" --rpc-url http://127.0.0.1:8546

## getStatus before play in chain 2
cast call 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 "getStatus()" --rpc-url http://127.0.0.1:8546

## play in chain 2
cast send 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 "playGame()" --rpc-url http://127.0.0.1:8546 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

## getStatus after play in chain 2
cast call 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 "getStatus()" --rpc-url http://127.0.0.1:8546

## see myMove after play in chain 2
cast call 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 "myMove()" --rpc-url http://127.0.0.1:8546
0x0000000000000000000000000000000000000000000000000000000000000003

## see the blocknumber in chain 2
cast block-number --rpc-url http://127.0.0.1:8546
4

#xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx#
#STEP 2: obtain the storage proof
#xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx#

#chain 1

## see the slot where is stored myMove
forge inspect src/CrossChainRPS.sol:CrossChainRPS storage-layout
╭----------+-----------------------------+------+--------+-------+-------------------------------------╮
| Name     | Type                        | Slot | Offset | Bytes | Contract                            |
+======================================================================================================+
| _owner   | address                     | 0    | 0      | 20    | src/CrossChainRPS.sol:CrossChainRPS |
|----------+-----------------------------+------+--------+-------+-------------------------------------|
| myMove   | enum CrossChainRPS.Move     | 0    | 20     | 1     | src/CrossChainRPS.sol:CrossChainRPS |
|----------+-----------------------------+------+--------+-------+-------------------------------------|
| verifier | contract Verifier           | 1    | 0      | 20    | src/CrossChainRPS.sol:CrossChainRPS |
|----------+-----------------------------+------+--------+-------+-------------------------------------|
| oponent  | address                     | 2    | 0      | 20    | src/CrossChainRPS.sol:CrossChainRPS |
|----------+-----------------------------+------+--------+-------+-------------------------------------|
| balances | mapping(address => uint256) | 3    | 0      | 32    | src/CrossChainRPS.sol:CrossChainRPS |
╰----------+-----------------------------+------+--------+-------+-------------------------------------╯

## myMove is in storage slot 0, offset 20. Then I should use only the slot 0x0 to obtaine the proof
cast storage 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 0x0000000000000000000000000000000000000000000000000000000000000000 --rpc-url http://127.0.0.1:8545
0x000000000000000000000003f39fd6e51aad88f6f4ce6ab8827279cfffb92266 ## here is the address and myMove

## decode the slot 0x0
HEX=$(cast storage 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 0x0 --rpc-url http://127.0.0.1:8545)
python3 decode_slot.py "$HEX"
Owner: 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
myMove (decimal): 3
myMove (hex): 0x03


## get_proof for myMove state on chain A at block N
curl -s -X POST -H "Content-Type: application/json" --data "{
  \"jsonrpc\":\"2.0\",
  \"method\":\"eth_getProof\",
  \"params\":[
    \"<CONTRACT_ADDRESS>\",
    [\"<STORAGE_KEY_FOR_MOVE1>\"],
    \"<BLOCK_NUMBER>\"
  ],
  \"id\":1
}" http://127.0.0.1:8545

curl -s -X POST -H "Content-Type: application/json" --data "{
  \"jsonrpc\":\"2.0\",
  \"method\":\"eth_getProof\",
  \"params\":[
    \"0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512\",
    [\"0x0000000000000000000000000000000000000000000000000000000000000000\"],
    \"0x4\"
  ],
  \"id\":1
}" http://127.0.0.1:8545


{
    "jsonrpc": "2.0",
    "id": 1,
    "result": {
        "address": "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512",
        "balance": "0x1bc16d674ec80000",
        "codeHash": "0x9c584a08bb9dd2c46bbd3ea74f87c3c1212fdf5312c5d94e1cba46a71cf4d6bf",
        "nonce": "0x1",
        "storageHash": "0x3fc49721ada88f7882eb8870325b82814a162809d2ed0020e867aad70e69563d",
        "accountProof": [
            "0xf90151a0b91a8b7a7e9d3eab90afd81da3725030742f663c6ed8c26657bf00d842a9f4aaa01689b2a5203afd9ea0a0ca3765e4a538c7176e53eac1f8307a344ffc3c6176558080a03494b35fa56bb11e49c44ff1d93b1cae4a781f3dd28654620fee905cdd701b93a00f6ae0a3ab171a0456ed6954722d6d0258b524b369a520ae811112b8d169bc4c80a049a0b8022ec2f0ba201c15caa5c064c3f66b7ec2f6fae42f625ecc04814966c2a04b29efa44ecf50c19b34950cf1d0f05e00568bcc873120fbea9a4e8439de0962a0d0a1bfe5b45d2d863a794f016450a4caca04f3b599e8d1652afca8b752935fd880a0bf9b09e442e044778b354abbadb5ec049d7f5e8b585c3966d476c4fbc9a181d28080a05ee4346bd148094b7c67b5735b74d5db66d6b5e69886470d2a20488e3cdb1884a0e5c557a0ce3894afeb44c37f3d24247f67dc76a174d8cacc360c1210eef60a7680",
            "0xf871a0398c6047767c10f653ca157a7f66a592a1d6ca550cae352912be0b0745336afdb84ef84c01881bc16d674ec80000a03fc49721ada88f7882eb8870325b82814a162809d2ed0020e867aad70e69563da09c584a08bb9dd2c46bbd3ea74f87c3c1212fdf5312c5d94e1cba46a71cf4d6bf"
        ],
        "storageProof": [
            {
                "key": "0x0000000000000000000000000000000000000000000000000000000000000000",
                "value": "0x3f39fd6e51aad88f6f4ce6ab8827279cfffb92266",
                "proof": [
                    "0xf8718080a091c8e095ea1f3472dac5a63e513ee2de6156a639a22fe573aa159d36b84c4ba680808080808080a00dcbfe8a9a0d2b9707f23203456c4a4c64ea933fa2dc73819444814fa253c393a0e2497643de94a8d5c1149eda838ceebf88858bc6b3c1f8f62e4a0381f5d474fe8080808080",
                    "0xf838a0390decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563969503f39fd6e51aad88f6f4ce6ab8827279cfffb92266"
                ]
            }
        ]
    }
}

### decode from eth.get_proof
python3 scripts/decode_slot.py 0x3f39fd6e51aad88f6f4ce6ab8827279cfffb92266
Owner: 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
myMove (decimal): 3
myMove (hex): 0x03



#chain 2

## see the slot where is stored myMove
forge inspect src/CrossChainRPS.sol:CrossChainRPS storage-layout
╭----------+-----------------------------+------+--------+-------+-------------------------------------╮
| Name     | Type                        | Slot | Offset | Bytes | Contract                            |
+======================================================================================================+
| _owner   | address                     | 0    | 0      | 20    | src/CrossChainRPS.sol:CrossChainRPS |
|----------+-----------------------------+------+--------+-------+-------------------------------------|
| myMove   | enum CrossChainRPS.Move     | 0    | 20     | 1     | src/CrossChainRPS.sol:CrossChainRPS |
|----------+-----------------------------+------+--------+-------+-------------------------------------|
| verifier | contract Verifier           | 1    | 0      | 20    | src/CrossChainRPS.sol:CrossChainRPS |
|----------+-----------------------------+------+--------+-------+-------------------------------------|
| oponent  | address                     | 2    | 0      | 20    | src/CrossChainRPS.sol:CrossChainRPS |
|----------+-----------------------------+------+--------+-------+-------------------------------------|
| balances | mapping(address => uint256) | 3    | 0      | 32    | src/CrossChainRPS.sol:CrossChainRPS |
╰----------+-----------------------------+------+--------+-------+-------------------------------------╯

## myMove is in storage slot 0, offset 20. Then I should use only the slot 0x0 to obtaine the proof
cast storage 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 0x0000000000000000000000000000000000000000000000000000000000000000 --rpc-url http://127.0.0.1:8546
0x000000000000000000000003f39fd6e51aad88f6f4ce6ab8827279cfffb92266 ## here is the address and myMove

## decode the slot 0x0
HEX=$(cast storage 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 0x0 --rpc-url http://127.0.0.1:8546)
python3 scripts/decode_slot.py "$HEX"
Owner: 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
myMove (decimal): 3
myMove (hex): 0x03


## get_proof for myMove state on chain A at block N

curl -s -X POST -H "Content-Type: application/json" --data "{
  \"jsonrpc\":\"2.0\",
  \"method\":\"eth_getProof\",
  \"params\":[
    \"0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512\",
    [\"0x0000000000000000000000000000000000000000000000000000000000000000\"],
    \"0x4\"
  ],
  \"id\":1
}" http://127.0.0.1:8546


{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "address": "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512",
    "balance": "0x1bc16d674ec80000",
    "codeHash": "0x9c584a08bb9dd2c46bbd3ea74f87c3c1212fdf5312c5d94e1cba46a71cf4d6bf",
    "nonce": "0x1",
    "storageHash": "0x3fc49721ada88f7882eb8870325b82814a162809d2ed0020e867aad70e69563d",
    "accountProof": [
      "0xf90151a0b91a8b7a7e9d3eab90afd81da3725030742f663c6ed8c26657bf00d842a9f4aaa01689b2a5203afd9ea0a0ca3765e4a538c7176e53eac1f8307a344ffc3c6176558080a03494b35fa56bb11e49c44ff1d93b1cae4a781f3dd28654620fee905cdd701b93a00f6ae0a3ab171a0456ed6954722d6d0258b524b369a520ae811112b8d169bc4c80a049a0b8022ec2f0ba201c15caa5c064c3f66b7ec2f6fae42f625ecc04814966c2a04b29efa44ecf50c19b34950cf1d0f05e00568bcc873120fbea9a4e8439de0962a0d0a1bfe5b45d2d863a794f016450a4caca04f3b599e8d1652afca8b752935fd880a0bf9b09e442e044778b354abbadb5ec049d7f5e8b585c3966d476c4fbc9a181d28080a05ee4346bd148094b7c67b5735b74d5db66d6b5e69886470d2a20488e3cdb1884a0e5c557a0ce3894afeb44c37f3d24247f67dc76a174d8cacc360c1210eef60a7680",
      "0xf871a0398c6047767c10f653ca157a7f66a592a1d6ca550cae352912be0b0745336afdb84ef84c01881bc16d674ec80000a03fc49721ada88f7882eb8870325b82814a162809d2ed0020e867aad70e69563da09c584a08bb9dd2c46bbd3ea74f87c3c1212fdf5312c5d94e1cba46a71cf4d6bf"
    ],
    "storageProof": [
      {
        "key": "0x0000000000000000000000000000000000000000000000000000000000000000",
        "value": "0x3f39fd6e51aad88f6f4ce6ab8827279cfffb92266",
        "proof": [
          "0xf8718080a091c8e095ea1f3472dac5a63e513ee2de6156a639a22fe573aa159d36b84c4ba680808080808080a00dcbfe8a9a0d2b9707f23203456c4a4c64ea933fa2dc73819444814fa253c393a0e2497643de94a8d5c1149eda838ceebf88858bc6b3c1f8f62e4a0381f5d474fe8080808080",
          "0xf838a0390decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563969503f39fd6e51aad88f6f4ce6ab8827279cfffb92266"
        ]
      }
    ]
  }
}

### decode from eth.get_proof
python3 scripts/decode_slot.py 0x3f39fd6e51aad88f6f4ce6ab8827279cfffb92266
Owner: 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
myMove (decimal): 3
myMove (hex): 0x03



#xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx#
#STEP 3: Implement the storage proof verification in the contract
#xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx#








xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
change the calculate.py because it is storage in the base slot :
cast storage <CONTRACT_ADDRESS> <BASE_SLOT> --rpc-url <RPC_URL>
0x0000000000000000000000000000000000000000000000000000000000000000









cast call 0x5FbDB2315678afecb367f032d93F642f64180aa3 "gameActive()" --rpc-url http://127.0.0.1:8545
0x0000000000000000000000000000000000000000000000000000000000000001
0x0000000000000000000000000000000000000000000000000000000000000001

cast block-number --rpc-url http://127.0.0.1:8545
2

cast block 0x2 --field stateRoot --rpc-url http://127.0.0.1:8545
0x6ac4de7b8aa03be97908fa0bf0e7f25f4cb6f80c89cd1dcf0874831e6d9b8bb0


curl -s -X POST -H "Content-Type: application/json" --data "{
  \"jsonrpc\":\"2.0\",
  \"method\":\"eth_getProof\",
  \"params\":[
    \"0x5FbDB2315678afecb367f032d93F642f64180aa3\",
    [\"0x0000000000000000000000000000000000000000000000000000000000000000\"],
    \"0x2\"
  ],
  \"id\":1
}" http://127.0.0.1:8545

{
  "jsonrpc": "2.0",
  "id": 1,
  "result":
    {
      "address": "0x5fbdb2315678afecb367f032d93f642f64180aa3",
      "balance": "0x0",
      "codeHash": "0xfc8b829689eb22796247ff8cebf24cfc93024d4374e9293b10290cd1232fe802",
      "nonce": "0x1",
      "storageHash": "0xa0766de4d6280231289c0f5a3d3912e1bf410bf7b0064d6b1cfadc1136d99d68",
      "accountProof":
        [
          "0xf90131a0b91a8b7a7e9d3eab90afd81da3725030742f663c6ed8c26657bf00d842a9f4aaa01689b2a5203afd9ea0a0ca3765e4a538c7176e53eac1f8307a344ffc3c6176558080a08fd3f7c31f7e2362b706d798f678efc412e4f7566f73f49538fec8f0ccb9a6faa0616f523ef8790739b8aff42df4bb9c159628bd946e830dc524c806c859c43e328080a04b29efa44ecf50c19b34950cf1d0f05e00568bcc873120fbea9a4e8439de0962a0d0a1bfe5b45d2d863a794f016450a4caca04f3b599e8d1652afca8b752935fd880a0bf9b09e442e044778b354abbadb5ec049d7f5e8b585c3966d476c4fbc9a181d28080a027d2a9a9700dfd8dc63ca4d40452efca7dacae7b93ab933480eab6dc5bfb6c05a0e5c557a0ce3894afeb44c37f3d24247f67dc76a174d8cacc360c1210eef60a7680",
          "0xf85180808080a075d3badc88aa70c446cc7c47509004277cb8f225559fcb79fa35d11661a8c8df80808080a074ae0767a40fc6fff780050f46a50f6b39ca4edb7faa9669108157a1cd96f40980808080808080",
          "0xf869a020e659e60b21cc961f64ad47f20523c1d329d4bbda245ef3940a76dc89d0911bb846f8440180a0a0766de4d6280231289c0f5a3d3912e1bf410bf7b0064d6b1cfadc1136d99d68a0fc8b829689eb22796247ff8cebf24cfc93024d4374e9293b10290cd1232fe802",
        ],
      "storageProof":
        [
          {
            "key": "0x0000000000000000000000000000000000000000000000000000000000000000",
            "value": "0x1",
            "proof":
              [
                "0xf89180a00d24d9b786bfb5f20e3e27e4a821dbe48ba8fb9d9d6070a9eebe63fa98591005a0f53ea298491c498054f45ef4144722abda9f6f67874477d0510aed94bb86e80880a00df1cb52b4f4ef80904c3afa137a2448cd6b1d023e56855b442bfb638e5de6e9808080808080a0236e8f61ecde6abfebc6c529441f782f62469d8a2cc47b7aace2c136bd3b1ff08080808080",
                "0xf851808080808080808080a04d0c15612e60ae90c040ff5eef0f99778a6f3dfdbdfacf954295252cef782a108080a031fab136a73a600ac565617162975a6b982fa8d423f85afc2dda447e745970fd80808080",
                "0xe2a0200decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e56301",
              ],
          },
        ],
    },
}





cast send 0x5FbDB2315678afecb367f032d93F642f64180aa3 \
    "verifySimpleProof((bytes32,address,bytes32,bytes32,bytes[],bytes[]))" \
    "(0x6ac4de7b8aa03be97908fa0bf0e7f25f4cb6f80c89cd1dcf0874831e6d9b8bb0,0x5FbDB2315678afecb367f032d93F642f64180aa3,0x0000000000000000000000000000000000000000000000000000000000000000,0x0000000000000000000000000000000000000000000000000000000000000001,[0xf90131a0b91a8b7a7e9d3eab90afd81da3725030742f663c6ed8c26657bf00d842a9f4aaa01689b2a5203afd9ea0a0ca3765e4a538c7176e53eac1f8307a344ffc3c6176558080a08fd3f7c31f7e2362b706d798f678efc412e4f7566f73f49538fec8f0ccb9a6faa0616f523ef8790739b8aff42df4bb9c159628bd946e830dc524c806c859c43e328080a04b29efa44ecf50c19b34950cf1d0f05e00568bcc873120fbea9a4e8439de0962a0d0a1bfe5b45d2d863a794f016450a4caca04f3b599e8d1652afca8b752935fd880a0bf9b09e442e044778b354abbadb5ec049d7f5e8b585c3966d476c4fbc9a181d28080a027d2a9a9700dfd8dc63ca4d40452efca7dacae7b93ab933480eab6dc5bfb6c05a0e5c557a0ce3894afeb44c37f3d24247f67dc76a174d8cacc360c1210eef60a7680,0xf85180808080a075d3badc88aa70c446cc7c47509004277cb8f225559fcb79fa35d11661a8c8df80808080a074ae0767a40fc6fff780050f46a50f6b39ca4edb7faa9669108157a1cd96f40980808080808080,0xf869a020e659e60b21cc961f64ad47f20523c1d329d4bbda245ef3940a76dc89d0911bb846f8440180a0a0766de4d6280231289c0f5a3d3912e1bf410bf7b0064d6b1cfadc1136d99d68a0fc8b829689eb22796247ff8cebf24cfc93024d4374e9293b10290cd1232fe802],[0xf89180a00d24d9b786bfb5f20e3e27e4a821dbe48ba8fb9d9d6070a9eebe63fa98591005a0f53ea298491c498054f45ef4144722abda9f6f67874477d0510aed94bb86e80880a00df1cb52b4f4ef80904c3afa137a2448cd6b1d023e56855b442bfb638e5de6e9808080808080a0236e8f61ecde6abfebc6c529441f782f62469d8a2cc47b7aace2c136bd3b1ff08080808080,0xf851808080808080808080a04d0c15612e60ae90c040ff5eef0f99778a6f3dfdbdfacf954295252cef782a108080a031fab136a73a600ac565617162975a6b982fa8d423f85afc2dda447e745970fd80808080,0xe2a0200decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e56301])" \
    --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
    --rpc-url http://127.0.0.1:8546 \
    --gas-limit 1000000


blockHash            0x63c8f67da776c76e44a801227a7459587cf969aa0ef24f0423043c1cbb8d9e8a
blockNumber          2
contractAddress
cumulativeGasUsed    102995
effectiveGasPrice    889380685
from                 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
gasUsed              102995
logs                 []
logsBloom            0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
root
status               0 (failed)
transactionHash      0x621f37da46cd902d55cf53d354331ce1ff801a13febf058079412f499e01200a
transactionIndex     0
type                 2
blobGasPrice         1
blobGasUsed
to                   0x5FbDB2315678afecb367f032d93F642f64180aa3



RUN:
# Run the full debug suite
forge test --match-contract SimpleVerifierTest -vvv

# Or run individual steps
forge test --match-test test_01_RLPParsingIndividual -vvv
forge test --match-test test_02_MerkleTrieAccountRetrieval -vvv
forge test --match-test test_05_HashValidationDeepDive -vvv
