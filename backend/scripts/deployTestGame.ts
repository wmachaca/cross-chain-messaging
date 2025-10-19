import { createWalletClient, http, parseAbi, parseAbiItem } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { anvil } from '../src/config/chains/anvil';

const abi = [
  'event MoveCommitted(bytes32 indexed gameId, address indexed player, uint8 move, uint256 blockNumber, uint256 balance)',
  'function commitMove(bytes32 gameId, uint8 move) external',
];

const bytecode = 'YOUR_COMPILED_BYTECODE_HERE'; // Replace with the compiled bytecode of TestGame.sol

async function deployTestGame() {
  const privateKey = '0xYOUR_PRIVATE_KEY'; // Replace with your private key
  const account = privateKeyToAccount(privateKey);

  const walletClient = createWalletClient({
    chain: anvil,
    transport: http(),
    account,
  });

  const { contractAddress } = await walletClient.deployContract({
    abi: parseAbi(abi),
    bytecode,
  });

  console.log(`TestGame deployed at: ${contractAddress}`);
}

deployTestGame().catch(console.error);
