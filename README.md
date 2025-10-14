# Cross-Chain Messaging

This project implements a cross-chain messaging system with a focus on Web3 technologies. It includes Solidity contracts, a backend relayer service, and an optional frontend dashboard.

## Project Structure

```
cross-chain-messaging/
├── contracts/            # Solidity contracts (chainA, chainB)
│   ├── script/           # Deployment scripts
│   ├── src/              # Contract source files
│   └── test/             # Contract tests
├── backend/              # Relayer service (Node.js/TypeScript)
├── frontend/             # Optional dashboard (Next.js/TypeScript)
├── .editorconfig         # Editor configuration for consistent formatting
├── .eslintignore         # Ignore patterns for ESLint
├── .eslintrc.js          # ESLint configuration
├── .gitignore            # Ignore patterns for Git
├── .nvmrc                # Node.js version (22.14.0)
├── .prettierrc           # Prettier configuration
├── package.json          # Project dependencies and scripts
└── README.md             # Project documentation
```

## Linting and Formatting

The project uses the following tools to ensure consistent code quality:

### ESLint
- Configured in `.eslintrc.js`.
- Supports linting for TypeScript, React, and Node.js.
- Includes specific overrides for `frontend` and `backend` directories.

### Prettier
- Configured in `.prettierrc`.
- Ensures consistent code formatting across the project.

### EditorConfig
- Configured in `.editorconfig`.
- Maintains consistent indentation and formatting across different editors.

### Solhint
- Configured in `contracts/.solhint.json`.
- Lints Solidity contracts for best practices and potential issues.

## TypeScript Configuration

Each part of the project has its own `tsconfig.json`:
- **Frontend**: Configured for Next.js with support for `next.config.ts` and module aliasing.
- **Backend**: Configured for Node.js/Express with strict typing and output to `dist`.

## Scripts

The following scripts are available in `package.json`:

- **Linting**:
  - `npm run lint`: Lint all JavaScript, TypeScript, and Solidity files.
  - `npm run lint:fix`: Fix linting issues automatically.
  - `npm run lint:sol`: Lint Solidity files using Solhint.

- **Formatting**:
  - `npm run format`: Format all files using Prettier.
  - `npm run format:check`: Check if files are formatted correctly.

## Node.js Version

The project uses Node.js version `22.14.0`, specified in `.nvmrc`.

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Set Node.js Version**:
   Use `nvm` to set the correct Node.js version:
   ```bash
   nvm use
   ```

3. **Lint and Format Code**:
   - Lint all files:
     ```bash
     npm run lint
     ```
   - Format all files:
     ```bash
     npm run format
     ```

4. **Lint Solidity Contracts**:
   ```bash
   npm run lint:sol
   ```

## License

This project is licensed under the MIT License.
