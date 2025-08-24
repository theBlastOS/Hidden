// Contract ABI for IPFSEncryptedStorage
export const IPFS_ENCRYPTED_STORAGE_ABI = [
  {
    "type": "function",
    "name": "ipfsHashToAddresses",
    "inputs": [
      {
        "name": "ipfsHash",
        "type": "string",
        "internalType": "string"
      }
    ],
    "outputs": [
      {
        "name": "addr1",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "addr2",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "addr3",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "addressesToIPFSHash",
    "inputs": [
      {
        "name": "addr1",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "addr2",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "addr3",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "ipfsHash",
        "type": "string",
        "internalType": "string"
      }
    ],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "storeEncryptedIPFSData",
    "inputs": [
      {
        "name": "encryptedAddr1",
        "type": "bytes32",
        "internalType": "externalEaddress"
      },
      {
        "name": "encryptedAddr2",
        "type": "bytes32",
        "internalType": "externalEaddress"
      },
      {
        "name": "encryptedAddr3",
        "type": "bytes32",
        "internalType": "externalEaddress"
      },
      {
        "name": "inputProof",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [
      {
        "name": "storageId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "grantAccess",
    "inputs": [
      {
        "name": "storageId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "user",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "revokeAccess",
    "inputs": [
      {
        "name": "storageId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "user",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getEncryptedAddresses",
    "inputs": [
      {
        "name": "storageId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "addr1",
        "type": "bytes32",
        "internalType": "eaddress"
      },
      {
        "name": "addr2",
        "type": "bytes32",
        "internalType": "eaddress"
      },
      {
        "name": "addr3",
        "type": "bytes32",
        "internalType": "eaddress"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "hasAccess",
    "inputs": [
      {
        "name": "storageId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "user",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "hasAccess",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getOwner",
    "inputs": [
      {
        "name": "storageId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "owner",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getUserStorageIds",
    "inputs": [
      {
        "name": "user",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "storageIds",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getCurrentId",
    "inputs": [],
    "outputs": [
      {
        "name": "currentId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "IPFSDataStored",
    "inputs": [
      {
        "name": "storageId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "owner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "AccessGranted",
    "inputs": [
      {
        "name": "storageId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "user",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "grantor",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "AccessRevoked",
    "inputs": [
      {
        "name": "storageId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "user",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "revoker",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  }
] as const;

// Contract addresses (will be updated based on deployment)
export const CONTRACT_ADDRESSES = {
  // Localhost deployment address - update for different networks
  IPFSEncryptedStorage: '0x6b02918B26866e48Ae1869fFb63523A50fd1be62', // Localhost address
  // For Sepolia testnet, update this address after deployment
} as const;