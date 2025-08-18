/**
 * Converts an IPFS hash string to three addresses (matching the contract logic)
 * @param ipfsHash The IPFS hash as a string (without "Qm" prefix, 46 chars)
 * @returns Object with three addresses: addr1, addr2, addr3
 */
export function ipfsHashToAddresses(ipfsHash: string): {
  addr1: string;
  addr2: string;
  addr3: string;
} {
  // Remove 'Qm' prefix if present
  const cleanHash = ipfsHash.startsWith('Qm') ? ipfsHash.slice(2) : ipfsHash;
  
  if (cleanHash.length < 46) {
    throw new Error('IPFS hash too short (need exactly 46 chars after Qm prefix)');
  }

  const hashBytes = new TextEncoder().encode(cleanHash);

  // Store first 20 bytes in addr1
  let addr1Value = BigInt(0);
  for (let i = 0; i < 20; i++) {
    addr1Value |= BigInt(hashBytes[19 - i]) << BigInt(i * 8);
  }
  
  // Store next 20 bytes (20-39) in addr2
  let addr2Value = BigInt(0);
  for (let i = 0; i < 20; i++) {
    addr2Value |= BigInt(hashBytes[39 - i]) << BigInt(i * 8);
  }
  
  // Store remaining 6 bytes (40-45) in addr3, padded with zeros
  let addr3Value = BigInt(0);
  for (let i = 0; i < 6; i++) {
    addr3Value |= BigInt(hashBytes[45 - i]) << BigInt(i * 8);
  }

  return {
    addr1: `0x${addr1Value.toString(16).padStart(40, '0')}`,
    addr2: `0x${addr2Value.toString(16).padStart(40, '0')}`,
    addr3: `0x${addr3Value.toString(16).padStart(40, '0')}`
  };
}

/**
 * Converts three addresses back to IPFS hash (reverse of ipfsHashToAddresses)
 * @param addr1 First address containing first 20 bytes
 * @param addr2 Second address containing bytes 20-39
 * @param addr3 Third address containing bytes 40-45
 * @returns Reconstructed IPFS hash string (46 bytes total, without Qm prefix)
 */
export function addressesToIPFSHash(addr1: string, addr2: string, addr3: string): string {
  const result = new Uint8Array(46);

  const addr1Value = BigInt(addr1);
  const addr2Value = BigInt(addr2);
  const addr3Value = BigInt(addr3);

  // Extract first 20 bytes from addr1 (reverse the packing process)
  for (let i = 0; i < 20; i++) {
    result[19 - i] = Number((addr1Value >> BigInt(i * 8)) & BigInt(0xFF));
  }

  // Extract next 20 bytes from addr2 (bytes 20-39)
  for (let i = 0; i < 20; i++) {
    result[39 - i] = Number((addr2Value >> BigInt(i * 8)) & BigInt(0xFF));
  }

  // Extract final 6 bytes from addr3 (bytes 40-45)
  for (let i = 0; i < 6; i++) {
    result[45 - i] = Number((addr3Value >> BigInt(i * 8)) & BigInt(0xFF));
  }

  return new TextDecoder().decode(result);
}

/**
 * Adds 'Qm' prefix to create a complete IPFS hash
 * @param hashWithoutPrefix The 46-character hash string without Qm prefix
 * @returns Complete IPFS hash with Qm prefix
 */
export function addQmPrefix(hashWithoutPrefix: string): string {
  return `Qm${hashWithoutPrefix}`;
}

/**
 * Removes 'Qm' prefix from an IPFS hash
 * @param fullHash Complete IPFS hash with Qm prefix
 * @returns Hash string without Qm prefix
 */
export function removeQmPrefix(fullHash: string): string {
  return fullHash.startsWith('Qm') ? fullHash.slice(2) : fullHash;
}

/**
 * Validates if a string is a valid IPFS hash
 * @param hash The hash string to validate
 * @returns True if valid IPFS hash format
 */
export function isValidIPFSHash(hash: string): boolean {
  // Check if it starts with Qm and has correct total length (48 chars)
  if (hash.startsWith('Qm') && hash.length === 48) {
    // Check if remaining 46 chars are valid base58
    const base58Chars = /^[1-9A-HJ-NP-Za-km-z]+$/;
    return base58Chars.test(hash.slice(2));
  }
  // Also check for hash without Qm prefix (46 chars)
  if (hash.length === 46) {
    const base58Chars = /^[1-9A-HJ-NP-Za-km-z]+$/;
    return base58Chars.test(hash);
  }
  return false;
}