/// <reference types="vite/client" />

interface Window {
  fhevm: {
    initSDK: () => Promise<void>;
    createInstance: (config: any) => Promise<any>;
  };
}