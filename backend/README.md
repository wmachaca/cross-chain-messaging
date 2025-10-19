# Cross-Chain Relayer Backend

**Enterprise-grade Express.js backend for cross-chain message relaying**

A TypeScript-based relayer service that facilitates secure cross-chain communication between multiple blockchain networks using Merkle proof verification.

## Architecture Overview

This backend implements a **simplified functional architecture** designed for incremental development:

```
backend/
├── src/
│   ├── index.ts              # 🔥 Main Express server with inline routes
│   ├── config/
│   │   ├── wagmi.ts          # Blockchain configuration
│   │   └── chains/
│   │       └── anvil.ts      # Local development chain
│   ├── models/
│   │   ├── GameMove.ts       # Cross-chain game move data structure
│   │   └── MerkleProof.ts    # Merkle proof data structure
│   ├── services/
│   │   ├── EventListener.ts  # Blockchain event monitoring (WIP)
│   │   └── MerkleService.ts  # Merkle tree generation (WIP)
│   └── routes/               # Modular routes
├── tests/
│   ├── setup.ts              # Jest test configuration
│   └── eventListener.test.ts # Event listener tests
├── scripts/
│   └── deployTestGame.ts     # Contract deployment utilities
├── .env                      # Environment configuration
├── jest.config.json          # Jest testing setup
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies and scripts
```

## 🚀 Current Development Phase

**Phase 1: Foundation ✅ COMPLETED**
- ✅ Express v4 server with middleware stack
- ✅ Request tracing with unique IDs
- ✅ Inline health check and status endpoints
- ✅ CORS, helmet, and morgan middleware
- ✅ Graceful shutdown handling
- ✅ Jest testing configuration
- ✅ TypeScript setup with proper types

**Phase 2: Core Services IN PROGRESS**
- MerkleService for proof generation
- EventListener for blockchain monitoring
- Cross-chain message processing


## 🔧 Technical Stack

### Core Technologies
- **Runtime**: Node.js 22.14.0
- **Framework**: Express.js v4.21.0 (stable)
- **Language**: TypeScript 5.9.3
- **Testing**: Jest with ts-jest

### Blockchain Integration
- **Web3 Library**: Viem v2.38.3
- **Chain Management**: Wagmi v2.18.1
- **Cryptography**: Merkletreejs v0.6.0
- **Ethereum Utils**: Ethers v6.15.0

### Development Tools
- **Process Manager**: ts-node for development
- **Environment**: dotenv for configuration
- **Security**: helmet for HTTP headers
- **Logging**: morgan for request logging
- **CORS**: cors for cross-origin requests

## 🚦 Getting Started

### Prerequisites
```bash
# Ensure Node.js version
node --version  # Should be 22.14.0

# Install dependencies
npm install
```

### Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Blockchain RPC URLs
ANVIL_RPC_URL=http://127.0.0.1:8545
ETH_SEPOLIA_RPC=https://sepolia.infura.io/v3/YOUR_KEY
POLYGON_MUMBAI_RPC=https://polygon-mumbai.infura.io/v3/YOUR_KEY

# Relayer configuration
RELAYER_PRIVATE_KEY=0x...
```

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

```

## 📡 API Endpoints

### Health Monitoring
```bash
# Basic health check
GET /health
# Response: { "status": "healthy", "uptime": 123.45, ... }

# Detailed service status  
GET /api/relayer/status
# Response: { "status": "operational", "mode": "testing", ... }

# Root endpoint with service info
GET /
# Response: { "service": "Cross-Chain Message Relayer", ... }
```

### Testing Endpoints
```bash
# Test health endpoint
curl http://localhost:5000/health

# Test relayer status
curl http://localhost:5000/api/relayer/status

# Test 404 handling
curl http://localhost:5000/nonexistent
```

## 🌐 Cross-Chain Architecture

### Supported Networks
```typescript
// Current configuration
chains: [
  anvil,           // Local development (ChainId: 31337)
  sepolia,         // Ethereum testnet (ChainId: 11155111)  
  polygonMumbai    // Polygon testnet (ChainId: 80001)
]
```

### Message Flow (Planned)
```
1. EventListener monitors blockchain events
2. MerkleService generates cryptographic proofs
3. ProofRelayer submits proofs to target chains
4. GameOrchestrator coordinates the entire flow
```
