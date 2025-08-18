import { useState, useEffect } from 'react';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { IPFS_ENCRYPTED_STORAGE_ABI, CONTRACT_ADDRESSES } from '@/contracts/IPFSEncryptedStorage';
import { encryptAddresses, decryptAddresses, initFHE } from '@/utils/fheUtils';
import { ipfsHashToAddresses, addressesToIPFSHash, removeQmPrefix, addQmPrefix } from '@/utils/ipfsUtils';
import { StorageEntry } from '@/types';

export function useIPFSStorage() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userStorageEntries, setUserStorageEntries] = useState<StorageEntry[]>([]);
  const [fheInitialized, setFheInitialized] = useState(false);

  // Initialize FHE on mount
  useEffect(() => {
    const initializeFHE = async () => {
      try {
        await initFHE();
        setFheInitialized(true);
      } catch (err) {
        setError('Failed to initialize FHE encryption');
        console.error('FHE initialization error:', err);
      }
    };

    initializeFHE();
  }, []);

  // Load user storage entries when address changes
  useEffect(() => {
    if (address && publicClient && fheInitialized) {
      loadUserStorageEntries();
    }
  }, [address, publicClient, fheInitialized]);

  const loadUserStorageEntries = async () => {
    if (!address || !publicClient) return;

    setIsLoading(true);
    try {
      // Get user storage IDs
      const storageIds = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.IPFSEncryptedStorage as `0x${string}`,
        abi: IPFS_ENCRYPTED_STORAGE_ABI,
        functionName: 'getUserStorageIds',
        args: [address],
      });

      const entries: StorageEntry[] = [];
      
      for (const id of storageIds as bigint[]) {
        try {
          // Get owner
          const owner = await publicClient.readContract({
            address: CONTRACT_ADDRESSES.IPFSEncryptedStorage as `0x${string}`,
            abi: IPFS_ENCRYPTED_STORAGE_ABI,
            functionName: 'getOwner',
            args: [id],
          });

          // Check access
          const hasAccess = await publicClient.readContract({
            address: CONTRACT_ADDRESSES.IPFSEncryptedStorage as `0x${string}`,
            abi: IPFS_ENCRYPTED_STORAGE_ABI,
            functionName: 'hasAccess',
            args: [id, address],
          });

          entries.push({
            id: Number(id),
            owner: owner as string,
            isOwner: (owner as string).toLowerCase() === address.toLowerCase(),
            hasAccess: hasAccess as boolean,
          });
        } catch (err) {
          console.error(`Failed to load entry ${id}:`, err);
        }
      }

      setUserStorageEntries(entries);
    } catch (err) {
      setError('Failed to load storage entries');
      console.error('Load entries error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const storeIPFSHash = async (ipfsHash: string) => {
    if (!address || !walletClient || !fheInitialized) {
      throw new Error('Wallet not connected or FHE not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Convert IPFS hash to addresses
      const cleanHash = removeQmPrefix(ipfsHash);
      const addresses = ipfsHashToAddresses(cleanHash);
      const addressArray: [string, string, string] = [addresses.addr1, addresses.addr2, addresses.addr3];

      // Encrypt the addresses
      const encryptedData = await encryptAddresses(
        CONTRACT_ADDRESSES.IPFSEncryptedStorage,
        address,
        addressArray
      );

      // Store on blockchain
      const { request } = await publicClient!.simulateContract({
        address: CONTRACT_ADDRESSES.IPFSEncryptedStorage as `0x${string}`,
        abi: IPFS_ENCRYPTED_STORAGE_ABI,
        functionName: 'storeEncryptedIPFSData',
        args: [
          encryptedData.handles[0] as `0x${string}`,
          encryptedData.handles[1] as `0x${string}`,
          encryptedData.handles[2] as `0x${string}`,
          encryptedData.inputProof as `0x${string}`,
        ],
        account: address,
      });

      const hash = await walletClient.writeContract(request);
      
      // Wait for transaction confirmation
      await publicClient!.waitForTransactionReceipt({ hash });

      // Reload storage entries
      await loadUserStorageEntries();

      return hash;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to store IPFS hash';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const retrieveIPFSHash = async (storageId: number): Promise<string> => {
    if (!address || !walletClient || !fheInitialized) {
      throw new Error('Wallet not connected or FHE not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get encrypted addresses from contract
      const encryptedAddresses = await publicClient!.readContract({
        address: CONTRACT_ADDRESSES.IPFSEncryptedStorage as `0x${string}`,
        abi: IPFS_ENCRYPTED_STORAGE_ABI,
        functionName: 'getEncryptedAddresses',
        args: [BigInt(storageId)],
      });

      const [handle1, handle2, handle3] = encryptedAddresses as [string, string, string];

      // Decrypt the addresses
      const decryptedAddresses = await decryptAddresses(
        [handle1, handle2, handle3],
        CONTRACT_ADDRESSES.IPFSEncryptedStorage,
        address,
        walletClient
      );

      // Convert back to IPFS hash
      const hashWithoutPrefix = addressesToIPFSHash(
        decryptedAddresses[0],
        decryptedAddresses[1],
        decryptedAddresses[2]
      );

      return addQmPrefix(hashWithoutPrefix);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to retrieve IPFS hash';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const grantAccess = async (storageId: number, userAddress: string) => {
    if (!address || !walletClient) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const { request } = await publicClient!.simulateContract({
        address: CONTRACT_ADDRESSES.IPFSEncryptedStorage as `0x${string}`,
        abi: IPFS_ENCRYPTED_STORAGE_ABI,
        functionName: 'grantAccess',
        args: [BigInt(storageId), userAddress as `0x${string}`],
        account: address,
      });

      const hash = await walletClient.writeContract(request);
      await publicClient!.waitForTransactionReceipt({ hash });

      return hash;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to grant access';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const revokeAccess = async (storageId: number, userAddress: string) => {
    if (!address || !walletClient) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const { request } = await publicClient!.simulateContract({
        address: CONTRACT_ADDRESSES.IPFSEncryptedStorage as `0x${string}`,
        abi: IPFS_ENCRYPTED_STORAGE_ABI,
        functionName: 'revokeAccess',
        args: [BigInt(storageId), userAddress as `0x${string}`],
        account: address,
      });

      const hash = await walletClient.writeContract(request);
      await publicClient!.waitForTransactionReceipt({ hash });

      return hash;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to revoke access';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    userStorageEntries,
    fheInitialized,
    storeIPFSHash,
    retrieveIPFSHash,
    grantAccess,
    revokeAccess,
    refreshEntries: loadUserStorageEntries,
  };
}