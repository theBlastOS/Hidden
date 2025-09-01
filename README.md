# IPFS Encrypted Storage Project

## 🎯 Project Overview

This is a decentralized IPFS hash encrypted storage solution based on Zama's Fully Homomorphic Encryption (FHE) technology. The project allows users to encrypt and store IPFS file hashes on the Ethereum blockchain while managing access permissions through smart contracts.

https://hidden-zama.netlify.app/

## 🚀 Core Features

### 1. IPFS Hash Conversion and Encryption
- **Hash Decomposition**: Converts 46-character IPFS hash strings into three Ethereum addresses
- **FHE Encryption**: Uses Zama's fully homomorphic encryption technology for on-chain address encryption
- **Secure Storage**: Encrypted data is securely stored in smart contracts

### 2. Access Control System
- **Ownership Management**: Contracts automatically record data owners
- **Permission Granting**: Owners can authorize other users to access encrypted data
- **Permission Revocation**: Supports dynamic revocation of user access permissions
- **ACL Control**: Access Control List based on Zama FHE

### 3. Data Retrieval and Decryption
- **Secure Decryption**: Authorized users can decrypt and retrieve original IPFS hashes
- **Hash Reconstruction**: Recombines three decrypted addresses into complete IPFS hashes
- **File Access**: Access original files on IPFS through reconstructed hashes

### 4. Web Interface Features
- **File Upload**: Direct file upload to IPFS with automatic hash generation
- **One-Click Storage**: Encrypt and store IPFS hashes to blockchain
- **Storage Management**: View, retrieve, and manage stored data
- **Permission Control**: Manage user access permissions through the interface

## 🛠 Technology Stack

### Smart Contract Technologies
- **Solidity**: `^0.8.24` - Smart contract development language
- **Hardhat**: `^2.26.0` - Ethereum development environment
- **FHEVM**: `@fhevm/solidity ^0.7.0` - Zama fully homomorphic encryption library
- **Zama Oracle**: `@zama-fhe/oracle-solidity ^0.1.0` - Oracle integration

### Frontend Technologies
- **React**: `^18.3.1` - User interface framework
- **TypeScript**: `^5.2.2` - Type-safe JavaScript
- **Vite**: `^5.3.4` - Modern build tool
- **RainbowKit**: `^2.1.0` - Web3 wallet connection
- **Wagmi**: `^2.12.0` - React Hooks for Ethereum
- **Viem**: `^2.21.0` - TypeScript Ethereum interface

### Encryption & Blockchain
- **Zama Relayer SDK**: `@zama-fhe/relayer-sdk ^0.1.2` - FHE client SDK
- **Buffer**: `^6.0.3` - Node.js Buffer API for browsers
- **Crypto Browserify**: `^3.12.0` - Browser cryptography library

### Development Tools
- **ESLint**: Code quality checking
- **Prettier**: Code formatting
- **TypeChain**: Smart contract type generation
- **Hardhat Deploy**: Deployment script management
- **Mocha & Chai**: Testing framework

## 📁 Project Structure

```
Hidden/
├── contracts/                    # Smart contracts
│   ├── IPFSEncryptedStorage.sol  # Main storage contract
│   └── FHECounter.sol           # Example counter contract
├── deploy/                      # Deployment scripts
│   └── deploy.ts               # Contract deployment configuration
├── tasks/                      # Hardhat tasks
│   ├── IPFSEncryptedStorage.ts # Contract interaction tasks
│   └── accounts.ts             # Account management tasks
├── test/                       # Test files
│   ├── IPFSEncryptedStorage.ts # Contract unit tests
│   └── FHECounter.ts           # Counter tests
├── app/                        # Frontend application
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── FileUpload.tsx  # File upload component
│   │   │   ├── StoreIPFS.tsx   # IPFS storage component
│   │   │   └── StorageList.tsx # Storage list component
│   │   ├── hooks/              # React Hooks
│   │   │   └── useIPFSStorage.ts # IPFS storage logic
│   │   ├── utils/              # Utility functions
│   │   │   ├── fheUtils.ts     # FHE utilities
│   │   │   └── ipfsUtils.ts    # IPFS utilities
│   │   ├── config/             # Configuration files
│   │   │   └── wagmi.ts        # Web3 configuration
│   │   └── contracts/          # Contract interfaces
│   │       └── IPFSEncryptedStorage.ts
│   ├── package.json            # Frontend dependencies
│   └── vite.config.ts         # Build configuration
├── docs/                       # Documentation
│   ├── zama_llm.md            # Zama FHE development guide
│   └── zama_doc_relayer.md    # Relayer SDK documentation
├── hardhat.config.ts          # Hardhat configuration
├── package.json               # Project dependencies
├── tsconfig.json              # TypeScript configuration
└── CLAUDE.md                  # Project instruction documentation
```

