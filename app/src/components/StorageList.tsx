import { useState } from 'react';
import { StorageEntry } from '../types/index';
import { isFHEInitialized } from '../utils/fheUtils';

interface StorageListProps {
  entries: StorageEntry[];
  isLoading: boolean;
  onRetrieve: (storageId: number) => Promise<string>;
  onGrantAccess: (storageId: number, userAddress: string) => Promise<void>;
  onRevokeAccess: (storageId: number, userAddress: string) => Promise<void>;
  onRefresh: () => void;
}

export function StorageList({
  entries,
  isLoading,
  onRetrieve,
  onGrantAccess,
  onRevokeAccess,
  onRefresh,
}: StorageListProps) {
  const [retrievingId, setRetrievingId] = useState<number | null>(null);
  const [retrievedHashes, setRetrievedHashes] = useState<Record<number, string>>({});
  const [grantAddress, setGrantAddress] = useState('');
  const [selectedEntryForGrant, setSelectedEntryForGrant] = useState<number | null>(null);
  const fheInitialized = isFHEInitialized();

  const handleRetrieve = async (storageId: number) => {
    if (retrievingId) return;
    
    if (!fheInitialized) {
      alert('FHE not initialized. Please click "Init FHE" button in the header first.');
      return;
    }

    setRetrievingId(storageId);
    try {
      const ipfsHash = await onRetrieve(storageId);
      setRetrievedHashes(prev => ({ ...prev, [storageId]: ipfsHash }));
    } catch (error) {
      console.error('Failed to retrieve IPFS hash:', error);
      alert('Failed to retrieve IPFS hash: ' + (error as Error).message);
    } finally {
      setRetrievingId(null);
    }
  };

  const handleGrantAccess = async (storageId: number) => {
    if (!grantAddress.trim()) {
      alert('Please enter a valid address');
      return;
    }

    try {
      await onGrantAccess(storageId, grantAddress);
      setGrantAddress('');
      setSelectedEntryForGrant(null);
      alert('Access granted successfully!');
      onRefresh();
    } catch (error) {
      console.error('Failed to grant access:', error);
      alert('Failed to grant access: ' + (error as Error).message);
    }
  };

  const handleRevokeAccess = async (storageId: number) => {
    const userAddress = prompt('Enter the address to revoke access from:');
    if (!userAddress?.trim()) return;

    try {
      await onRevokeAccess(storageId, userAddress);
      alert('Access revoked successfully!');
      onRefresh();
    } catch (error) {
      console.error('Failed to revoke access:', error);
      alert('Failed to revoke access: ' + (error as Error).message);
    }
  };

  if (isLoading && entries.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading your storage entries...</div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>No storage entries found. {fheInitialized ? 'Store an IPFS hash to get started!' : 'Initialize FHE and store an IPFS hash to get started!'}</div>
        {!fheInitialized && (
          <div style={{ 
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#fff3cd',
            color: '#856404',
            border: '1px solid #ffeaa7',
            borderRadius: '8px',
            maxWidth: '400px',
            margin: '16px auto'
          }}>
            📝 <strong>Note:</strong> You need to initialize FHE first to view and manage your encrypted storage entries.
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Your Storage Entries</h2>
        <button onClick={onRefresh} disabled={isLoading}>
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div style={{ display: 'grid', gap: '16px' }}>
        {entries.map((entry) => (
          <div 
            key={entry.id} 
            style={{ 
              border: '1px solid #ddd', 
              borderRadius: '8px', 
              padding: '16px',
              backgroundColor: entry.isOwner ? '#f0f8ff' : '#f9f9f9'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3>Storage ID: {entry.id}</h3>
                <p><strong>Owner:</strong> {entry.owner}</p>
                <p><strong>Status:</strong> {entry.isOwner ? 'Owner' : 'Authorized User'}</p>
                <p><strong>Has Access:</strong> {entry.hasAccess ? 'Yes' : 'No'}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span><strong>IPFS Hash:</strong></span>
                  {retrievedHashes[entry.id] ? (
                    <>
                      <span style={{ 
                        fontFamily: 'monospace', 
                        fontSize: '14px', 
                        wordBreak: 'break-all',
                        backgroundColor: '#e8f5e8',
                        padding: '2px 4px',
                        borderRadius: '2px',
                        color: '#155724',
                        flex: 1
                      }}>
                        {retrievedHashes[entry.id]}
                      </span>
                      <button
                        onClick={() => navigator.clipboard.writeText(retrievedHashes[entry.id])}
                        style={{ 
                          padding: '2px 8px',
                          fontSize: '12px',
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Copy
                      </button>
                    </>
                  ) : (
                    <span style={{ 
                      fontFamily: 'monospace',
                      color: '#666',
                      fontStyle: 'italic'
                    }}>
                      ***
                    </span>
                  )}
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                {entry.hasAccess && (
                  <button
                    onClick={() => handleRetrieve(entry.id)}
                    disabled={retrievingId === entry.id}
                    style={{ 
                      padding: '8px 16px',
                      backgroundColor: !fheInitialized ? '#ffc107' : '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {retrievingId === entry.id ? 'Retrieving...' : !fheInitialized ? 'FHE Required' : 'Retrieve IPFS Hash'}
                  </button>
                )}

                {entry.isOwner && (
                  <button
                    onClick={() => setSelectedEntryForGrant(
                      selectedEntryForGrant === entry.id ? null : entry.id
                    )}
                    style={{ 
                      padding: '8px 16px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Grant Access
                  </button>
                )}

                {entry.isOwner && (
                  <button
                    onClick={() => handleRevokeAccess(entry.id)}
                    style={{ 
                      padding: '8px 16px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Revoke Access
                  </button>
                )}
              </div>
            </div>


            {selectedEntryForGrant === entry.id && (
              <div style={{ 
                marginTop: '12px', 
                padding: '12px', 
                backgroundColor: '#fff3cd', 
                borderRadius: '4px',
                border: '1px solid #ffeaa7'
              }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Grant Access To:</strong>
                </div>
                <input
                  type="text"
                  value={grantAddress}
                  onChange={(e) => setGrantAddress(e.target.value)}
                  placeholder="Enter Ethereum address (0x...)"
                  style={{ 
                    width: '100%',
                    padding: '8px',
                    marginBottom: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleGrantAccess(entry.id)}
                    style={{ 
                      padding: '8px 16px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Confirm Grant
                  </button>
                  <button
                    onClick={() => {
                      setSelectedEntryForGrant(null);
                      setGrantAddress('');
                    }}
                    style={{ 
                      padding: '8px 16px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}