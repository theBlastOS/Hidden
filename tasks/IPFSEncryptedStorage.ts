import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";
import { FhevmType } from "@fhevm/hardhat-plugin";

task("task:hash-to-addresses")
  .addParam("hash", "The IPFS hash to convert to addresses")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;
    const IPFSEncryptedStorage = await deployments.get("IPFSEncryptedStorage");
    const contract = await ethers.getContractAt("IPFSEncryptedStorage", IPFSEncryptedStorage.address);

    console.log(`Converting IPFS hash: ${taskArguments.hash}`);

    try {
      const [addr1, addr2, addr3] = await contract.ipfsHashToAddresses(taskArguments.hash);
      console.log(`Address 1: ${addr1}`);
      console.log(`Address 2: ${addr2}`);
      console.log(`Address 3: ${addr3}`);
    } catch (error) {
      console.error("Error converting hash to addresses:", error);
    }
  });

task("task:addresses-to-hash")
  .addParam("addr1", "First address")
  .addParam("addr2", "Second address")
  .addParam("addr3", "Third address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;
    const IPFSEncryptedStorage = await deployments.get("IPFSEncryptedStorage");
    const contract = await ethers.getContractAt("IPFSEncryptedStorage", IPFSEncryptedStorage.address);

    console.log(`Converting addresses to IPFS hash:`);
    console.log(`Address 1: ${taskArguments.addr1}`);
    console.log(`Address 2: ${taskArguments.addr2}`);
    console.log(`Address 3: ${taskArguments.addr3}`);

    try {
      const ipfsHash = await contract.addressesToIPFSHash(taskArguments.addr1, taskArguments.addr2, taskArguments.addr3);
      console.log(`IPFS Hash: ${ipfsHash}`);
    } catch (error) {
      console.error("Error converting addresses to hash:", error);
    }
  });

task("task:store-hash")
  .addParam("hash", "The IPFS hash to store")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();
    const IPFSEncryptedStorage = await deployments.get("IPFSEncryptedStorage");
    const contract = await ethers.getContractAt("IPFSEncryptedStorage", IPFSEncryptedStorage.address);
    const signers = await ethers.getSigners();

    console.log(`Storing encrypted IPFS hash: ${taskArguments.hash}`);

    try {
      // Convert hash to addresses
      const [addr1, addr2, addr3] = await contract.ipfsHashToAddresses(taskArguments.hash);
      console.log(`Converted to addresses: ${addr1}, ${addr2}, ${addr3}`);

      // Create encrypted input
      const input = fhevm.createEncryptedInput(IPFSEncryptedStorage.address, signers[0].address);
      input.addAddress(addr1);
      input.addAddress(addr2);
      input.addAddress(addr3);
      const encryptedInput = await input.encrypt();

      // Store encrypted data
      const tx = await contract.storeEncryptedIPFSData(
        encryptedInput.handles[0], // First encrypted address
        encryptedInput.handles[1], // Second encrypted address
        encryptedInput.handles[2], // Third encrypted address
        encryptedInput.inputProof
      );

      const receipt = await tx.wait();
      console.log(`Transaction hash: ${receipt?.hash}`);

      // Get the storage ID from events
      const event = receipt?.logs.find(log => {
        try {
          const parsedLog = contract.interface.parseLog({
            topics: log.topics,
            data: log.data
          });
          return parsedLog?.name === "IPFSDataStored";
        } catch {
          return false;
        }
      });

      if (event) {
        const parsedLog = contract.interface.parseLog({
          topics: event.topics,
          data: event.data
        });
        console.log(`Storage ID: ${parsedLog?.args[0]}`);
      }

    } catch (error) {
      console.error("Error storing encrypted data:", error);
    }
  });

task("task:grant-access")
  .addParam("id", "The storage ID")
  .addParam("user", "The user address to grant access to")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;
    const IPFSEncryptedStorage = await deployments.get("IPFSEncryptedStorage");
    const contract = await ethers.getContractAt("IPFSEncryptedStorage", IPFSEncryptedStorage.address);

    console.log(`Granting access to storage ID ${taskArguments.id} for user ${taskArguments.user}`);

    try {
      const tx = await contract.grantAccess(taskArguments.id, taskArguments.user);
      const receipt = await tx.wait();
      console.log(`Transaction hash: ${receipt?.hash}`);
    } catch (error) {
      console.error("Error granting access:", error);
    }
  });

task("task:get-encrypted-addresses")
  .addParam("id", "The storage ID")
  .addOptionalParam("decrypt", "Whether to decrypt the addresses (true/false)", "false")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;
    const IPFSEncryptedStorage = await deployments.get("IPFSEncryptedStorage");
    const contract = await ethers.getContractAt("IPFSEncryptedStorage", IPFSEncryptedStorage.address);
    const signers = await ethers.getSigners();
    await fhevm.initializeCLIApi();
    console.log(`Getting encrypted addresses for storage ID: ${taskArguments.id}`);

    try {
      const [addr1, addr2, addr3] = await contract.getEncryptedAddresses(taskArguments.id);
      console.log(`Encrypted Address 1 Handle: ${addr1}`);
      console.log(`Encrypted Address 2 Handle: ${addr2}`);
      console.log(`Encrypted Address 3 Handle: ${addr3}`);

      // If decrypt parameter is true, decrypt the addresses
      if (taskArguments.decrypt === "true") {
        console.log("\nDecrypting addresses...");

        await fhevm.initializeCLIApi();

        try {
          // Decrypt each encrypted address using userDecryptEaddress
          const decryptedAddr1 = await fhevm.userDecryptEaddress(
            addr1,
            IPFSEncryptedStorage.address,
            signers[0]
          );
          const decryptedAddr2 = await fhevm.userDecryptEaddress(
            addr2,
            IPFSEncryptedStorage.address,
            signers[0]
          );
          const decryptedAddr3 = await fhevm.userDecryptEaddress(
            addr3,
            IPFSEncryptedStorage.address,
            signers[0]
          );

          console.log(`Decrypted Address 1: ${decryptedAddr1}`);
          console.log(`Decrypted Address 2: ${decryptedAddr2}`);
          console.log(`Decrypted Address 3: ${decryptedAddr3}`);

          // Try to reconstruct the IPFS hash from decrypted addresses
          try {
            const ipfsHash = await contract.addressesToIPFSHash(decryptedAddr1, decryptedAddr2, decryptedAddr3);
            console.log(`\nReconstructed IPFS Hash: ${ipfsHash}`);
          } catch (hashError) {
            console.error("Error reconstructing IPFS hash:", hashError);
          }

        } catch (decryptError) {
          console.error("Error decrypting addresses:", decryptError);
        }
      }
    } catch (error) {
      console.error("Error getting encrypted addresses:", error);
    }
  });

task("task:get-user-storage-ids")
  .addOptionalParam("user", "The user address (defaults to first signer)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;
    const IPFSEncryptedStorage = await deployments.get("IPFSEncryptedStorage");
    const contract = await ethers.getContractAt("IPFSEncryptedStorage", IPFSEncryptedStorage.address);
    const signers = await ethers.getSigners();

    const userAddress = taskArguments.user || signers[0].address;
    console.log(`Getting storage IDs for user: ${userAddress}`);

    try {
      const storageIds = await contract.getUserStorageIds(userAddress);
      console.log(`Storage IDs: [${storageIds.join(", ")}]`);
    } catch (error) {
      console.error("Error getting user storage IDs:", error);
    }
  });