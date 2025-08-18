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
        eaddress encryptedAddress3;
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

    /// @notice Converts an IPFS hash string to three addresses
    /// @param ipfsHash The IPFS hash as a string (without "Qm" prefix, 46 chars)
    /// @return addr1 First address containing first 20 bytes of hash
    /// @return addr2 Second address containing next 20 bytes (bytes 20-39)
    /// @return addr3 Third address containing remaining 6 bytes (bytes 40-45) + padding
    function ipfsHashToAddresses(
        string memory ipfsHash
    ) public pure returns (address addr1, address addr2, address addr3) {
        bytes memory hashBytes = bytes(ipfsHash);
        require(hashBytes.length >= 46, "IPFS hash too short (need exactly 46 chars)");

        // Store first 20 bytes in addr1
        uint160 addr1Value = 0;
        for (uint256 i = 0; i < 20; i++) {
            addr1Value = addr1Value | (uint160(uint8(hashBytes[19 - i])) << uint256(i * 8));
        }
        addr1 = address(addr1Value);

        // Store next 20 bytes (20-39) in addr2
        uint160 addr2Value = 0;
        for (uint256 i = 0; i < 20; i++) {
            addr2Value = addr2Value | (uint160(uint8(hashBytes[39 - i])) << uint256(i * 8));
        }
        addr2 = address(addr2Value);

        // Store remaining 6 bytes (40-45) in addr3, padded with zeros
        uint160 addr3Value = 0;
        for (uint256 i = 0; i < 6; i++) {
            addr3Value = addr3Value | (uint160(uint8(hashBytes[45 - i])) << uint256(i * 8));
        }
        addr3 = address(addr3Value);
    }

    /// @notice Converts three addresses back to IPFS hash (reverse of ipfsHashToAddresses)
    /// @param addr1 First address containing first 20 bytes
    /// @param addr2 Second address containing bytes 20-39
    /// @param addr3 Third address containing bytes 40-45
    /// @return ipfsHash Reconstructed IPFS hash string (46 bytes total)
    function addressesToIPFSHash(
        address addr1,
        address addr2,
        address addr3
    ) public pure returns (string memory ipfsHash) {
        bytes memory result = new bytes(46);

        uint160 addr1Value = uint160(addr1);
        uint160 addr2Value = uint160(addr2);
        uint160 addr3Value = uint160(addr3);

        // Extract first 20 bytes from addr1 (reverse the packing process)
        for (uint256 i = 0; i < 20; i++) {
            result[19 - i] = bytes1(uint8(addr1Value >> uint256(i * 8)));
        }

        // Extract next 20 bytes from addr2 (bytes 20-39)
        for (uint256 i = 0; i < 20; i++) {
            result[39 - i] = bytes1(uint8(addr2Value >> uint256(i * 8)));
        }

        // Extract final 6 bytes from addr3 (bytes 40-45)
        for (uint256 i = 0; i < 6; i++) {
            result[45 - i] = bytes1(uint8(addr3Value >> uint256(i * 8)));
        }

        ipfsHash = string(result);
    }

    /// @notice Stores encrypted IPFS data (three addresses) with Zama encryption
    /// @param encryptedAddr1 First encrypted address
    /// @param encryptedAddr2 Second encrypted address
    /// @param encryptedAddr3 Third encrypted address
    /// @param inputProof Input proof for external encrypted data
    /// @return storageId The ID of the stored data
    function storeEncryptedIPFSData(
        externalEaddress encryptedAddr1,
        externalEaddress encryptedAddr2,
        externalEaddress encryptedAddr3,
        bytes calldata inputProof
    ) public returns (uint256 storageId) {
        // Convert external encrypted inputs to internal encrypted addresses
        eaddress addr1 = FHE.fromExternal(encryptedAddr1, inputProof);
        eaddress addr2 = FHE.fromExternal(encryptedAddr2, inputProof);
        eaddress addr3 = FHE.fromExternal(encryptedAddr3, inputProof);

        // Increment storage ID
        _currentId++;
        storageId = _currentId;

        // Store encrypted data
        _encryptedStorage[storageId] = EncryptedIPFSData({
            encryptedAddress1: addr1,
            encryptedAddress2: addr2,
            encryptedAddress3: addr3,
            owner: msg.sender,
            exists: true
        });

        // Grant permissions for contract and owner
        FHE.allowThis(addr1);
        FHE.allowThis(addr2);
        FHE.allowThis(addr3);
        FHE.allow(addr1, msg.sender);
        FHE.allow(addr2, msg.sender);
        FHE.allow(addr3, msg.sender);

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
        FHE.allow(_encryptedStorage[storageId].encryptedAddress3, user);

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
    /// @return addr3 Third encrypted address
    function getEncryptedAddresses(
        uint256 storageId
    ) external view returns (eaddress addr1, eaddress addr2, eaddress addr3) {
        require(_encryptedStorage[storageId].exists, "Storage ID does not exist");
        require(
            _encryptedStorage[storageId].owner == msg.sender || _authorizedUsers[storageId][msg.sender],
            "Access denied"
        );

        EncryptedIPFSData memory data = _encryptedStorage[storageId];
        return (data.encryptedAddress1, data.encryptedAddress2, data.encryptedAddress3);
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
}
