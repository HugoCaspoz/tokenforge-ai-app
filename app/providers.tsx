'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { polygon } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';
import { useState } from 'react'; // <-- Importa useState

// ID de tu proyecto de WalletConnect
const projectId = '3a53e506a8d7e75fbd56f527f81870a9';

// Componente Proveedor
export function Providers({ children }: { children: React.ReactNode }) {
  // Mueve la creación de la config y el cliente DENTRO del componente
  // y envuélvelo en useState para que solo se ejecute una vez en el cliente.
  const [queryClient] = useState(() => new QueryClient());
  const [config] = useState(() => 
    createConfig({
      chains: [polygon],
      connectors: [
        injected({ shimDisconnect: true }),
        walletConnect({ projectId }),
      ],
      transports: {
        [polygon.id]: http(),
      },
    })
  );

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}