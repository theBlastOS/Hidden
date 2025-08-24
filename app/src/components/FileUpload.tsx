import { useState, useRef } from 'react';

interface FileUploadProps {
  onUploadSuccess: (ipfsHash: string) => void;
  isLoading: boolean;
}

export function FileUpload({ onUploadSuccess, isLoading }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [generatedHash, setGeneratedHash] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 生成伪IPFS hash
  const generateFakeIPFSHash = (file: File): string => {
    const timestamp = Date.now().toString();
    const fileName = file.name.replace(/\W/g, '');
    const size = file.size.toString();
    
    // Base58 字符集（不包含 0、O、I、l 等容易混淆的字符）
    const base58Chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    
    // 使用文件信息生成一个看起来像IPFS hash的字符串
    const hashData = `${timestamp}${fileName}${size}`;
    let hash = 'Qm';
    
    // 生成46个字符的伪hash（IPFS hash总长度是48，去掉Qm前缀是46）
    for (let i = 0; i < 46; i++) {
      const charCode = hashData.charCodeAt(i % hashData.length);
      const randomOffset = Math.floor(Math.random() * 10);
      const finalIndex = (charCode + randomOffset + i) % base58Chars.length;
      hash += base58Chars[finalIndex];
    }
    
    return hash;
  };

  // 模拟上传过程
  const simulateUpload = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const fakeHash = generateFakeIPFSHash(file);
        resolve(fakeHash);
      }, 1500 + Math.random() * 1500); // 1.5-3秒的随机延迟
    });
  };

  const handleFileSelect = (file: File) => {
    // 检查文件大小（限制为10MB）
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    // 检查文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'text/plain', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Supported file types: JPEG, PNG, GIF, WebP, TXT, PDF');
      return;
    }

    setSelectedFile(file);
    // 清除之前的hash显示
    setGeneratedHash('');
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      // 模拟上传到IPFS
      const ipfsHash = await simulateUpload(selectedFile);
      
      // 调用回调函数，将hash传给父组件
      onUploadSuccess(ipfsHash);
      
      // 设置生成的hash用于页面显示
      setGeneratedHash(ipfsHash);
      
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleClearAll = () => {
    setSelectedFile(null);
    setGeneratedHash('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('IPFS hash copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy: ', err);
      alert('Failed to copy to clipboard');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#f8f9fa', 
      borderRadius: '8px',
      margin: '20px 0'
    }}>
      <h2 style={{ marginBottom: '16px' }}>Upload File to IPFS</h2>
      
      {/* 文件拖拽区域 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? '#007bff' : '#ced4da'}`,
          borderRadius: '8px',
          padding: '40px 20px',
          textAlign: 'center',
          backgroundColor: dragOver ? '#e7f3ff' : 'white',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          marginBottom: '16px'
        }}
      >
        {selectedFile ? (
          <div>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📁</div>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              {selectedFile.name}
            </div>
            <div style={{ color: '#666', fontSize: '14px' }}>
              {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Unknown type'}
            </div>
            <div style={{ 
              marginTop: '12px', 
              fontSize: '12px', 
              color: '#007bff' 
            }}>
              Click to select a different file
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📤</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
              Drag & drop your file here
            </div>
            <div style={{ color: '#666', marginBottom: '12px' }}>
              or click to browse files
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#999',
              marginTop: '8px'
            }}>
              Supported: JPEG, PNG, GIF, WebP, TXT, PDF (Max 10MB)
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileInputChange}
        accept=".jpg,.jpeg,.png,.gif,.webp,.txt,.pdf"
        style={{ display: 'none' }}
      />

      {/* 上传按钮 */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading || isLoading}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: !selectedFile || uploading || isLoading ? '#6c757d' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: !selectedFile || uploading || isLoading ? 'not-allowed' : 'pointer',
            flex: 1,
            fontWeight: 'bold'
          }}
        >
          {uploading ? 'Uploading to IPFS...' : 'Upload to IPFS'}
        </button>
        
        {(selectedFile || generatedHash) && (
          <button
            onClick={handleClearAll}
            disabled={uploading || isLoading}
            style={{
              padding: '12px 16px',
              fontSize: '16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: uploading || isLoading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* 生成的IPFS hash显示区域 */}
      {generatedHash && (
        <div style={{ 
          marginTop: '16px', 
          padding: '16px', 
          backgroundColor: '#d4edda', 
          borderRadius: '8px',
          border: '1px solid #c3e6cb'
        }}>
          <h4 style={{ 
            marginBottom: '12px', 
            color: '#155724',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            ✅ Upload Successful!
          </h4>
          <div style={{ marginBottom: '12px' }}>
            <strong style={{ color: '#155724' }}>Generated IPFS Hash:</strong>
          </div>
          <div style={{
            backgroundColor: '#fff',
            padding: '12px',
            borderRadius: '4px',
            border: '1px solid #c3e6cb',
            fontFamily: 'monospace',
            fontSize: '14px',
            wordBreak: 'break-all',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ flex: 1 }}>{generatedHash}</span>
            <button
              onClick={() => copyToClipboard(generatedHash)}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                minWidth: '60px'
              }}
            >
              Copy
            </button>
          </div>
          <div style={{ 
            marginTop: '12px',
            fontSize: '14px',
            color: '#155724'
          }}>
            💡 You can now copy this hash and use it in the "Store IPFS Hash" section below to save it encrypted on the blockchain.
          </div>
        </div>
      )}

      {/* 说明信息 */}
      <div style={{ 
        marginTop: '16px', 
        padding: '12px', 
        backgroundColor: '#fff3cd', 
        borderRadius: '4px',
        border: '1px solid #ffeaa7'
      }}>
        <h4 style={{ marginBottom: '8px', color: '#856404' }}>📌 Demo Mode</h4>
        <p style={{ margin: '0', color: '#856404', fontSize: '14px' }}>
          This is a demo implementation. Files are not actually uploaded to IPFS. 
          A fake IPFS hash will be generated for testing purposes.
        </p>
      </div>
    </div>
  );
}