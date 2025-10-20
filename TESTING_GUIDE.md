# 🗡️ EventListener Battle Testing Guide

This guide provides the complete workflow for testing your EventListener with **real** CrossChainRPS contracts.

## 🚀 Quick Battle Setup

### Option 1: Linux/Mac (Recommended)
```bash
# Make script executable
chmod +x setup-execute.sh

# Run complete setup and test
./setup-execute.sh
```

### Option 2: Windows
```cmd
# Run complete setup and test
setup-execute.bat
```

### Option 3: Manual Step-by-Step (Any OS)
```bash
# 1. Compile contracts
cd contracts
forge build

# 2. Start Anvil (separate terminal)
anvil

# 3. Deploy contracts (in another terminal)
cd contracts
forge create src/Verifier.sol:Verifier \
    --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
    --rpc-url http://127.0.0.1:8545

# Deploy CrossChainRPS (use Verifier address from above)
forge create src/CrossChainRPC.sol:CrossChainRPS \
    --constructor-args <VERIFIER_ADDRESS> \
    --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
    --rpc-url http://127.0.0.1:8545

# 4. Update backend/.env with contract address
cd ../backend
echo "ANVIL_CONTRACT_ADDRESS=<YOUR_CONTRACT_ADDRESS>" >> .env

# 5. Test EventListener
npm run test:integration
```

## 🎯 What Each Script Does

### `setup-execute.sh/.bat`
**Complete orchestration script that:**
1. ✅ Checks prerequisites (Foundry, Node.js)
2. ✅ Compiles your real contracts with Foundry
3. ✅ Starts Anvil blockchain
4. ✅ Deploys **your actual** CrossChainRPS contracts
5. ✅ Updates .env with real contract addresses
6. ✅ Generates test game events
7. ✅ Runs EventListener integration test

### `scripts/testEventListener.ts` 
**The integration test that matters:**
- ✅ Tests EventListener with **real** blockchain
- ✅ Monitors **real** contract events  
- ✅ Shows **real** game move detection
- ✅ Validates production-ready functionality

### `tests/eventListener.test.ts`
**Unit tests (less important for manual testing):**
- ✅ Fast mocked tests for CI/CD
- ✅ Good for development workflow
- ✅ Not connected to real blockchain

## 🎮 Testing Workflow

### 1. **Initial Setup and Test**
```bash
./setup-execute.sh
```

### 2. **Generate More Events While Testing**
In another terminal while EventListener is running:
```bash
cd contracts
cast send <CONTRACT_ADDRESS> "createGame()" \
    --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
    --rpc-url http://127.0.0.1:8545 \
    --value 0.1ether
```

### 3. **Or Use the Event Generator Script**
```bash
cd backend
npm run generate:events
```

## 📊 Expected Output

When everything works correctly, you should see:

```
🧪 EventListener Integration Test
=====================================
🚀 Starting EventListener...
📋 Contract: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
📊 Initial Status: { isListening: false, chainsMonitored: [31337], activeWatchers: 0 }
✅ EventListener started successfully!
📡 Monitored chains: [ 31337 ]
🔄 Final Status: { isListening: true, chainsMonitored: [31337], activeWatchers: 1 }

⏳ Listening for blockchain events...
💡 Generate events with: npm run generate:events
🛑 Press Ctrl+C to stop

📨 [1] Game Move Detected (2.3s):
   Game ID: 0x1234567890...
   Player:  0x742d...0b0
   Move:    1 (Rock 🪨)
   Chain:   31337
   Block:   15
   Balance: 0.1000 ETH
   TX:      0xabcdef123...
```

## 🗡️ Battle-Tested Architecture

**Why this approach is superior:**

1. **✅ Real Contracts**: Testing with your actual production contracts
2. **✅ Real Events**: EventListener processes genuine blockchain events  
3. **✅ Real Deployment**: Using Foundry like in production
4. **✅ Real Integration**: Complete end-to-end validation
5. **✅ Production Ready**: Everything tested works in mainnet

## 🛠️ Troubleshooting

### Anvil Won't Start
```bash
# Kill any existing anvil processes
pkill anvil

# Start fresh
anvil --host 0.0.0.0 --port 8545
```

### Contract Deployment Fails
```bash
# Check Anvil is running
curl -X POST -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
    http://127.0.0.1:8545

# Recompile contracts
cd contracts
forge build --force
```

### EventListener Not Detecting Events
```bash
# Verify contract address in .env
cat backend/.env | grep ANVIL_CONTRACT_ADDRESS

# Generate new events
cd contracts
cast send $CONTRACT_ADDRESS "createGame()" --private-key 0xac... --rpc-url http://127.0.0.1:8545 --value 0.1ether
```

## 🏆 Victory Conditions

Your EventListener is battle-ready when:

1. ✅ **Setup script runs without errors**
2. ✅ **Contracts deploy successfully to Anvil** 
3. ✅ **EventListener starts and shows "isListening: true"**
4. ✅ **Game events are detected and displayed**
5. ✅ **Event data shows correct game information**

**Now you have a gladiator-worthy EventListener! ⚔️🛡️**