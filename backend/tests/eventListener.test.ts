import { EventListener } from '../src/services/EventListener';
import { createWalletClient, http, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { anvil } from '../src/config/chains/anvil';

const abi = [
  'function commitMove(bytes32 gameId, uint8 move) external',
];

async function testEventListener() {
  const privateKey = '0xYOUR_PRIVATE_KEY'; // Replace with your private key
  const account = privateKeyToAccount(privateKey);

  const walletClient = createWalletClient({
    chain: anvil,
    transport: http(),
    account,
  });

  const contractAddress = '0xYOUR_DEPLOYED_CONTRACT_ADDRESS'; // Replace with the deployed contract address

  const contract = {
    address: contractAddress,
    abi: parseAbi(abi),
  };

  // Start the EventListener
  const eventListener = new EventListener();
  await eventListener.startListening();

  console.log('🚀 EventListener started. Sending test transaction...');

  // Simulate a game move
  const gameId = '0x' + '1234567890abcdef'.repeat(2); // Example gameId
  const move = 1; // Example move (e.g., Rock)

  const txHash = await walletClient.writeContract({
    ...contract,
    functionName: 'commitMove',
    args: [gameId, move],
  });

  console.log(`✅ Test transaction sent: ${txHash}`);
}

testEventListener().catch(console.error);
