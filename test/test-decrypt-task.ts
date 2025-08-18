import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { expect } from "chai";

describe("DecryptEaddress Task Test", function () {
  it("should decrypt eaddress using userDecryptEaddress", async function () {
    // Check if we're in mock environment
    if (!fhevm.isMock) {
      console.warn("This test only runs in mock environment");
      this.skip();
    }

    console.log("Testing userDecryptEaddress functionality...");

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
    expect(decryptedAddr1.toLowerCase()).to.equal(addr1.toLowerCase());
    expect(decryptedAddr2.toLowerCase()).to.equal(addr2.toLowerCase());
    expect(decryptedAddr3.toLowerCase()).to.equal(addr3.toLowerCase());
    
    console.log("✅ All addresses match! Decryption working correctly.");
    
    // Verify by reconstructing the hash
    const reconstructed = await contract.addressesToIPFSHash(decryptedAddr1, decryptedAddr2, decryptedAddr3);
    console.log("\nHash reconstruction:");
    console.log("Original hash:     ", testHash);
    console.log("Reconstructed hash:", reconstructed);
    
    expect(reconstructed).to.equal(testHash);
    console.log("✅ Hash reconstruction successful!");
  });
});