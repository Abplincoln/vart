# Vart

Customizable on-chain identity platform on BOT Chain.

## Overview

Vart provides customizable on-chain identity infrastructure built on BOT Chain Bohr Testnet.

- **Target Network:** BOT Chain Bohr Testnet
- **Chain ID:** `968`
- **RPC URL:** `https://rpc.bohr.life`
- **Block Explorer:** `https://scan.bohr.life`
- **Native Currency:** BOT (tBOT)
- **Official Faucet:** `https://faucet.botchain.ai/basic`
- **Deployed Contract (`VartProfile`):** [`0x545B697201cB19DdFF7d68FBd60158dc454aaef7`](https://scan.bohr.life/address/0x545B697201cB19DdFF7d68FBd60158dc454aaef7)

---

## Smart Contract

### Compilation & Tests

```bash
# Compile contracts
npm run compile

# Run Hardhat test suite (25 automated unit tests)
npm test

# Clean artifacts
npm run clean
```

### Deployment to BOT Chain Bohr Testnet

1. Ensure your deployer private key is configured in the root `.env`:
   ```env
   BOT_CHAIN_RPC_URL=https://rpc.bohr.life
   BOT_CHAIN_CHAIN_ID=968
   PRIVATE_KEY=your_testnet_private_key_here
   ```
2. Fund your deployer address with testnet BOT from the official faucet:
   - **Faucet URL:** [https://faucet.botchain.ai/basic](https://faucet.botchain.ai/basic)
3. Deploy the smart contract:
   ```bash
   npm run deploy:testnet
   ```
   *(The deployment script includes safety checks enforcing target network `botChainTestnet`, Chain ID `968`, and sufficient gas balance before submitting).*

---

## Frontend (Vite + React)

A lightweight React frontend located in `frontend/`.

### Configuration

Copy the example frontend environment file:

```bash
cp frontend/.env.example frontend/.env
```

Set the deployed `VartProfile` contract address:

```env
VITE_VART_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

*(If the contract address has not been configured yet, the frontend displays an interactive setup banner and allows live address input for instant previewing without crashing).*

### Frontend Commands

From the workspace root:

```bash
# Start local development server
npm run frontend:dev

# Build frontend for production
npm run frontend:build

# Preview production build locally
npm run frontend:preview
```

Alternatively, from the `frontend/` directory:

```bash
cd frontend
npm run dev
npm run build
npm run preview
```
