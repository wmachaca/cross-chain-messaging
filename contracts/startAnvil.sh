#!/bin/bash

# 🗡️ Cross-Chain Dual EventListener Battle Setup Script
# This script orchestrates dual-chain testing environment

set -e  # Exit on any error

echo "🗡️ ==============================================="
echo "   Cross-Chain Dual EventListener Battle Setup"
echo "   ==============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists "anvil"; then
        print_error "Anvil not found. Please install Foundry:"
        print_error "curl -L https://foundry.paradigm.xyz | bash"
        print_error "foundryup"
        exit 1
    fi
    
    if ! command_exists "forge"; then
        print_error "Forge not found. Please install Foundry"
        exit 1
    fi
    
    if ! command_exists "node"; then
        print_error "Node.js not found. Please install Node.js"
        exit 1
    fi
    
    print_success "All prerequisites found!"
}

# Function to cleanup background processes (simplified)
cleanup() {
    print_status "Script completed. Anvil chains continue running in background."
    print_warning "To stop both chains: kill $ANVIL1_PID $ANVIL2_PID"
    print_warning "Or use: pkill -f anvil"
}

# Set trap for cleanup on exit
trap cleanup EXIT

# Step 1: Check prerequisites
check_prerequisites

# Step 2: Kill existing anvil processes
print_status "Cleaning up existing Anvil processes..."
pkill -f anvil || true
sleep 2

# Step 3: Compile contracts
print_status "Compiling contracts with Foundry..."
forge build
if [ $? -eq 0 ]; then
    print_success "Contracts compiled successfully!"
else
    print_error "Contract compilation failed!"
    exit 1
fi

# Step 4: Start dual Anvil chains
print_status "Starting Anvil Chain 1 (port 8545, chain ID 31337)..."
anvil --host 0.0.0.0 --port 8545 --chain-id 31337 > anvil_chain1.log 2>&1 &
ANVIL1_PID=$!

print_status "Starting Anvil Chain 2 (port 8546, chain ID 31338)..."
anvil --host 0.0.0.0 --port 8546 --chain-id 31338 > anvil_chain2.log 2>&1 &
ANVIL2_PID=$!

# Wait for both chains to start
print_status "Waiting for both Anvil chains to start..."
sleep 5

# Check if Chain 1 is running
if ! curl -s -X POST -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
    http://127.0.0.1:8545 > /dev/null; then
    print_error "Anvil Chain 1 failed to start!"
    exit 1
fi

# Check if Chain 2 is running
if ! curl -s -X POST -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
    http://127.0.0.1:8546 > /dev/null; then
    print_error "Anvil Chain 2 failed to start!"
    exit 1
fi

print_success "Both Anvil chains are running!"
print_status "Chain 1: http://127.0.0.1:8545 (PID: $ANVIL1_PID)"
print_status "Chain 2: http://127.0.0.1:8546 (PID: $ANVIL2_PID)"

# Step 5: Deploy contracts to Chain 1
print_status "🚀 Deploying contracts to Chain 1 (31337)..."

