import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useIPFSStorage } from '@/hooks/useIPFSStorage';
import { StoreIPFS } from '@/components/StoreIPFS';
import { StorageList } from '@/components/StorageList';
import { initFHE, isFHEInitialized } from '@/utils/fheUtils';
import { useState } from 'react';

function App() {
  const { isConnected } = useAccount();
  const [isInitializingFHE, setIsInitializingFHE] = useState(false);
  const [fheInitialized, setFheInitialized] = useState(isFHEInitialized());
  const {
    isLoading,
    error,
    userStorageEntries,
    storeIPFSHash,
    retrieveIPFSHash,
    grantAccess,
    revokeAccess,
    refreshEntries,
  } = useIPFSStorage();

  const handleInitFHE = async () => {
    setIsInitializingFHE(true);
    try {
      await initFHE();
      setFheInitialized(true);
    } catch (error) {
      alert(`Failed to initialize FHE: ${(error as Error).message}`);
    } finally {
      setIsInitializingFHE(false);
    }
  };

  const handleStoreIPFS = async (ipfsHash: string) => {
    try {
      const txHash = await storeIPFSHash(ipfsHash);
      alert(`IPFS hash stored successfully! Transaction: ${txHash}`);
    } catch (error) {
      alert(`Failed to store IPFS hash: ${(error as Error).message}`);
      throw error;
    }
  };

  const handleRetrieveIPFS = async (storageId: number): Promise<string> => {
    return await retrieveIPFSHash(storageId);
  };

  const handleGrantAccess = async (storageId: number, userAddress: string) => {
    const txHash = await grantAccess(storageId, userAddress);
    console.log(`Access granted! Transaction: ${txHash}`);
  };

  const handleRevokeAccess = async (storageId: number, userAddress: string) => {
    const txHash = await revokeAccess(storageId, userAddress);
    console.log(`Access revoked! Transaction: ${txHash}`);
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <header style={{ 
        backgroundColor: '#2c3e50',
        color: 'white',
        padding: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ margin: '0', fontSize: '24px' }}>IPFS Encrypted Storage</h1>
            <p style={{ margin: '4px 0 0 0', opacity: 0.8, fontSize: '14px' }}>
              Securely store IPFS hashes using Zama FHE encryption
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {isConnected && !fheInitialized && (
              <button
                onClick={handleInitFHE}
                disabled={isInitializingFHE}
                style={{
                  backgroundColor: isInitializingFHE ? '#6c757d' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  cursor: isInitializingFHE ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                }}
              >
                {isInitializingFHE ? 'Initializing...' : 'Init FHE'}
              </button>
            )}
            {fheInitialized && (
              <span style={{
                backgroundColor: '#28a745',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '500',
              }}>
                🔐 FHE Ready
              </span>
            )}
            <ConnectButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        {!isConnected ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px',
            color: '#666'
          }}>
            <h2>Welcome to IPFS Encrypted Storage</h2>
            <p style={{ fontSize: '18px', marginBottom: '32px' }}>
              Connect your wallet to start storing and managing encrypted IPFS hashes
            </p>
            <div style={{ 
              backgroundColor: '#f8f9fa',
              padding: '32px',
              borderRadius: '8px',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              <h3 style={{ color: '#2c3e50', marginBottom: '16px' }}>Features:</h3>
              <ul style={{ 
                textAlign: 'left', 
                listStyle: 'none', 
                padding: 0,
                fontSize: '16px',
                lineHeight: '1.6'
              }}>
                <li>🔒 <strong>Fully Homomorphic Encryption</strong> - Your IPFS hashes are encrypted using Zama FHE</li>
                <li>🗝️ <strong>Access Control</strong> - Grant and revoke access to specific users</li>
                <li>⛓️ <strong>On-Chain Storage</strong> - Encrypted data stored securely on Ethereum Sepolia</li>
                <li>🔄 <strong>Easy Retrieval</strong> - Decrypt and retrieve your IPFS hashes when needed</li>
              </ul>
            </div>
          </div>
) : (
          <>
            {/* Error Display */}
            {error && (
              <div style={{ 
                backgroundColor: '#f8d7da',
                color: '#721c24',
                padding: '12px',
                borderRadius: '4px',
                border: '1px solid #f5c6cb',
                marginTop: '20px'
              }}>
                <strong>Error:</strong> {error}
              </div>
            )}

            {/* Store IPFS Hash Section */}
            <StoreIPFS onStore={handleStoreIPFS} isLoading={isLoading} />

            {/* Storage List Section */}
            <StorageList
              entries={userStorageEntries}
              isLoading={isLoading}
              onRetrieve={handleRetrieveIPFS}
              onGrantAccess={handleGrantAccess}
              onRevokeAccess={handleRevokeAccess}
              onRefresh={refreshEntries}
            />
          </>
        )}
      </main>

      {/* Footer */}
      <footer style={{ 
        backgroundColor: '#f8f9fa',
        padding: '40px 20px',
        marginTop: '60px',
        borderTop: '1px solid #dee2e6',
        textAlign: 'center',
        color: '#666'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p>Built with Zama FHE, React, and Ethereum</p>
          <p style={{ fontSize: '14px', marginTop: '16px' }}>
            This application demonstrates fully homomorphic encryption for secure IPFS hash storage.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;