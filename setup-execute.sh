#!/bin/bash

# 🗡️ Cross-Chain EventListener Battle Setup Script
# This script orchestrates the complete testing environment

set -e  # Exit on any error

KEEP_ANVIL_RUNNING=false
#KEEP_ANVIL_RUNNING=true

# Parse arguments
while getopts "k" opt; do
    case $opt in
        k)
            KEEP_ANVIL_RUNNING=true
            ;;
        *)
            echo "Usage: $0 [-k]"
            echo "  -k  Keep Anvil running after the script completes"
            exit 1
            ;;
    esac
done

echo "🗡️ ==============================================="
echo "   Cross-Chain EventListener Battle Setup"
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

# Function to cleanup background processes
cleanup() {
    if [ "$KEEP_ANVIL_RUNNING" = true ]; then
        print_warning "Anvil will continue running in the background."
    else
        print_warning "Cleaning up processes..."
        if [ ! -z "$ANVIL_PID" ]; then
            kill $ANVIL_PID 2>/dev/null || true
            print_success "Anvil stopped"
        fi
    fi
}

# Set trap for cleanup on exit
trap cleanup EXIT

# Step 1: Check prerequisites
check_prerequisites

# Step 2: Compile contracts
print_status "Compiling contracts with Foundry..."
cd contracts
forge build
if [ $? -eq 0 ]; then
    print_success "Contracts compiled successfully!"
else
    print_error "Contract compilation failed!"
    exit 1
fi
cd ..

# Step 3: Start Anvil in background
print_status "Starting Anvil blockchain..."
anvil --host 0.0.0.0 --port 8545 > anvil.log 2>&1 &
ANVIL_PID=$!

# Wait for Anvil to start
print_status "Waiting for Anvil to start..."
sleep 3

# Check if Anvil is running
if ! curl -s -X POST -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
    http://127.0.0.1:8545 > /dev/null; then
    print_error "Anvil failed to start!"
    exit 1
fi

print_success "Anvil is running! (PID: $ANVIL_PID)"
print_status "Anvil logs: tail -f anvil.log"

# Step 4: Install backend dependencies
print_status "Installing backend dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
fi

# Step 5: Deploy contracts using Foundry (not the TypeScript script)
print_status "Deploying contracts with Foundry..."
cd ../contracts

# Deploy Verifier first
print_status "Deploying Verifier contract..."
VERIFIER_OUTPUT=$(forge create --broadcast --rpc-url http://127.0.0.1:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 src/Verifier.sol:Verifier)

# Extract address from output (more robust than JSON parsing)
VERIFIER_ADDRESS=$(echo "$VERIFIER_OUTPUT" | grep "Deployed to:" | awk '{print $3}')

if [ ! -z "$VERIFIER_ADDRESS" ] && [[ $VERIFIER_ADDRESS =~ ^0x[a-fA-F0-9]{40}$ ]]; then
    print_success "Verifier deployed at: $VERIFIER_ADDRESS"
else
    print_error "Failed to deploy Verifier contract!"
    print_error "Output: $VERIFIER_OUTPUT"
    exit 1
fi

# Deploy CrossChainRPS
print_status "Deploying CrossChainRPS contract..."
print_status "Using Verifier address: $VERIFIER_ADDRESS"
CROSSCHAIN_OUTPUT=$(forge create --broadcast --rpc-url http://127.0.0.1:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80  src/CrossChainRPS.sol:CrossChainRPS --constructor-args $VERIFIER_ADDRESS)

# Extract address from output
CROSSCHAIN_ADDRESS=$(echo "$CROSSCHAIN_OUTPUT" | grep "Deployed to:" | awk '{print $3}')

if [ ! -z "$CROSSCHAIN_ADDRESS" ] && [[ $CROSSCHAIN_ADDRESS =~ ^0x[a-fA-F0-9]{40}$ ]]; then
    print_success "CrossChainRPS deployed at: $CROSSCHAIN_ADDRESS"
else
    print_error "Failed to deploy CrossChainRPS contract!"
    print_error "Output: $CROSSCHAIN_OUTPUT"
    exit 1
fi

# Step 6: Update .env file
print_status "Updating backend .env file..."
cd ../backend

# Create or update .env file
cat > .env << EOF
# Test Environment Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Anvil Configuration
ANVIL_RPC_URL=http://127.0.0.1:8545
ANVIL_CONTRACT_ADDRESS=$CROSSCHAIN_ADDRESS
ANVIL_VERIFIER_ADDRESS=$VERIFIER_ADDRESS

# For testing - these can be dummy values for other chains
RELAYER_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
ETH_SEPOLIA_RPC=https://test.com
POLYGON_MUMBAI_RPC=https://test.com
EOF

print_success ".env file updated with contract addresses!"

# Source the .env file to make the variables available
print_status "Sourcing the .env file..."
source .env

# Verify that the variables are loaded
print_status "Loaded environment variables:"
echo "ANVIL_RPC_URL=$ANVIL_RPC_URL"
echo "ANVIL_CONTRACT_ADDRESS=$ANVIL_CONTRACT_ADDRESS"
echo "ANVIL_VERIFIER_ADDRESS=$ANVIL_VERIFIER_ADDRESS"

# Step 7: Generate test transactions to create events
print_status "Generating test game moves..."
cd ../contracts

# Check if PRIVATE_KEY is set
if [ -z "$RELAYER_PRIVATE_KEY" ]; then
    print_error "PRIVATE_KEY is not set. Please set it in your environment or .env file."
    exit 1
fi

print_status "Using private key: ${RELAYER_PRIVATE_KEY:0:6}...${RELAYER_PRIVATE_KEY: -4}"

# Fund the deployer account in the contract
print_status "Funding deployer account in the contract..."
cast send $CROSSCHAIN_ADDRESS --value 1ether --private-key $RELAYER_PRIVATE_KEY --rpc-url $ANVIL_RPC_URL

# Create a game
print_status "Creating a test game..."
GAME_TX=$(cast send $CROSSCHAIN_ADDRESS \
    "createGame(bytes32,uint256)" "0x67616d6531323300000000000000000000000000000000000000000000000000" "500000000000000000" \
    --private-key $RELAYER_PRIVATE_KEY \
    --rpc-url $ANVIL_RPC_URL \
    --gas-limit 500000)

if [ $? -eq 0 ]; then
    print_success "Test game created! TX: ${GAME_TX:0:10}..."
else
    print_error "Failed to create test game!"
    exit 1
fi

# Wait for transaction
sleep 2

print_success "🎯 Setup Complete! Contracts deployed and test game created."


# Step 8: Start EventListener integration test
print_status "Starting EventListener integration test..."
cd ../backend
# Run the integration test
npm run test:integration

if [ "$KEEP_ANVIL_RUNNING" = true ]; then
    print_status "Anvil is still running. You can now execute tests in your backend."
    print_status "To stop Anvil, use the following command:"
    print_status "kill $ANVIL_PID"
else
    print_status "$KEEP_ANVIL_RUNNING"
    print_status "Anvil will be stopped automatically."
fi