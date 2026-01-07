'use client';

import { useAccount, useConnect } from 'wagmi';
import { useState, useEffect } from 'react';

export default function RequireWallet({ children }: { children: React.ReactNode }) {
    const { isConnected } = useAccount();
    const { connectors, connect } = useConnect();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null; // Evitar hidratación mismatch

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] bg-gray-900 text-white p-8 rounded-xl border border-gray-700 shadow-2xl max-w-2xl mx-auto mt-10">
                <div className="mb-6 p-4 bg-purple-900/30 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-purple-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
                    </svg>
                </div>

                <h2 className="text-3xl font-bold mb-4 text-center">Conecta tu Wallet</h2>
                <p className="text-gray-400 text-center mb-8 max-w-md">
                    Para crear y desplegar tu propia criptomoneda, es obligatorio conectar tu billetera Web3. Esto asegura que eres el dueño legítimo de los contratos.
                </p>

                <div className="flex gap-4 flex-wrap justify-center">
                    {connectors.map((connector: any) => (
                        <button
                            key={connector.uid}
                            onClick={() => connect({ connector })}
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold transition-all shadow-lg hover:shadow-indigo-500/20 flex items-center gap-2"
                        >
                            {connector.name}
                        </button>
                    ))}
                </div>

                <p className="mt-8 text-xs text-gray-500">
                    Soportamos MetaMask, WalletConnect, Coinbase Wallet y más.
                </p>
            </div>
        );
    }

    return <>{children}</>;
}
