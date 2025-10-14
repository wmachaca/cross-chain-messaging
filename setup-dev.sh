#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Starting development environment setup..."

# 1. Install Foundry globally and update to the latest version
echo "🔧 Installing Foundry..."
if ! command -v foundryup &> /dev/null; then
  curl -L https://foundry.paradigm.xyz | bash
  source ~/.bashrc
fi
foundryup

# 2. Setup Foundry in the contracts directory
echo "📦 Setting up Foundry in the contracts directory..."
cd contracts
forge init . --force

echo "🔗 Installing dependencies for contracts (e.g., OpenZeppelin)..."
forge install
git submodule update --init --recursive

# 3. Setup backend
echo "🛠 Setting up the backend..."
cd ../backend
npm install

# 4. Setup frontend
echo "🌐 Setting up the frontend..."
cd ../frontend
npm install

# 5. Install root dependencies
echo "🔗 Installing root dependencies..."
cd ..
npm install

# 6. Final message
echo "✅ Development environment setup complete!"