## 🔧 Environment Requirements

- **Node.js**: >= 20
- **npm**: >= 7.0.0
- **MetaMask** or other Web3 wallets
- **Git**: Version control

## 📦 Installation and Deployment

### 1. Clone the Project

```bash
git clone <repository-url>
cd Hidden
```

### 2. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd app
npm install
cd ..
```

### 3. Environment Configuration

Create a `.env` file:

```bash
# Deployment private key (for contract deployment)
PRIVATE_KEY=your_private_key_here

# Infura API Key (for Ethereum network connection)
INFURA_API_KEY=your_infura_api_key

# Etherscan API Key (for contract verification)
ETHERSCAN_API_KEY=your_etherscan_api_key

# Optional: Report gas usage
REPORT_GAS=true
```

### 4. Compile Contracts

```bash
# Compile smart contracts
npm run compile

# Generate TypeScript types
npm run typechain
```

### 5. Run Tests

```bash
# Local testing
npm run test

# Sepolia testnet testing
npm run test:sepolia
```

### 6. Deploy Contracts

#### Local Deployment

```bash
# Start local Hardhat network
npx hardhat node

# Deploy to local network
npx hardhat deploy --network localhost
```

#### Sepolia Testnet Deployment

```bash
# Deploy to Sepolia
npx hardhat deploy --network sepolia

# Verify contract (optional)
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

### 7. Start Frontend Application

```bash
cd app
npm run dev
```

Visit `http://localhost:5173` to view the application.

## 📖 Contract Usage Guide

### IPFSEncryptedStorage Contract

#### Main Functions

```solidity
// Convert IPFS hash to three addresses
function ipfsHashToAddresses(string memory ipfsHash) 
    public pure returns (address addr1, address addr2, address addr3)

// Convert three addresses back to IPFS hash
function addressesToIPFSHash(address addr1, address addr2, address addr3) 
    public pure returns (string memory ipfsHash)

// Store encrypted IPFS data
function storeEncryptedIPFSData(
    externalEaddress encryptedAddr1,
    externalEaddress encryptedAddr2, 
    externalEaddress encryptedAddr3,
    bytes calldata inputProof
) public returns (uint256 storageId)

// Grant user access
function grantAccess(uint256 storageId, address user) external

// Revoke user access
function revokeAccess(uint256 storageId, address user) external

// Get encrypted addresses
function getEncryptedAddresses(uint256 storageId) 
    external view returns (eaddress addr1, eaddress addr2, eaddress addr3)
```

#### Usage Examples

```javascript
// Store IPFS hash using Hardhat task
npx hardhat store-ipfs --hash "QmYourIPFSHashHere" --network sepolia

// Retrieve IPFS hash
npx hardhat retrieve-ipfs --storage-id 1 --network sepolia

// Grant access
npx hardhat grant-access --storage-id 1 --user 0x742d35Cc6634C0532925a3b8D4C7C2dE03f8b1Cc --network sepolia
```

## 🌐 Frontend Usage Guide

### Main Features

1. **Connect Wallet**
   - Click "Connect Wallet" button in the top right
   - Select MetaMask or other supported wallets
   - Ensure connection to Sepolia testnet

2. **Initialize FHE**
   - After wallet connection, click "Init FHE" button
   - Wait for FHE environment initialization

3. **Upload Files**
   - Select files in the "File Upload" section
   - System automatically uploads to IPFS and displays hash

4. **Store IPFS Hash**
   - Enter hash in the "Store IPFS Hash" section
   - Click "Store Hash" for encrypted storage

5. **Manage Storage**
   - View stored data list
   - Retrieve and decrypt IPFS hashes
   - Grant/revoke access permissions for other users

### Core Components

- **FileUpload**: File upload and IPFS hash generation
- **StoreIPFS**: IPFS hash encrypted storage
- **StorageList**: Storage data management and permission control

## 🔐 Encryption Process Details

### Storage Process

1. **Hash Decomposition**: 46-character IPFS hash → 3 Ethereum addresses
   - Address1: First 20 bytes
   - Address2: Middle 20 bytes (20-39)
   - Address3: Last 6 bytes (40-45) + padding

