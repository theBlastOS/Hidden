const { ethers, fhevm } = require("hardhat");
const { FhevmType } = require("@fhevm/hardhat-plugin");

async function testDecryption() {
  console.log("Testing userDecryptEaddress functionality...");
  
  // Initialize FHEVM
  if (!fhevm.isMock) {
    console.log("Initializing FHEVM...");
    await fhevm.initializeCLIApi();
  }
  
  // Deploy contract
  const IPFSEncryptedStorageFactory = await ethers.getContractFactory("IPFSEncryptedStorage");
  const contract = await IPFSEncryptedStorageFactory.deploy();
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  
  const signers = await ethers.getSigners();
  
  console.log("Contract deployed at:", contractAddress);
  
  // Use a proper 46-character IPFS hash
  const testHash = "YwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdGabc";
  console.log("Using IPFS hash:", testHash);
  
  // Convert to addresses
  const [addr1, addr2, addr3] = await contract.ipfsHashToAddresses(testHash);
  console.log("Converted addresses:", addr1, addr2, addr3);
  
  // Create encrypted input
  const input = fhevm.createEncryptedInput(contractAddress, signers[0].address);
  input.addAddress(addr1);
  input.addAddress(addr2);  
  input.addAddress(addr3);
  const encryptedInput = await input.encrypt();
  
  // Store encrypted data
  const tx = await contract.storeEncryptedIPFSData(
    encryptedInput.handles[0],
    encryptedInput.handles[1],
    encryptedInput.handles[2],
    encryptedInput.inputProof
  );
  await tx.wait();
  console.log("Data stored successfully");
  
  // Get encrypted addresses
  const [encAddr1, encAddr2, encAddr3] = await contract.getEncryptedAddresses(1);
  console.log("Encrypted address handles:", encAddr1, encAddr2, encAddr3);
  
  // Try to decrypt addresses
  try {
    console.log("Attempting decryption...");
    
    const decryptedAddr1 = await fhevm.userDecryptEaddress(
      FhevmType.eaddress,
      encAddr1,
      contractAddress,
      signers[0]
    );
    
    const decryptedAddr2 = await fhevm.userDecryptEaddress(
      FhevmType.eaddress, 
      encAddr2,
      contractAddress,
      signers[0]
    );
    
    const decryptedAddr3 = await fhevm.userDecryptEaddress(
      FhevmType.eaddress,
      encAddr3, 
      contractAddress,
      signers[0]
    );
    
    console.log("Decrypted addresses:");
    console.log("Address 1:", decryptedAddr1);
    console.log("Address 2:", decryptedAddr2); 
    console.log("Address 3:", decryptedAddr3);
    
    // Verify by reconstructing the hash
    const reconstructed = await contract.addressesToIPFSHash(decryptedAddr1, decryptedAddr2, decryptedAddr3);
    console.log("Reconstructed hash:", reconstructed);
    console.log("Original hash:     ", testHash);
    console.log("Match:", reconstructed === testHash);
    
  } catch (error) {
    console.error("Decryption failed:", error.message);
  }
}

module.exports = { testDecryption };

if (require.main === module) {
  testDecryption()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}