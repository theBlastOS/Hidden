import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'IPFS Encrypted Storage',
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID', // Replace with actual project ID
  chains: [sepolia],
  ssr: false,
});