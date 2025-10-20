#!/usr/bin/env ts-node
/**
 * Integration Test for EventListener with Real Blockchain
 * 
 * This script tests EventListener with actual Anvil blockchain.
 * Prerequisites:
 * 1. Run `anvil` in another terminal
 * 2. Deploy test contract with `npm run deploy:test`
 * 3. Set ANVIL_CONTRACT_ADDRESS in .env
 * 
 * Usage: npm run test:integration
 */

import { EventListener } from '../src/services/EventListener';
import { GameMove } from '../src/models/GameMove';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function runIntegrationTest() {
  console.log('🧪 EventListener Integration Test');
  console.log('=====================================');
  
  // Check prerequisites
  if (!process.env.ANVIL_CONTRACT_ADDRESS) {
    console.error('❌ ANVIL_CONTRACT_ADDRESS not set in .env');
    console.log('💡 Run: npm run deploy:test');
    process.exit(1);
  }

  let processedMoves = 0;
  const startTime = Date.now();

  // Create event listener
  const eventListener = new EventListener();
  
  // Set up event handler for detected game moves
  eventListener.on('gameMoveDetected', (gameMove: GameMove) => {
    processedMoves++;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log(`\n📨 [${processedMoves}] Game Move Detected (${elapsed}s):`);
    console.log(`   Game ID: ${gameMove.gameId.slice(0, 10)}...`);
    console.log(`   Player:  ${gameMove.player.slice(0, 6)}...${gameMove.player.slice(-4)}`);
    console.log(`   Move:    ${gameMove.move} (${getMoveLabel(gameMove.move)})`);
    console.log(`   Chain:   ${gameMove.chainId}`);
    console.log(`   Block:   ${gameMove.blockNumber}`);
    console.log(`   Balance: ${formatBalance(gameMove.balance)} ETH`);
    console.log(`   TX:      ${gameMove.txHash.slice(0, 10)}...`);
  });

  try {
    console.log('🚀 Starting EventListener...');
    console.log(`📋 Contract: ${process.env.ANVIL_CONTRACT_ADDRESS}`);
    
    // Check initial status
    const initialStatus = eventListener.getStatus();
    console.log('📊 Initial Status:', initialStatus);
    
    // Start listening
    await eventListener.startListening();
    
    console.log('✅ EventListener started successfully!');
    console.log('📡 Monitored chains:', eventListener.getMonitoredChains());
    console.log('🔄 Final Status:', eventListener.getStatus());
    
    console.log('\n⏳ Listening for blockchain events...');
    console.log('💡 Generate events with: npm run deploy:test');
    console.log('🛑 Press Ctrl+C to stop\n');
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`\n🛑 Shutting down... (${elapsed}s total)`);
      await eventListener.stopListening();
      console.log(`📊 Total moves processed: ${processedMoves}`);
      console.log('✅ Integration test completed');
      process.exit(0);
    });

    // Keep alive
    await new Promise(() => {}); // Run forever until Ctrl+C

  } catch (error) {
    console.error('❌ Integration test failed:', error);
    process.exit(1);
  }
}

// Helper functions
function getMoveLabel(move: number): string {
  const labels: Record<number, string> = {
    1: 'Rock 🪨',
    2: 'Paper 📄', 
    3: 'Scissors ✂️'
  };
  return labels[move] || 'Unknown';
}

function formatBalance(balanceWei: string): string {
  return (parseInt(balanceWei) / 1e18).toFixed(4);
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the integration test
console.log('🔥 Starting EventListener Integration Test...\n');
runIntegrationTest().catch((error) => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});