import { createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk/bundle';
import { initSDK } from '@zama-fhe/relayer-sdk/bundle';

let fheInstance: any | null = null;
let isInitialized = false;
const initCallbacks: (() => void)[] = [];

/**
 * Initialize the FHE instance
 */
export async function initFHE(): Promise<any> {
  if (fheInstance && isInitialized) {
    return fheInstance;
  }

  try {
    // Check if the global fhevm object is available (from CDN)

    // const { initSDK, createInstance } = (window as any).fhevm;

    // Initialize WASM
    await initSDK();

    // Create instance with Sepolia config
    const config = {
      ...SepoliaConfig,
      network: window.ethereum, // Use injected provider
    };

    fheInstance = await createInstance(config);
    isInitialized = true;

    // Notify all callbacks that FHE is now initialized
    initCallbacks.forEach(callback => callback());

    return fheInstance;
  } catch (error) {
    console.error('Failed to initialize FHE:', error);
    throw error;
  }
}

/**
 * Create encrypted input for addresses
 * @param contractAddress The contract address
 * @param userAddress The user address
 * @param addresses Array of 3 addresses to encrypt
 * @returns Encrypted input with handles and proof
 */
export async function encryptAddresses(
  contractAddress: string,
  userAddress: string,
  addresses: [string, string, string]
): Promise<any> {
  if (!fheInstance) {
    throw new Error('FHE not initialized. Call initFHE() first.');
  }

  const buffer = fheInstance.createEncryptedInput(contractAddress, userAddress);

  // Add the three addresses to the buffer
  buffer.addAddress(addresses[0]);
  buffer.addAddress(addresses[1]);
  buffer.addAddress(addresses[2]);

  // Encrypt and return
  const result = await buffer.encrypt();
  console.log("encryptAddresses");
  console.log(result);
  // `0x${Array.from(handle).map(b => b.toString(16).padStart(2, '0')).join('')}`;
  return result;
}

/**
 * Decrypt encrypted addresses back to IPFS hash
 * @param ciphertextHandles Array of 3 encrypted address handles
 * @param contractAddress The contract address
 * @param userAddress The user address
 * @param signer The wallet signer
 * @returns Promise resolving to decrypted addresses
 */
export async function decryptAddresses(
  ciphertextHandles: [string, string, string],
  contractAddress: string,
  userAddress: string,
  signer: any
): Promise<[string, string, string]> {
  if (!fheInstance) {
    throw new Error('FHE not initialized. Call initFHE() first.');
  }

  try {
    // Generate keypair for this decryption
    const keypair = fheInstance.generateKeypair();

    // Prepare handle-contract pairs
    const handleContractPairs = ciphertextHandles.map(handle => ({
      handle,
      contractAddress,
    }));

    // Set up EIP712 for signing
    const startTimeStamp = Math.floor(Date.now() / 1000).toString();
    const durationDays = "10";
    const contractAddresses = [contractAddress];

    const eip712 = fheInstance.createEIP712(
      keypair.publicKey,
      contractAddresses,
      startTimeStamp,
      durationDays
    );

    // Sign the decryption request
    const signature = await signer.signTypedData({
      domain: eip712.domain,
      types: {
        UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
      },
      primaryType: 'UserDecryptRequestVerification',
      message: eip712.message,
    });

    // Perform user decryption
    const result = await fheInstance.userDecrypt(
      handleContractPairs,
      keypair.privateKey,
      keypair.publicKey,
      signature.replace("0x", ""),
      contractAddresses,
      userAddress,
      startTimeStamp,
      durationDays
    );

    // Extract decrypted values
    const addr1 = result[ciphertextHandles[0]];
    const addr2 = result[ciphertextHandles[1]];
    const addr3 = result[ciphertextHandles[2]];

    return [addr1, addr2, addr3];
  } catch (error) {
    console.error('Failed to decrypt addresses:', error);
    throw error;
  }
}

/**
 * Get the initialized FHE instance
 * @returns The FHE instance or null if not initialized
 */
export function getFHEInstance(): any {
  return fheInstance;
}

/**
 * Check if FHE is initialized
 * @returns True if initialized
 */
export function isFHEInitialized(): boolean {
  return isInitialized && fheInstance !== null;
}

/**
 * Subscribe to FHE initialization events
 * @param callback Function to call when FHE is initialized
 * @returns Unsubscribe function
 */
export function onFHEInitialized(callback: () => void): () => void {
  if (isInitialized) {
    // If already initialized, call immediately
    setTimeout(callback, 0);
  } else {
    // Otherwise add to callbacks
    initCallbacks.push(callback);
  }

  // Return unsubscribe function
  return () => {
    const index = initCallbacks.indexOf(callback);
    if (index > -1) {
      initCallbacks.splice(index, 1);
    }
  };
}