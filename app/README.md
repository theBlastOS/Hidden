# IPFS Encrypted Storage Frontend

A React frontend application for storing and managing IPFS hashes using Zama's Fully Homomorphic Encryption (FHE) technology.

## Features

- 🔒 **Fully Homomorphic Encryption** - IPFS hashes are encrypted using Zama FHE
- 🗝️ **Access Control** - Grant and revoke access to specific users  
- ⛓️ **On-Chain Storage** - Encrypted data stored on Ethereum Sepolia
- 🔄 **Easy Retrieval** - Decrypt and retrieve IPFS hashes when needed
- 🌈 **Wallet Integration** - Connect using Rainbow Kit with multiple wallet support

## Prerequisites

- Node.js >= 18
- An Ethereum wallet (MetaMask, WalletConnect compatible)
- Sepolia testnet ETH for gas fees

## Setup

1. Install dependencies:
```bash
npm install
```

2. Update the contract address in `src/contracts/IPFSEncryptedStorage.ts`:
```typescript
export const CONTRACT_ADDRESSES = {
  IPFSEncryptedStorage: 'YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE',
} as const;
```

3. Get a WalletConnect project ID from [https://cloud.walletconnect.com/](https://cloud.walletconnect.com/) and update `src/config/wagmi.ts`:
```typescript
export const config = getDefaultConfig({
  appName: 'IPFS Encrypted Storage',
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID',
  chains: [sepolia],
  ssr: false,
});
```

## Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Build for Production

```bash
npm run build
```

## How It Works

1. **Store IPFS Hash**: 
   - User inputs an IPFS hash (e.g., `QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG`)
   - The hash is converted to three Ethereum addresses
   - Addresses are encrypted using Zama FHE
   - Encrypted data is stored on-chain

2. **Retrieve IPFS Hash**:
   - User requests decryption of stored data
   - Encrypted addresses are retrieved from the contract
   - User signs a decryption request
   - Addresses are decrypted and converted back to IPFS hash

3. **Access Management**:
   - Owners can grant access to other users
   - Authorized users can decrypt and retrieve the IPFS hash
   - Access can be revoked by the owner

## Architecture

```
Frontend (React + Vite)
├── Wallet Integration (Rainbow Kit + wagmi)
├── FHE Encryption (Zama Relayer SDK)
└── Smart Contract Integration (viem)
```

## Key Files

- `src/App.tsx` - Main application component
- `src/hooks/useIPFSStorage.ts` - Contract interaction hooks
- `src/utils/fheUtils.ts` - FHE encryption/decryption utilities
- `src/utils/ipfsUtils.ts` - IPFS hash conversion utilities
- `src/components/` - UI components
- `src/contracts/` - Contract ABI and addresses

## Security Notes

- All IPFS hashes are encrypted before being stored on-chain
- Private keys never leave the user's browser
- Access control is enforced both on-chain and client-side
- Uses Sepolia testnet for development - not suitable for mainnet without security audit

## Troubleshooting

1. **FHE Initialization Fails**: Ensure the Zama Relayer SDK CDN script is loaded
2. **Transaction Fails**: Check you have sufficient Sepolia ETH for gas
3. **Decryption Fails**: Ensure you have access to the storage entry
4. **Wallet Connection Issues**: Try refreshing and reconnecting your wallet

## Technology Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **Rainbow Kit** - Wallet connection
- **wagmi** - Ethereum React hooks
- **viem** - Ethereum client library
- **Zama Relayer SDK** - FHE encryption/decryption
- **Tailwind CSS** - (Optional) Styling framework