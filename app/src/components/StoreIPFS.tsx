import { useState } from 'react';
import { isValidIPFSHash } from '@/utils/ipfsUtils';
import { isFHEInitialized } from '@/utils/fheUtils';

interface StoreIPFSProps {
  onStore: (ipfsHash: string) => Promise<void>;
  isLoading: boolean;
}

export function StoreIPFS({ onStore, isLoading }: StoreIPFSProps) {
  const [ipfsHash, setIpfsHash] = useState('');
  const [validationError, setValidationError] = useState('');
  const fheInitialized = isFHEInitialized();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setIpfsHash(value);
    
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError('');
    }
  };

  const validateAndStore = async () => {
    if (!fheInitialized) {
      setValidationError('FHE not initialized. Please click "Init FHE" button in the header first.');
      return;
    }

    if (!ipfsHash.trim()) {
      setValidationError('Please enter an IPFS hash');
      return;
    }

    if (!isValidIPFSHash(ipfsHash)) {
      setValidationError('Invalid IPFS hash format. Expected format: Qm... (48 characters)');
      return;
    }

    try {
      await onStore(ipfsHash);
      setIpfsHash(''); // Clear input after successful storage
      setValidationError('');
    } catch (error) {
      console.error('Failed to store IPFS hash:', error);
      // Error handling is done in the parent component
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      validateAndStore();
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#f8f9fa', 
      borderRadius: '8px',
      margin: '20px 0'
    }}>
      <h2 style={{ marginBottom: '16px' }}>Store New IPFS Hash</h2>
      
      <div style={{ marginBottom: '16px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '8px',
          fontWeight: 'bold'
        }}>
          IPFS Hash:
        </label>
        <input
          type="text"
          value={ipfsHash}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Enter IPFS hash (e.g., QmYourHashHere...)"
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            border: validationError ? '2px solid #dc3545' : '1px solid #ced4da',
            borderRadius: '4px',
            fontFamily: 'monospace',
            backgroundColor: isLoading ? '#f5f5f5' : 'white'
          }}
        />
        
        {validationError && (
          <div style={{ 
            color: '#dc3545', 
            fontSize: '14px', 
            marginTop: '4px' 
          }}>
            {validationError}
          </div>
        )}
        
        <div style={{ 
          fontSize: '12px', 
          color: '#6c757d', 
          marginTop: '4px' 
        }}>
          Example: QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG
        </div>
      </div>

      <button
        onClick={validateAndStore}
        disabled={isLoading || !ipfsHash.trim()}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: isLoading || !ipfsHash.trim() ? '#6c757d' : fheInitialized ? '#007bff' : '#ffc107',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isLoading || !ipfsHash.trim() ? 'not-allowed' : 'pointer',
          width: '100%'
        }}
      >
        {isLoading ? 'Encrypting and Storing...' : !fheInitialized ? 'FHE Required - Store IPFS Hash' : 'Store IPFS Hash'}
      </button>

      <div style={{ 
        marginTop: '16px', 
        padding: '12px', 
        backgroundColor: '#d1ecf1', 
        borderRadius: '4px',
        border: '1px solid #bee5eb'
      }}>
        <h4 style={{ marginBottom: '8px', color: '#0c5460' }}>How it works:</h4>
        <ol style={{ margin: '0', paddingLeft: '20px', color: '#0c5460' }}>
          <li>Your IPFS hash is converted to three Ethereum addresses</li>
          <li>These addresses are encrypted using Zama FHE technology</li>
          <li>The encrypted data is stored on the blockchain</li>
          <li>Only you (and users you authorize) can decrypt and retrieve the original hash</li>
        </ol>
      </div>
    </div>
  );
}