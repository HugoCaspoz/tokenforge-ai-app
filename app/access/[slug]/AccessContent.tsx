'use client';

import { useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { ethers } from 'ethers';
import { TOKEN_ABI } from '@/lib/tokenArtifacts';
import { NETWORK_NAMES } from '@/lib/plans';

interface AccessContentProps {
    content: {
        id: string;
        title: string;
        description: string | null;
        content_type: string;
        content_url: string;
        min_tokens: number;
        projects: {
            contract_address: string;
            chain_id: string;
            name: string;
            ticker: string;
            logo_url: string | null;
        };
    };
}

export default function AccessContent({ content }: AccessContentProps) {
    const { address: userAddress, isConnected } = useAccount();
    const [revealed, setRevealed] = useState(false);

    const { data: balance } = useReadContract({
        address: content.projects.contract_address as `0x${string}`,
        abi: TOKEN_ABI,
        functionName: 'balanceOf',
        args: [userAddress as `0x${string}`],
        chainId: Number(content.projects.chain_id),
        query: {
            enabled: !!userAddress,
        }
    });

    const balanceFormatted = balance ? parseFloat(ethers.formatEther(balance as bigint)) : 0;
    const hasAccess = balanceFormatted >= content.min_tokens;
    const networkName = NETWORK_NAMES[content.projects.chain_id as keyof typeof NETWORK_NAMES] || 'Unknown';

    const getContentIcon = () => {
        switch (content.content_type) {
            case 'telegram': return '✈️';
            case 'pdf': return '📄';
            default: return '🔗';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-6">
            <div className="max-w-2xl w-full bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-8 text-center">
                    {content.projects.logo_url && (
                        <img
                            src={content.projects.logo_url}
                            alt="Logo"
                            className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-white shadow-lg"
                        />
                    )}
                    <h1 className="text-3xl font-bold text-white mb-2">{content.title}</h1>
                    <p className="text-purple-100 text-sm">
                        Contenido Exclusivo de {content.projects.name} (${content.projects.ticker})
                    </p>
                </div>

                {/* Content */}
                <div className="p-8">
                    {content.description && (
                        <p className="text-gray-300 mb-6 text-center">{content.description}</p>
                    )}

                    {/* Requirements */}
                    <div className="bg-gray-900 rounded-xl p-6 mb-6 border border-gray-700">
                        <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                            Requisitos de Acceso
                        </h3>
                        <div className="flex items-center justify-between">
                            <span className="text-white">Tokens Requeridos:</span>
                            <span className="font-mono font-bold text-purple-400">
                                {content.min_tokens.toLocaleString()} ${content.projects.ticker}
                            </span>
                        </div>
                        {isConnected && (
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700">
                                <span className="text-white">Tu Balance:</span>
                                <span className={`font-mono font-bold ${hasAccess ? 'text-green-400' : 'text-red-400'}`}>
                                    {balanceFormatted.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${content.projects.ticker}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Access Status */}
                    {!isConnected ? (
                        <div className="text-center">
                            <p className="text-gray-400 mb-4">Conecta tu wallet para verificar el acceso</p>
                            <button className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-6 rounded-lg">
                                Conectar Wallet
                            </button>
                        </div>
                    ) : hasAccess ? (
                        <div className="text-center">
                            <div className="bg-green-900/30 border border-green-500/50 rounded-xl p-6 mb-6">
                                <div className="text-5xl mb-3">✅</div>
                                <h2 className="text-2xl font-bold text-green-400 mb-2">¡Acceso Concedido!</h2>
                                <p className="text-gray-300 text-sm">
                                    Tienes suficientes tokens para acceder a este contenido exclusivo
                                </p>
                            </div>

                            {!revealed ? (
                                <button
                                    onClick={() => setRevealed(true)}
                                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all transform hover:scale-105 text-lg"
                                >
                                    {getContentIcon()} Revelar Contenido
                                </button>
                            ) : (
                                <div className="bg-gray-900 rounded-xl p-6 border border-purple-500">
                                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">
                                        {content.content_type === 'telegram' ? 'Enlace de Telegram' :
                                            content.content_type === 'pdf' ? 'Enlace del PDF' : 'Enlace'}
                                    </p>
                                    <a
                                        href={content.content_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold py-3 px-4 rounded text-center break-all transition-colors"
                                    >
                                        {content.content_url}
                                    </a>
                                    <p className="text-gray-500 text-xs mt-3 text-center">
                                        Haz clic en el enlace para acceder
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center">
                            <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-6 mb-6">
                                <div className="text-5xl mb-3">🔒</div>
                                <h2 className="text-2xl font-bold text-red-400 mb-2">Acceso Denegado</h2>
                                <p className="text-gray-300 text-sm">
                                    Necesitas {(content.min_tokens - balanceFormatted).toLocaleString(undefined, { maximumFractionDigits: 2 })} tokens más
                                </p>
                            </div>

                            <a
                                href={`https://dapp.quickswap.exchange/swap/best/MATIC/${content.projects.contract_address}?chainId=${parseInt(content.projects.chain_id, 16)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all transform hover:scale-105"
                            >
                                🦄 Comprar ${content.projects.ticker}
                            </a>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t border-gray-700 text-center text-sm text-gray-500">
                        <p>Powered by TokenForge • Network: {networkName}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
