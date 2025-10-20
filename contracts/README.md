## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:

- **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
- **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
- **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
- **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Documentation

https://book.getfoundry.sh/

## Usage

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
```

### Format

```shell
$ forge fmt
```

### Gas Snapshots

```shell
$ forge snapshot
```

### Anvil

```shell
$ anvil
```

### Deploy

```shell
$ forge script script/Counter.s.sol:CounterScript --rpc-url <your_rpc_url> --private-key <your_private_key>
```

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```

# Cross-Chain Messaging Contracts

This folder contains the Solidity contracts for the cross-chain messaging system, including `Verifier` and `CrossChainRPS`.

## Prerequisites

- **Foundry**: Ensure Foundry is installed and up-to-date. Install it using:
  ```bash
  curl -L https://foundry.paradigm.xyz | bash
  foundryup
  ```
- **Anvil**: Use Anvil as a local Ethereum testnet for testing and deployment.

## Deployment Procedure

1. **Set up environment variables**:
   - Create a `.env` file:
     ```bash
     touch .env
     ```
   - Add your RPC URL and private key:
     ```bash
     echo "RPC_URL=<your_rpc_url>" >> .env
     echo "PRIVATE_KEY=<your_private_key>" >> .env
     ```
   - Load the environment variables:
     ```bash
     source .env
     ```

2. **Compile the contracts**:
   ```bash
   forge build
   ```

3. **Deploy the `Verifier` contract**:
   ```bash
   forge create --broadcast --rpc-url $RPC_URL --private-key $PRIVATE_KEY ./src/Verifier.sol:Verifier
   ```
   - Note the deployed contract address from the output.

4. **Deploy the `CrossChainRPS` contract**:
   - Replace `<VERIFIER_ADDRESS>` with the address of the deployed `Verifier` contract:
     ```bash
     forge create --broadcast --rpc-url $RPC_URL --private-key $PRIVATE_KEY ./src/CrossChainRPS.sol:CrossChainRPS --constructor-args <VERIFIER_ADDRESS>
     ```


## License

This project is licensed under the MIT License.
