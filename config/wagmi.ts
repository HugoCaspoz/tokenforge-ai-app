// wagmi.ts
import { http, createConfig } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains'; // Add any other chains you need
import { injected } from 'wagmi/connectors';

export const config = createConfig({
  chains: [mainnet, sepolia], // Example chains
  connectors: [
    injected(), // For MetaMask, etc.
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});