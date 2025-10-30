#!/usr/bin/env ts-node
/**
 * Simple Integration Test for EventListener
 * 
 * This script tests the SimpleEventListener with Anvil blockchain.
 * 
 * Prerequisites:
 * 1. Run your deploy script first to get Anvil running and contracts deployed
 * 2. Make sure ANVIL_CONTRACT_ADDRESS is set in .env
 * 
 * Usage: npm run test:simple
 */

import { SimpleEventListener } from '../src/services/SimpleEventListener';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function runSimpleTest() {
  console.log('🧪 Simple EventListener Test');
  console.log('=============================');
  
  // Check prerequisites
  if (!process.env.ANVIL_CONTRACT_ADDRESS) {
    console.error('❌ ANVIL_CONTRACT_ADDRESS not set in .env');
    console.log('💡 Run your deploy script first!');
    process.exit(1);
  }

  let eventsDetected = 0;
  const startTime = Date.now();

  try {
    console.log('🚀 Creating SimpleEventListener...');
    console.log(`📋 Contract: ${process.env.ANVIL_CONTRACT_ADDRESS}`);
    
    // Create simple event listener
    const eventListener = new SimpleEventListener();
    
    // Check initial status
    console.log('📊 Status:', eventListener.getStatus());
    
    // Start listening
    await eventListener.startListening();
    
    console.log('✅ EventListener started successfully!');
    console.log('\n⏳ Listening for MoveCommitted events...');
    console.log('💡 Generate events by calling commitMove() on your contract');
    console.log('🛑 Press Ctrl+C to stop\n');
    
    // Show some helpful info
    console.log('📝 Example: Create events with cast (if you have foundry):');
    console.log(`cast send ${process.env.ANVIL_CONTRACT_ADDRESS} "commitMove(bytes32)" "0x67616d6531323300000000000000000000000000000000000000000000000000" --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://127.0.0.1:8545`);
    console.log('');
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`\n🛑 Shutting down... (${elapsed}s total)`);
      eventListener.stop();
      console.log(`📊 Total events detected: ${eventsDetected}`);
      console.log('✅ Test completed');
      process.exit(0);
    });

    // Keep alive
    await new Promise(() => {}); // Run forever until Ctrl+C

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection:', reason);
  process.exit(1);
});

// Run the test
console.log('🔥 Starting Simple EventListener Test...\n');
runSimpleTest().catch((error) => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});