'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http, CreateConnectorFn } from 'wagmi';
import { polygon } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';
import { useState } from 'react';
import { I18nProvider } from '@/lib/i18n';

// ID de tu proyecto de WalletConnect
const projectId = '3a53e506a8d7e75fbd56f527f81870a9';

// Componente Proveedor
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [config] = useState(() => {
    const connectors: CreateConnectorFn[] = [
      injected({ shimDisconnect: true })
    ];

    // Only add WalletConnect on client side to avoid indexedDB/SSR errors
    if (typeof window !== 'undefined') {
      connectors.push(walletConnect({ projectId }));
    }

    return createConfig({
      chains: [polygon],
      connectors,
      transports: {
        [polygon.id]: http('https://polygon-rpc.com'),
      },
      ssr: false,
    });
  });

  return (
    <I18nProvider>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    </I18nProvider>
  );
}