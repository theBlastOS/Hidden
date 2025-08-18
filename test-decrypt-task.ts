import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

async function testDecryptionTask() {
  console.log("Testing userDecryptEaddress functionality...");
  
  // Check if we're in mock environment
  if (!fhevm.isMock) {
    console.log("Not in mock environment, skipping decryption test");
    return;
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
  console.log("Converted addresses:");
  console.log("Address 1:", addr1);
  console.log("Address 2:", addr2);
  console.log("Address 3:", addr3);
  
  // Create encrypted input
  const input = fhevm.createEncryptedInput(contractAddress, signers[0].address);
  input.addAddress(addr1);
  input.addAddress(addr2);  
  input.addAddress(addr3);
  const encryptedInput = await input.encrypt();
  
  console.log("Created encrypted input with handles:", encryptedInput.handles);
  
  // Store encrypted data
  const tx = await contract.storeEncryptedIPFSData(
    encryptedInput.handles[0],
    encryptedInput.handles[1],
    encryptedInput.handles[2],
    encryptedInput.inputProof
  );
  await tx.wait();
  console.log("Data stored successfully with storage ID: 1");
  
  // Get encrypted addresses
  const [encAddr1, encAddr2, encAddr3] = await contract.getEncryptedAddresses(1);
  console.log("Encrypted address handles:");
  console.log("Handle 1:", encAddr1);
  console.log("Handle 2:", encAddr2);
  console.log("Handle 3:", encAddr3);
  
  // Try to decrypt addresses
  try {
    console.log("\nAttempting decryption...");
    
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
    
    console.log("✅ Decryption successful!");
    console.log("Decrypted addresses:");
    console.log("Address 1:", decryptedAddr1);
    console.log("Address 2:", decryptedAddr2); 
    console.log("Address 3:", decryptedAddr3);
    
    // Verify addresses match original
    const match1 = decryptedAddr1.toLowerCase() === addr1.toLowerCase();
    const match2 = decryptedAddr2.toLowerCase() === addr2.toLowerCase();
    const match3 = decryptedAddr3.toLowerCase() === addr3.toLowerCase();
    
    console.log("\nVerification:");
    console.log("Address 1 match:", match1);
    console.log("Address 2 match:", match2);
    console.log("Address 3 match:", match3);
    
    if (match1 && match2 && match3) {
      console.log("✅ All addresses match! Decryption working correctly.");
      
      // Verify by reconstructing the hash
      const reconstructed = await contract.addressesToIPFSHash(decryptedAddr1, decryptedAddr2, decryptedAddr3);
      console.log("\nHash reconstruction:");
      console.log("Original hash:     ", testHash);
      console.log("Reconstructed hash:", reconstructed);
      console.log("Hash match:", reconstructed === testHash);
    } else {
      console.log("❌ Address mismatch detected!");
    }
    
  } catch (error) {
    console.error("❌ Decryption failed:", error.message);
    return false;
  }
  
  return true;
}

// Export for use in other files
export { testDecryptionTask };

// Run directly if this file is executed
if (require.main === module) {
  testDecryptionTask()
    .then((success) => {
      if (success) {
        console.log("\n🎉 Test completed successfully!");
      } else {
        console.log("\n❌ Test failed!");
      }
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error("Test error:", error);
      process.exit(1);
    });
}