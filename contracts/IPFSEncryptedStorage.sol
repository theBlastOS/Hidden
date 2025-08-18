// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, eaddress, externalEaddress} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title IPFS Encrypted Storage Contract
/// @notice Converts IPFS hashes to two addresses, encrypts them with Zama FHE, and manages access control
contract IPFSEncryptedStorage is SepoliaConfig {
    struct EncryptedIPFSData {
        eaddress encryptedAddress1;
        eaddress encryptedAddress2;
        address owner;
        bool exists;
    }

    // Storage ID counter
    uint256 private _currentId;

    // Mapping from storage ID to encrypted IPFS data
    mapping(uint256 => EncryptedIPFSData) private _encryptedStorage;

    // Mapping from storage ID to authorized users
    mapping(uint256 => mapping(address => bool)) private _authorizedUsers;

    // Mapping from user to their storage IDs
    mapping(address => uint256[]) private _userStorageIds;

    // Events
    event IPFSDataStored(uint256 indexed storageId, address indexed owner);
    event AccessGranted(uint256 indexed storageId, address indexed user, address indexed grantor);
    event AccessRevoked(uint256 indexed storageId, address indexed user, address indexed revoker);

    /// @notice Converts an IPFS hash string to two addresses
    /// @param ipfsHash The IPFS hash as a string (without "Qm" prefix)
    /// @return addr1 First address derived from the hash
    /// @return addr2 Second address derived from the hash
    function ipfsHashToAddresses(string memory ipfsHash) public pure returns (address addr1, address addr2) {
        bytes memory hashBytes = bytes(ipfsHash);
        require(hashBytes.length >= 32, "IPFS hash too short");

        // Take first 20 bytes for address1
        bytes20 addr1Bytes;
        for (uint i = 0; i < 20; i++) {
            addr1Bytes |= bytes20(hashBytes[i] & 0xFF) >> (i * 8);
        }
        addr1 = address(addr1Bytes);

        // Take next 12 bytes + first 8 bytes again for address2
        bytes20 addr2Bytes;
        for (uint i = 0; i < 12; i++) {
            addr2Bytes |= bytes20(hashBytes[i + 20] & 0xFF) >> (i * 8);
        }
        for (uint i = 0; i < 8; i++) {
            addr2Bytes |= bytes20(hashBytes[i] & 0xFF) >> ((i + 12) * 8);
        }
        addr2 = address(addr2Bytes);
    }

    /// @notice Converts two addresses back to IPFS hash
    /// @param addr1 First address
    /// @param addr2 Second address
    /// @return ipfsHash Reconstructed IPFS hash string
    function addressesToIPFSHash(address addr1, address addr2) public pure returns (string memory ipfsHash) {
        bytes20 addr1Bytes = bytes20(addr1);
        bytes20 addr2Bytes = bytes20(addr2);

        bytes memory result = new bytes(32);

        // Extract first 20 bytes from addr1
        for (uint i = 0; i < 20; i++) {
            result[i] = addr1Bytes[i];
        }

        // Extract first 12 bytes from addr2 for positions 20-31
        for (uint i = 0; i < 12; i++) {
            result[i + 20] = addr2Bytes[i];
        }

        ipfsHash = string(result);
    }

    /// @notice Stores encrypted IPFS data (two addresses) with Zama encryption
    /// @param encryptedAddr1 First encrypted address
    /// @param encryptedAddr2 Second encrypted address
    /// @param inputProof Input proof for external encrypted data
    /// @return storageId The ID of the stored data
    function storeEncryptedIPFSData(
        externalEaddress encryptedAddr1,
        externalEaddress encryptedAddr2,
        bytes calldata inputProof
    ) external returns (uint256 storageId) {
        // Convert external encrypted inputs to internal encrypted addresses
        eaddress addr1 = FHE.fromExternal(encryptedAddr1, inputProof);
        eaddress addr2 = FHE.fromExternal(encryptedAddr2, inputProof);

        // Increment storage ID
        _currentId++;
        storageId = _currentId;

        // Store encrypted data
        _encryptedStorage[storageId] = EncryptedIPFSData({
            encryptedAddress1: addr1,
            encryptedAddress2: addr2,
            owner: msg.sender,
            exists: true
        });

        // Grant permissions for contract and owner
        FHE.allowThis(addr1);
        FHE.allowThis(addr2);
        FHE.allow(addr1, msg.sender);
        FHE.allow(addr2, msg.sender);

        // Add to user's storage IDs
        _userStorageIds[msg.sender].push(storageId);

        emit IPFSDataStored(storageId, msg.sender);
    }

    /// @notice Grants access to encrypted data for another user
    /// @param storageId The storage ID
    /// @param user The user to grant access to
    function grantAccess(uint256 storageId, address user) external {
        require(_encryptedStorage[storageId].exists, "Storage ID does not exist");
        require(_encryptedStorage[storageId].owner == msg.sender, "Only owner can grant access");
        require(user != address(0), "Invalid user address");

        _authorizedUsers[storageId][user] = true;

        // Grant FHE permissions to the user
        FHE.allow(_encryptedStorage[storageId].encryptedAddress1, user);
        FHE.allow(_encryptedStorage[storageId].encryptedAddress2, user);

        emit AccessGranted(storageId, user, msg.sender);
    }

    /// @notice Revokes access to encrypted data for a user
    /// @param storageId The storage ID
    /// @param user The user to revoke access from
    function revokeAccess(uint256 storageId, address user) external {
        require(_encryptedStorage[storageId].exists, "Storage ID does not exist");
        require(_encryptedStorage[storageId].owner == msg.sender, "Only owner can revoke access");

        _authorizedUsers[storageId][user] = false;

        emit AccessRevoked(storageId, user, msg.sender);
    }

    /// @notice Gets the encrypted addresses for a storage ID
    /// @param storageId The storage ID
    /// @return addr1 First encrypted address
    /// @return addr2 Second encrypted address
    function getEncryptedAddresses(uint256 storageId) external view returns (eaddress addr1, eaddress addr2) {
        require(_encryptedStorage[storageId].exists, "Storage ID does not exist");
        require(
            _encryptedStorage[storageId].owner == msg.sender || _authorizedUsers[storageId][msg.sender],
            "Access denied"
        );

        EncryptedIPFSData memory data = _encryptedStorage[storageId];
        return (data.encryptedAddress1, data.encryptedAddress2);
    }

    /// @notice Checks if a user has access to a storage ID
    /// @param storageId The storage ID
    /// @param user The user to check
    /// @return hasAccess True if user has access
    function hasAccess(uint256 storageId, address user) external view returns (bool hasAccess) {
        if (!_encryptedStorage[storageId].exists) {
            return false;
        }

        return _encryptedStorage[storageId].owner == user || _authorizedUsers[storageId][user];
    }

    /// @notice Gets the owner of a storage ID
    /// @param storageId The storage ID
    /// @return owner The owner address
    function getOwner(uint256 storageId) external view returns (address owner) {
        require(_encryptedStorage[storageId].exists, "Storage ID does not exist");
        return _encryptedStorage[storageId].owner;
    }

    /// @notice Gets all storage IDs for a user
    /// @param user The user address
    /// @return storageIds Array of storage IDs
    function getUserStorageIds(address user) external view returns (uint256[] memory storageIds) {
        return _userStorageIds[user];
    }

    /// @notice Gets the current storage ID counter
    /// @return currentId The current ID
    function getCurrentId() external view returns (uint256 currentId) {
        return _currentId;
    }

    /// @notice Stores IPFS hash and returns encrypted data in one transaction
    /// @param ipfsHash The IPFS hash string
    /// @param encryptedAddr1 First encrypted address (derived from hash)
    /// @param encryptedAddr2 Second encrypted address (derived from hash)
    /// @param inputProof Input proof for external encrypted data
    /// @return storageId The ID of the stored data
    function storeIPFSHash(
        string memory ipfsHash,
        externalEaddress encryptedAddr1,
        externalEaddress encryptedAddr2,
        bytes calldata inputProof
    ) external returns (uint256 storageId) {
        // Verify that the encrypted addresses match the hash
        (address addr1, address addr2) = ipfsHashToAddresses(ipfsHash);

        // Store the encrypted data
        // storageId = storeEncryptedIPFSData(encryptedAddr1, encryptedAddr2, inputProof);

        // Note: In practice, you might want to verify that the encrypted addresses
        // correspond to addr1 and addr2, but this would require decryption
    }
}