2. **Client Encryption**: Encrypt addresses using Zama Relayer SDK

3. **On-Chain Storage**: Submit encrypted data to smart contract

4. **Permission Setting**: Automatically set ACL permissions

### Retrieval Process

1. **Permission Verification**: Check user access permissions

2. **Data Retrieval**: Get encrypted address data from contract

3. **Client Decryption**: Decrypt data using user private key

4. **Hash Reconstruction**: Recombine three addresses into complete IPFS hash

## 🧪 Testing

### Contract Testing

```bash
# Run all tests
npm run test

# Run specific tests
npx hardhat test test/IPFSEncryptedStorage.ts

# Generate coverage report
npm run coverage
```

### Test Networks

The project supports the following networks:
- **Hardhat**: Local test network
- **Sepolia**: Ethereum test network

### Test Cases

- IPFS hash conversion functionality
- Encrypted storage and retrieval
- Access permission management
- Event emission verification
- Error handling tests

## 🔧 Configuration Guide

### Hardhat Configuration

```typescript
// hardhat.config.ts
import "@fhevm/hardhat-plugin";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [PRIVATE_KEY]
    }
  }
};
```

### Frontend Configuration

```typescript
// app/src/config/wagmi.ts
import { createConfig } from 'wagmi';
import { sepolia } from 'wagmi/chains';

export const config = createConfig({
  chains: [sepolia],
  // ... other configurations
});
```

## 📊 Gas Fee Optimization

### Contract Optimization
- Using Solidity 0.8.24
- Enable optimizer (runs: 800)
- Efficient storage layout
- Batch operation support

### Transaction Optimization
- Reasonable gas limit settings
- Transaction status tracking
- Failure retry mechanism

## 🛡 Security Considerations

### Smart Contract Security
- Access control modifiers
- Input validation and boundary checks
- Reentrancy attack protection
- Integer overflow protection

### FHE Security
- Key management best practices
- Strict ACL permission control
- Data encryption integrity verification

### Frontend Security
- XSS attack protection
- Wallet connection verification
- Sensitive data handling

## 🚀 Performance Optimization

### Contract Performance
- Efficient data structures
- Gas-optimized algorithms
- Batch operation support

### Frontend Performance
- React component optimization
- State management best practices
- Asynchronous data loading

## 📝 Development Guide

### Adding New Features

1. **Contract Development**
   - Add new contracts in `contracts/` directory
   - Update deployment scripts
   - Write test cases

2. **Frontend Development**
   - Add components in `app/src/components/`
   - Update hooks and utils
   - Integrate new contract functionality

### Code Standards

```bash
# Code linting
npm run lint

# Code formatting
npm run prettier:write

# TypeScript type checking
npm run build:ts
```

## 🤝 Contributing

1. Fork the project
2. Create a feature branch
3. Commit changes
4. Push to branch
5. Create a Pull Request

## 📄 License

This project is licensed under the BSD-3-Clause-Clear License. See the [LICENSE](LICENSE) file for details.

## 🆘 Support and Help

### Official Documentation
- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Zama Protocol Documentation](https://docs.zama.ai/protocol)
- [Hardhat Documentation](https://hardhat.org/docs)

### Community Support
- [GitHub Issues](https://github.com/zama-ai/fhevm/issues)
- [Zama Discord](https://discord.gg/zama)
- [FHEVM Community Forum](https://community.zama.ai)

### Contact Information
- Technical Issues: GitHub Issues
- Feature Requests: GitHub Discussions
- Security Issues: security@zama.ai

## 🎯 Roadmap

### Current Version (v0.0.1)
- ✅ Basic IPFS hash encrypted storage
- ✅ Access permission management
- ✅ Web interface integration
- ✅ Sepolia testnet deployment

### Planned Features
- 🔄 Batch operation support
- 🔄 Data backup and recovery
- 🔄 Advanced permission management
- 🔄 Multi-chain support
- 🔄 Mobile adaptation

## 🏆 Acknowledgments

This project is built on Zama's fully homomorphic encryption technology. Thanks to:

- **Zama Team** - For providing FHEVM technology support
- **Ethereum Community** - For providing infrastructure support
- **IPFS Team** - For providing decentralized storage solutions
- **Open Source Community** - For providing various tools and libraries

---

**🔐 Built with ❤️ using Zama FHE Technology**
