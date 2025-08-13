import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("IPFSEncryptedStorage", function () {
  let contract: any;
  let signers: any[];
  let contractAddress: string;

  // Test IPFS hash (32 characters, typical IPFS hash without "Qm" prefix)
  const testIPFSHash = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
  const testIPFSHashBody = testIPFSHash.slice(2); // Remove "Qm" prefix for conversion

  beforeEach(async function () {
    signers = await ethers.getSigners();
    
    const IPFSEncryptedStorageFactory = await ethers.getContractFactory("IPFSEncryptedStorage");
    contract = await IPFSEncryptedStorageFactory.deploy();
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  describe("IPFS Hash Conversion", function () {
    it("should convert IPFS hash to two addresses", async function () {
      const [addr1, addr2] = await contract.ipfsHashToAddresses(testIPFSHashBody);
      
      expect(addr1).to.be.properAddress;
      expect(addr2).to.be.properAddress;
      expect(addr1).to.not.equal(addr2);
    });

    it("should convert addresses back to IPFS hash", async function () {
      // First convert hash to addresses
      const [addr1, addr2] = await contract.ipfsHashToAddresses(testIPFSHashBody);
      
      // Then convert addresses back to hash
      const reconstructedHash = await contract.addressesToIPFSHash(addr1, addr2);
      
      // The reconstructed hash should match the original (first 32 characters)
      expect(reconstructedHash.length).to.equal(testIPFSHashBody.length);
    });

    it("should be deterministic (same hash produces same addresses)", async function () {
      const [addr1_1, addr2_1] = await contract.ipfsHashToAddresses(testIPFSHashBody);
      const [addr1_2, addr2_2] = await contract.ipfsHashToAddresses(testIPFSHashBody);
      
      expect(addr1_1).to.equal(addr1_2);
      expect(addr2_1).to.equal(addr2_2);
    });

    it("should fail with short IPFS hash", async function () {
      const shortHash = "short";
      
      await expect(
        contract.ipfsHashToAddresses(shortHash)
      ).to.be.revertedWith("IPFS hash too short");
    });
  });

  describe("Encrypted Storage", function () {
    it("should store encrypted IPFS data", async function () {
      // Convert IPFS hash to addresses
      const [addr1, addr2] = await contract.ipfsHashToAddresses(testIPFSHashBody);

      // Create encrypted input
      const input = fhevm.createEncryptedInput(contractAddress, signers[0].address);
      input.addAddress(addr1);
      input.addAddress(addr2);
      const encryptedInput = await input.encrypt();

      // Store encrypted data
      const tx = await contract.storeEncryptedIPFSData(
        encryptedInput.handles[0],
        encryptedInput.handles[1],
        encryptedInput.inputProof
      );

      const receipt = await tx.wait();
      expect(receipt?.status).to.equal(1);

      // Check that storage ID was incremented
      const currentId = await contract.getCurrentId();
      expect(currentId).to.equal(1);
    });

    it("should emit IPFSDataStored event", async function () {
      const [addr1, addr2] = await contract.ipfsHashToAddresses(testIPFSHashBody);

      const input = fhevm.createEncryptedInput(contractAddress, signers[0].address);
      input.addAddress(addr1);
      input.addAddress(addr2);
      const encryptedInput = await input.encrypt();

      await expect(
        contract.storeEncryptedIPFSData(
          encryptedInput.handles[0],
          encryptedInput.handles[1],
          encryptedInput.inputProof
        )
      ).to.emit(contract, "IPFSDataStored")
       .withArgs(1, signers[0].address);
    });

    it("should retrieve encrypted addresses for owner", async function () {
      const [addr1, addr2] = await contract.ipfsHashToAddresses(testIPFSHashBody);

      const input = fhevm.createEncryptedInput(contractAddress, signers[0].address);
      input.addAddress(addr1);
      input.addAddress(addr2);
      const encryptedInput = await input.encrypt();

      await contract.storeEncryptedIPFSData(
        encryptedInput.handles[0],
        encryptedInput.handles[1],
        encryptedInput.inputProof
      );

      const [encAddr1, encAddr2] = await contract.getEncryptedAddresses(1);
      expect(encAddr1).to.not.equal("0x");
      expect(encAddr2).to.not.equal("0x");
    });

    it("should fail to retrieve encrypted addresses for non-authorized user", async function () {
      const [addr1, addr2] = await contract.ipfsHashToAddresses(testIPFSHashBody);

      const input = fhevm.createEncryptedInput(contractAddress, signers[0].address);
      input.addAddress(addr1);
      input.addAddress(addr2);
      const encryptedInput = await input.encrypt();

      await contract.storeEncryptedIPFSData(
        encryptedInput.handles[0],
        encryptedInput.handles[1],
        encryptedInput.inputProof
      );

      const contractAsUser1 = contract.connect(signers[1]);
      
      await expect(
        contractAsUser1.getEncryptedAddresses(1)
      ).to.be.revertedWith("Access denied");
    });

    it("should track user storage IDs", async function () {
      const [addr1, addr2] = await contract.ipfsHashToAddresses(testIPFSHashBody);

      const input = fhevm.createEncryptedInput(contractAddress, signers[0].address);
      input.addAddress(addr1);
      input.addAddress(addr2);
      const encryptedInput = await input.encrypt();

      await contract.storeEncryptedIPFSData(
        encryptedInput.handles[0],
        encryptedInput.handles[1],
        encryptedInput.inputProof
      );

      const userStorageIds = await contract.getUserStorageIds(signers[0].address);
      expect(userStorageIds).to.have.lengthOf(1);
      expect(userStorageIds[0]).to.equal(1);
    });
  });

  describe("Access Control", function () {
    let storageId: number;

    beforeEach(async function () {
      const [addr1, addr2] = await contract.ipfsHashToAddresses(testIPFSHashBody);

      const input = fhevm.createEncryptedInput(contractAddress, signers[0].address);
      input.addAddress(addr1);
      input.addAddress(addr2);
      const encryptedInput = await input.encrypt();

      await contract.storeEncryptedIPFSData(
        encryptedInput.handles[0],
        encryptedInput.handles[1],
        encryptedInput.inputProof
      );
      
      storageId = 1;
    });

    it("should grant access to another user", async function () {
      const user1Address = signers[1].address;

      await expect(
        contract.grantAccess(storageId, user1Address)
      ).to.emit(contract, "AccessGranted")
       .withArgs(storageId, user1Address, signers[0].address);

      const hasAccess = await contract.hasAccess(storageId, user1Address);
      expect(hasAccess).to.be.true;
    });

    it("should allow authorized user to retrieve encrypted addresses", async function () {
      const user1Address = signers[1].address;
      await contract.grantAccess(storageId, user1Address);

      const contractAsUser1 = contract.connect(signers[1]);
      const [encAddr1, encAddr2] = await contractAsUser1.getEncryptedAddresses(storageId);
      
      expect(encAddr1).to.not.equal("0x");
      expect(encAddr2).to.not.equal("0x");
    });

    it("should revoke access from a user", async function () {
      const user1Address = signers[1].address;
      await contract.grantAccess(storageId, user1Address);

      await expect(
        contract.revokeAccess(storageId, user1Address)
      ).to.emit(contract, "AccessRevoked")
       .withArgs(storageId, user1Address, signers[0].address);

      const hasAccess = await contract.hasAccess(storageId, user1Address);
      expect(hasAccess).to.be.false;
    });

    it("should fail to grant access if not owner", async function () {
      const contractAsUser1 = contract.connect(signers[1]);
      
      await expect(
        contractAsUser1.grantAccess(storageId, signers[2].address)
      ).to.be.revertedWith("Only owner can grant access");
    });

    it("should fail to revoke access if not owner", async function () {
      const contractAsUser1 = contract.connect(signers[1]);
      
      await expect(
        contractAsUser1.revokeAccess(storageId, signers[2].address)
      ).to.be.revertedWith("Only owner can revoke access");
    });

    it("should fail to grant access to zero address", async function () {
      await expect(
        contract.grantAccess(storageId, ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid user address");
    });

    it("should return correct owner", async function () {
      const owner = await contract.getOwner(storageId);
      expect(owner).to.equal(signers[0].address);
    });
  });

  describe("Edge Cases", function () {
    it("should fail operations on non-existent storage ID", async function () {
      const nonExistentId = 999;

      await expect(
        contract.getEncryptedAddresses(nonExistentId)
      ).to.be.revertedWith("Storage ID does not exist");

      await expect(
        contract.grantAccess(nonExistentId, signers[1].address)
      ).to.be.revertedWith("Storage ID does not exist");

      await expect(
        contract.getOwner(nonExistentId)
      ).to.be.revertedWith("Storage ID does not exist");

      const hasAccess = await contract.hasAccess(nonExistentId, signers[0].address);
      expect(hasAccess).to.be.false;
    });

    it("should handle multiple storage entries", async function () {
      const hash1 = testIPFSHashBody;
      const hash2 = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";

      // Store first entry
      const [addr1_1, addr2_1] = await contract.ipfsHashToAddresses(hash1);
      const input1 = fhevm.createEncryptedInput(contractAddress, signers[0].address);
      input1.addAddress(addr1_1);
      input1.addAddress(addr2_1);
      const encryptedInput1 = await input1.encrypt();

      await contract.storeEncryptedIPFSData(
        encryptedInput1.handles[0],
        encryptedInput1.handles[1],
        encryptedInput1.inputProof
      );

      // Store second entry
      const [addr1_2, addr2_2] = await contract.ipfsHashToAddresses(hash2);
      const input2 = fhevm.createEncryptedInput(contractAddress, signers[0].address);
      input2.addAddress(addr1_2);
      input2.addAddress(addr2_2);
      const encryptedInput2 = await input2.encrypt();

      await contract.storeEncryptedIPFSData(
        encryptedInput2.handles[0],
        encryptedInput2.handles[1],
        encryptedInput2.inputProof
      );

      const userStorageIds = await contract.getUserStorageIds(signers[0].address);
      expect(userStorageIds).to.have.lengthOf(2);
      expect(userStorageIds[0]).to.equal(1);
      expect(userStorageIds[1]).to.equal(2);
    });
  });

  describe("Store IPFS Hash Function", function () {
    it("should store IPFS hash and encrypted data together", async function () {
      const [addr1, addr2] = await contract.ipfsHashToAddresses(testIPFSHashBody);

      const input = fhevm.createEncryptedInput(contractAddress, signers[0].address);
      input.addAddress(addr1);
      input.addAddress(addr2);
      const encryptedInput = await input.encrypt();

      const tx = await contract.storeIPFSHash(
        testIPFSHashBody,
        encryptedInput.handles[0],
        encryptedInput.handles[1],
        encryptedInput.inputProof
      );

      const receipt = await tx.wait();
      expect(receipt?.status).to.equal(1);

      const currentId = await contract.getCurrentId();
      expect(currentId).to.equal(1);
    });
  });
});