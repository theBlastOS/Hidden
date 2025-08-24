# Complete Setup Guide for IPFS Encrypted Storage

This guide walks you through the complete setup process for the IPFS Encrypted Storage project, including both the smart contracts and frontend application.

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** >= 18
- **npm** >= 7.0.0
- **MetaMask** or another Ethereum wallet
- **Sepolia testnet ETH** for gas fees

## Project Structure

```
Hidden/
├── contracts/              # Smart contracts
├── deploy/                 # Deployment scripts
├── test/                   # Contract tests
├── tasks/                  # Hardhat tasks
├── app/                    # Frontend React application
├── hardhat.config.ts       # Hardhat configuration
└── package.json           # Root package.json
```

## Part 1: Smart Contract Setup

### 1. Install Contract Dependencies

From the project root:

```bash
npm install
```

### 2. Compile Contracts

```bash
npm run compile
```

### 3. Deploy to Sepolia Testnet

First, set up your environment variables:

```bash
# Create .env file in project root
echo "PRIVATE_KEY=your_private_key_here" > .env
echo "INFURA_API_KEY=your_infura_api_key_here" >> .env
```

Deploy the contract:

```bash
npx hardhat deploy --network sepolia
```

The deployment will output the contract address. **Save this address** - you'll need it for the frontend.

### 4. Verify Contract (Optional)

```bash
npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS
```

## Part 2: Frontend Setup

### 1. Navigate to Frontend Directory

```bash
cd app
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Configure Contract Address

Update `src/contracts/IPFSEncryptedStorage.ts` with your deployed contract address:

```typescript
export const CONTRACT_ADDRESSES = {
  IPFSEncryptedStorage: 'YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE', // Replace this
} as const;
```

### 4. Configure WalletConnect (Optional but Recommended)

1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create a new project
3. Copy your Project ID
4. Update `src/config/wagmi.ts`:

```typescript
export const config = getDefaultConfig({
  appName: 'IPFS Encrypted Storage',
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID', // Replace this
  chains: [sepolia],
  ssr: false,
});
```

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Part 3: Using the Application

### 1. Connect Your Wallet

1. Open the application in your browser
2. Click "Connect Wallet" in the top right
3. Select your preferred wallet (MetaMask recommended)
4. Switch to Sepolia testnet if prompted

### 2. Get Sepolia ETH

If you don't have Sepolia ETH:
- Use a Sepolia faucet: [https://sepoliafaucet.com/](https://sepoliafaucet.com/)
- Request from [Alchemy Sepolia Faucet](https://www.alchemy.com/faucets/ethereum-sepolia)

### 3. Store an IPFS Hash

1. In the "Store New IPFS Hash" section, enter a valid IPFS hash
   - Example: `QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG`
2. Click "Store IPFS Hash"
3. Approve the transaction in your wallet
4. Wait for confirmation

### 4. Retrieve Your IPFS Hash

1. In the "Your Storage Entries" section, find your stored entry
2. Click "Retrieve IPFS Hash"
3. Sign the decryption request in your wallet
4. The original IPFS hash will be displayed

### 5. Grant Access to Other Users

1. Find your storage entry (you must be the owner)
2. Click "Grant Access"
3. Enter the Ethereum address of the user you want to authorize
4. Click "Confirm Grant"
5. Approve the transaction

## Troubleshooting

### Common Issues

#### 1. "FHE not initialized" Error
- Ensure the Zama Relayer SDK is loaded (check browser console)
- Try refreshing the page

#### 2. Transaction Fails
- Check you have sufficient Sepolia ETH
- Ensure you're connected to the correct network (Sepolia)
- Try increasing gas limit

#### 3. Contract Not Found
- Verify the contract address in `src/contracts/IPFSEncryptedStorage.ts`
- Ensure the contract is deployed to Sepolia

#### 4. Wallet Connection Issues
- Try refreshing and reconnecting
- Clear browser cache
- Try a different wallet

#### 5. Build Errors
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Ensure Node.js version >= 18

### Network Configuration

The application is configured for Sepolia testnet by default. To use a different network:

1. Update `src/config/wagmi.ts` to include your desired chain
2. Update the Zama configuration in `src/utils/fheUtils.ts`
3. Deploy contracts to the new network
4. Update contract addresses

## Security Considerations

⚠️ **Important Security Notes:**

- This is a testnet application - not suitable for mainnet without security audit
- Never share your private keys
- Always verify contract addresses before interacting
- Use test funds only on testnets

## Advanced Usage

### Running Tests

From project root:
```bash
npm run test
```

### Building for Production

From `app/` directory:
```bash
npm run build
```

### Custom FHEVM Network

To connect to a custom FHEVM network, update the configuration in `src/utils/fheUtils.ts`:

```typescript
export const CUSTOM_CONFIG = {
  aclContractAddress: "0x...",
  kmsContractAddress: "0x...",
  // ... other configuration
};
```

## Getting Help

If you encounter issues:

1. Check the browser console for error messages
2. Verify all configuration steps were followed
3. Ensure you're using the correct network and contract addresses
4. Check that you have sufficient funds for transactions

## Technology Stack Summary

- **Smart Contracts:** Solidity + Hardhat + Zama FHEVM
- **Frontend:** React + TypeScript + Vite
- **Web3 Integration:** wagmi + viem + RainbowKit
- **Encryption:** Zama Relayer SDK
- **Network:** Ethereum Sepolia Testnet

## Next Steps

After successful setup, you can:

1. Experiment with different IPFS hashes
2. Grant and revoke access between multiple accounts
3. Monitor transactions on [Sepolia Etherscan](https://sepolia.etherscan.io/)
4. Explore the contract functions using Hardhat tasks

Happy building with confidential IPFS storage! 🚀