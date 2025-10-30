# EventListener Testing Guide 🎯

This guide will help you test the EventListener implementation step by step.

## 🚀 Quick Start

### Prerequisites
1. **Node.js** (v18+) and **npm** installed
2. **Foundry/Anvil** installed for local blockchain testing
3. Backend dependencies installed: `npm install`

### Step 1: Start Local Blockchain (Anvil)

```bash
# Terminal 1: Start Anvil local blockchain
anvil
```

This will start a local blockchain on `http://127.0.0.1:8545` with pre-funded accounts.

### Step 2: Deploy Test Contract

```bash
# Terminal 2: Deploy test contract and generate events
cd backend
npm run deploy:test
```

This script will:
- ✅ Deploy a test contract that emits `MoveCommitted` events
- ✅ Generate sample transactions to create events
- ✅ Display the contract address for your `.env` file

### Step 3: Update Environment

Add the contract address to your `.env` file:
```env
ANVIL_CONTRACT_ADDRESS=0x... # Address from deployment script
```

### Step 4: Test EventListener

```bash
# Option A: Integration test with real blockchain
npm run test:integration

# Option B: Unit tests with Jest (fast, mocked)
npm test

# Option C: Full server with EventListener
npm run dev
```

## 🧪 Testing Scenarios

### 1. **Integration Test (Real Blockchain)**
```bash
npm run test:integration
```

**What it does:**
- ✅ Starts EventListener with callback logging
- ✅ Monitors all configured chains
- ✅ Shows real-time status updates
- ✅ Processes events as they occur

**Expected Output:**
```
🧪 Testing EventListener with local setup...
🚀 Starting EventListener...
📊 Initial Status: { isListening: false, chainsMonitored: [31337], activeWatchers: 0 }
✅ EventListener started successfully!
📡 Monitored chains: [ 31337 ]
🔄 Status: { isListening: true, chainsMonitored: [31337], activeWatchers: 1 }
⏳ Listening for events... (Press Ctrl+C to stop)
```

### 2. **Full Server Integration Test**
```bash
npm run dev
```

**What it does:**
- ✅ Starts Express server with EventListener
- ✅ Provides API endpoints for status
- ✅ Handles game moves through callback

**Test the API:**
```bash
# Check server health
curl http://localhost:5000/health

# Check relayer status
curl http://localhost:5000/api/relayer/status
```

**Expected Status Response:**
```json
{
  "status": "operational",
  "mode": "development",
  "eventListener": {
    "isListening": true,
    "chainsMonitored": [31337],
    "activeWatchers": 1
  },
  "chainsMonitored": [31337],
  "pendingMessages": 0,
  "processedMessages": 0,
  "uptime": 15.234
}
```

### 3. **Jest Unit Tests**
```bash
npm test
```

**What it tests:**
- ✅ EventListener initialization
- ✅ Client creation for multiple chains
- ✅ Event watching and unwatching
- ✅ Block processing with finality checks
- ✅ Game move event parsing
- ✅ Error handling and graceful shutdown

### 4. **Generate More Test Events**

While EventListener is running, generate more events:
```bash
# In another terminal
npm run deploy:test
```

You should see the EventListener process the new events in real-time.

## 🔍 Debugging

### Common Issues

**1. Contract Address Not Set**
```
Error getting events for chain 31337: Error: ...
```
**Solution:** Make sure `ANVIL_CONTRACT_ADDRESS` is set in `.env`

**2. Anvil Not Running**
```
❌ Failed to start server: Error: connect ECONNREFUSED 127.0.0.1:8545
```
**Solution:** Start Anvil first: `anvil`

**3. No Events Detected**
- ✅ Check if contract address is correct
- ✅ Verify Anvil is on the right port (8545)
- ✅ Generate new events with `npm run deploy:test`

### Verbose Logging

For detailed debugging, modify the EventListener constructor:
```typescript
const eventListener = new EventListener(async (gameMove) => {
  console.log('🎮 FULL Game Move Data:', gameMove);
});
```

## 📊 Event Structure

The EventListener processes events with this structure:

```typescript
interface GameMove {
  gameId: string;        // "0x1234..."
  player: string;        // "0x742d..."
  move: number;          // 1, 2, or 3
  chainId: number;       // 31337 for Anvil
  blockNumber: number;   // Block where event occurred
  balance: string;       // Player balance in wei
  txHash: string;        // Transaction hash
  timestamp?: number;    // Unix timestamp
}
```

## 🎯 Next Steps

Once EventListener is working:

1. **Add Real Contract Integration**
   - Deploy your actual CrossChainRPS contract
   - Update contract ABI and address

2. **Implement MerkleService**
   - Process game moves to create Merkle proofs
   - Store proofs for cross-chain verification

3. **Add Database Storage**
   - Store game moves and proofs
   - Implement replay protection

4. **Multi-Chain Testing**
   - Test with Sepolia and Mumbai testnets
   - Verify cross-chain event handling

5. **Production Deployment**
   - Configure RPC endpoints
   - Set up monitoring and alerts

## 🛠️ Troubleshooting Commands

```bash
# Check Anvil status
curl -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://127.0.0.1:8545

# Check contract deployment
cast code $ANVIL_CONTRACT_ADDRESS --rpc-url http://127.0.0.1:8545

# View recent blocks
cast block latest --rpc-url http://127.0.0.1:8545

# Monitor transaction pool
cast pool --rpc-url http://127.0.0.1:8545
```

## ✅ Success Indicators

Your EventListener is working correctly when you see:

1. ✅ **Successful initialization:** "Event listener started for X chains"
2. ✅ **Active monitoring:** Status shows `isListening: true`
3. ✅ **Event processing:** "🎮 Received game move" logs appear
4. ✅ **Proper parsing:** Game move data shows correct values
5. ✅ **Graceful shutdown:** Clean stop with Ctrl+C

Happy testing! 🚀