# Deploy Verifier to Chain 1
print_status "Deploying Verifier contract to Chain 1..."
VERIFIER1_OUTPUT=$(forge create --broadcast --rpc-url http://127.0.0.1:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 src/Verifier.sol:Verifier)

VERIFIER1_ADDRESS=$(echo "$VERIFIER1_OUTPUT" | grep "Deployed to:" | awk '{print $3}')

if [ ! -z "$VERIFIER1_ADDRESS" ] && [[ $VERIFIER1_ADDRESS =~ ^0x[a-fA-F0-9]{40}$ ]]; then
    print_success "Chain 1 - Verifier deployed at: $VERIFIER1_ADDRESS"
else
    print_error "Failed to deploy Verifier to Chain 1!"
    print_error "Output: $VERIFIER1_OUTPUT"
    exit 1
fi

# Deploy CrossChainRPS to Chain 1
print_status "Deploying CrossChainRPS contract to Chain 1..."
CROSSCHAIN1_OUTPUT=$(forge create --broadcast --rpc-url http://127.0.0.1:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 src/CrossChainRPS.sol:CrossChainRPS --constructor-args $VERIFIER1_ADDRESS)

CROSSCHAIN1_ADDRESS=$(echo "$CROSSCHAIN1_OUTPUT" | grep "Deployed to:" | awk '{print $3}')

if [ ! -z "$CROSSCHAIN1_ADDRESS" ] && [[ $CROSSCHAIN1_ADDRESS =~ ^0x[a-fA-F0-9]{40}$ ]]; then
    print_success "Chain 1 - CrossChainRPS deployed at: $CROSSCHAIN1_ADDRESS"
else
    print_error "Failed to deploy CrossChainRPS to Chain 1!"
    print_error "Output: $CROSSCHAIN1_OUTPUT"
    exit 1
fi

# Step 6: Deploy contracts to Chain 2
print_status "🚀 Deploying contracts to Chain 2 (31338)..."

# Deploy Verifier to Chain 2
print_status "Deploying Verifier contract to Chain 2..."
VERIFIER2_OUTPUT=$(forge create --broadcast --rpc-url http://127.0.0.1:8546 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 src/Verifier.sol:Verifier)

VERIFIER2_ADDRESS=$(echo "$VERIFIER2_OUTPUT" | grep "Deployed to:" | awk '{print $3}')

if [ ! -z "$VERIFIER2_ADDRESS" ] && [[ $VERIFIER2_ADDRESS =~ ^0x[a-fA-F0-9]{40}$ ]]; then
    print_success "Chain 2 - Verifier deployed at: $VERIFIER2_ADDRESS"
else
    print_error "Failed to deploy Verifier to Chain 2!"
    print_error "Output: $VERIFIER2_OUTPUT"
    exit 1
fi

# Deploy CrossChainRPS to Chain 2
print_status "Deploying CrossChainRPS contract to Chain 2..."
CROSSCHAIN2_OUTPUT=$(forge create --broadcast --rpc-url http://127.0.0.1:8546 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 src/CrossChainRPS.sol:CrossChainRPS --constructor-args $VERIFIER2_ADDRESS)

CROSSCHAIN2_ADDRESS=$(echo "$CROSSCHAIN2_OUTPUT" | grep "Deployed to:" | awk '{print $3}')

if [ ! -z "$CROSSCHAIN2_ADDRESS" ] && [[ $CROSSCHAIN2_ADDRESS =~ ^0x[a-fA-F0-9]{40}$ ]]; then
    print_success "Chain 2 - CrossChainRPS deployed at: $CROSSCHAIN2_ADDRESS"
else
    print_error "Failed to deploy CrossChainRPS to Chain 2!"
    print_error "Output: $CROSSCHAIN2_OUTPUT"
    exit 1
fi

# Step 7: Update backend .env file with both chain configurations
print_status "Updating backend .env file with dual-chain configuration..."
cd ../backend

# Create comprehensive .env file
cat > .env << EOF
# Development Environment Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Chain Configuration
USE_TESTNETS=false

# Anvil Chain 1 (Primary - Port 8545, Chain ID 31337)
ANVIL_RPC_URL=http://127.0.0.1:8545
ANVIL_CONTRACT_ADDRESS=$CROSSCHAIN1_ADDRESS
ANVIL_VERIFIER_ADDRESS=$VERIFIER1_ADDRESS

# Anvil Chain 2 (Secondary - Port 8546, Chain ID 31338)
ANVIL_RPC_URL_2=http://127.0.0.1:8546
ANVIL_CONTRACT_ADDRESS_2=$CROSSCHAIN2_ADDRESS
ANVIL_VERIFIER_ADDRESS_2=$VERIFIER2_ADDRESS

# Testnet Configuration (for when USE_TESTNETS=true)
ETH_SEPOLIA_RPC=https://eth-sepolia.g.alchemy.com/v2/demo
POLYGON_MUMBAI_RPC=https://polygon-mumbai.g.alchemy.com/v2/demo
SEPOLIA_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
MUMBAI_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
SEPOLIA_VERIFIER_ADDRESS=0x0000000000000000000000000000000000000000
MUMBAI_VERIFIER_ADDRESS=0x0000000000000000000000000000000000000000

# Relayer Configuration
RELAYER_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
EOF

print_success "Backend .env file updated with dual-chain configuration!"

# Step 8: Fund accounts on both chains
print_status "Funding deployer accounts on both chains..."

# Fund on Chain 1
print_status "Funding account on Chain 1..."
cast send $CROSSCHAIN1_ADDRESS --value 2ether --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://127.0.0.1:8545

# Fund on Chain 2  
print_status "Funding account on Chain 2..."
cast send $CROSSCHAIN2_ADDRESS --value 2ether --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://127.0.0.1:8546

# Wait for transactions
sleep 3

print_success "Both chains funded successfully!"

# Step 9: Display comprehensive setup summary (simplified ending)
print_success "🎯 DUAL-CHAIN SETUP COMPLETE!"
echo ""
print_status "=== CHAIN 1 (31337) ==="
echo "RPC URL: http://127.0.0.1:8545"
echo "Verifier: $VERIFIER1_ADDRESS"
echo "CrossChainRPS: $CROSSCHAIN1_ADDRESS"
echo "PID: $ANVIL1_PID"
echo ""
print_status "=== CHAIN 2 (31338) ==="
echo "RPC URL: http://127.0.0.1:8546"
echo "Verifier: $VERIFIER2_ADDRESS"
echo "CrossChainRPS: $CROSSCHAIN2_ADDRESS"
echo "PID: $ANVIL2_PID"
echo ""
print_status "=== LOGS ==="
echo "Chain 1 logs: tail -f anvil_chain1.log"
echo "Chain 2 logs: tail -f anvil_chain2.log"
echo ""
print_status "=== NEXT STEPS ==="
echo "1. cd ../backend && npm run dev"
echo "2. Test cross-chain EventListener with dual chains"
echo "3. Create games on one chain, commit moves on another"
echo ""
print_success "🎮 Both Anvil chains are running and ready for cross-chain testing!"
print_warning "To stop both chains: kill $ANVIL1_PID $ANVIL2_PID"

# Script exits here, Anvil processes continue in background