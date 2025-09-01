export interface EncryptedIPFSData {
  storageId: number;
  owner: string;
  hasAccess: boolean;
  ipfsHash?: string; // Decrypted IPFS hash if available
}

export interface IPFSAddresses {
  addr1: string;
  addr2: string;
  addr3: string;
}

export interface StorageEntry {
  id: number;
  owner: string;
  ipfsHash?: string;
  isOwner: boolean;
  hasAccess: boolean;
  createdAt?: Date;
}

export interface FheInstance {
  createEncryptedInput: (contractAddress: string, userAddress: string) => any;
  generateKeypair: () => { publicKey: string; privateKey: string };
  userDecrypt: (
    handleContractPairs: Array<{ handle: string; contractAddress: string }>,
    privateKey: string,
    publicKey: string,
    signature: string,
    contractAddresses: string[],
    userAddress: string,
    timestamp: string,
    duration: string
  ) => Promise<Record<string, any>>;
  createEIP712: (
    publicKey: string,
    contractAddresses: string[],
    timestamp: string,
    duration: string
  ) => {
    domain: any;
    types: any;
    message: any;
  };
}

export interface EncryptedInputBuffer {
  addAddress: (address: string) => void;
  encrypt: () => Promise<{
    handles: string[];
    inputProof: string;
  }>;
}