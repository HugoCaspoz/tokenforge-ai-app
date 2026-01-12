'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { createClient } from '@/utils/supabase/client';
import { NETWORK_NAMES, NETWORK_EXPLORERS } from '@/lib/plans';

import { TOKEN_ABI } from '@/lib/tokenArtifacts';
import LiquidityWizard from './LiquidityWizard';
import LiquidityLocker from './LiquidityLocker';
import WhaleWatcher from './WhaleWatcher';

interface TokenDashboardProps {
    token: {
        id: number;
        name: string;
        ticker: string;
        description: string | null;
        logo_url: string | null;
        chain_id: string;
        contract_address: string;
        user_id: string;
        twitter_url?: string | null;
        telegram_url?: string | null;
        website_url?: string | null;
    };
}

export default function TokenDashboard({ token }: TokenDashboardProps) {
    const supabase = createClient();
    const { address: userAddress, isConnected } = useAccount();
    const [activeTab, setActiveTab] = useState<'overview' | 'admin' | 'growth'>('overview');
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [flatCode, setFlatCode] = useState("");
    const [apiKey, setApiKey] = useState("");
    const [lpAddress, setLpAddress] = useState<string>("");

    // Socials State
    const [socials, setSocials] = useState({
        twitter: token.twitter_url || '',
        telegram: token.telegram_url || '',
        website: token.website_url || ''
    });
    const [savingSocials, setSavingSocials] = useState(false);

    const handleSaveSocials = async () => {
        setSavingSocials(true);
        const { error } = await supabase.from('projects').update({
            twitter_url: socials.twitter,
            telegram_url: socials.telegram,
            website_url: socials.website
        }).eq('contract_address', token.contract_address);

        if (error) alert("Error guardando redes sociales");
        else alert("Redes sociales actualizadas!");
        setSavingSocials(false);
    };

    useEffect(() => {
        const savedKey = localStorage.getItem('polygonScanApiKey');
        if (savedKey) setApiKey(savedKey);
    }, []);

    const { writeContract, isPending: isAirdropPending, error: airdropError } = useWriteContract();
    const { writeContract: renounceOwnership, isPending: isRenouncing } = useWriteContract();

    // ... (inside handleAirdrop)

    const { data: ownerAddress, error: ownerError } = useReadContract({
        address: token.contract_address as `0x${string}`,
        abi: TOKEN_ABI,
        functionName: 'owner',
        chainId: Number(token.chain_id),
    });

    const { data: balanceOf } = useReadContract({
        address: token.contract_address as `0x${string}`,
        abi: TOKEN_ABI,
        functionName: 'balanceOf',
        args: [userAddress as `0x${string}`],
        chainId: Number(token.chain_id),
        query: {
            enabled: !!userAddress,
        }
    });

    const { data: totalSupply, error: supplyError } = useReadContract({
        address: token.contract_address as `0x${string}`,
        abi: TOKEN_ABI,
        functionName: 'totalSupply',
        chainId: Number(token.chain_id),
    });

    // Debug logging for Ownership
    console.log("---- DEBUG OWNERSHIP ----");
    console.log("User Address:", userAddress);
    console.log("Contract Owner:", ownerAddress);
    console.log("Match?", userAddress && ownerAddress && userAddress.toLowerCase() === ownerAddress.toLowerCase());

    if (ownerError) console.error("Owner Fetch Error:", ownerError);
    if (supplyError) console.error("Supply Fetch Error:", supplyError);

    // Derived State
    const isOwner = userAddress && ownerAddress && userAddress.toLowerCase() === ownerAddress.toLowerCase();
    const networkName = NETWORK_NAMES[token.chain_id as keyof typeof NETWORK_NAMES] || 'Unknown Network';
    const explorerUrl = NETWORK_EXPLORERS[token.chain_id as keyof typeof NETWORK_EXPLORERS];

    const handleRenounceOwnership = async () => {
        if (!isOwner) return;

        const confirm1 = window.confirm("⚠️ ¿ESTÁS SEGURO? \n\nRenunciar a la propiedad es IRREVERSIBLE. Perderás el control total del contrato para siempre.\n\n¿Quieres continuar?");
        if (!confirm1) return;

        const confirm2 = window.confirm("⚠️ ULTIMA ADVERTENCIA \n\nNo podrás pausar, acuñar más tokens ni cambiar nada nunca más. \n\n¿Estás 100% seguro?");
        if (!confirm2) return;

        try {
            renounceOwnership({
                address: token.contract_address as `0x${string}`,
                abi: TOKEN_ABI,
                functionName: 'renounceOwnership',
            }, {
                onSuccess: async () => {
                    await supabase.from('projects').update({ is_renounced: true }).eq('contract_address', token.contract_address);
                    alert("¡Propiedad Renunciada con Éxito!");
                    window.location.reload();
                }
            });
        } catch (e) {
            console.error(e);
            alert("Error al renunciar.");
        }
    };

    const handleDownloadLogo = async () => {
        if (!token.logo_url) return;
        try {
            const response = await fetch(token.logo_url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${token.ticker}_logo.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
            alert("Error descargando la imagen. Intenta 'Guardar imagen como' con click derecho.");
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto p-6">
            {/* Header */}
            <div className="flex items-center gap-6 mb-8 bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden border-4 border-gray-600">
                    {token.logo_url ? <img src={token.logo_url} alt="Logo" className="w-full h-full object-cover" /> : <span className="text-4xl text-gray-400">{token.ticker[0]}</span>}
                </div>
                <div>
                    <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                        {token.name} <span className="text-gray-400 text-2xl font-normal">${token.ticker}</span>
                    </h1>
                    <p className="text-blue-400 font-mono mt-1">{token.contract_address}</p>
                    <div className="flex gap-2 mt-3 flex-wrap">
                        <span className="bg-gray-700 px-3 py-1 rounded text-sm text-gray-300">Network: {networkName}</span>
                        {isOwner ? (
                            <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded text-sm border border-green-500/30">Eres el Owner</span>
                        ) : (
                            <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded text-sm border border-yellow-500/30">Solo Vista (No eres Owner)</span>
                        )}

                        {/* Social Links Display */}
                        {/* Social Links Display */}
                        {token.twitter_url && (
                            <a href={token.twitter_url} target="_blank" className="bg-black/40 hover:bg-black/60 p-2 rounded-full transition-colors border border-gray-700 hover:border-white group">
                                <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-400 group-hover:text-white fill-current" aria-hidden="true">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                            </a>
                        )}
                        {token.telegram_url && (
                            <a href={token.telegram_url} target="_blank" className="bg-blue-500/10 hover:bg-blue-500/20 p-2 rounded-full transition-colors border border-blue-500/30 hover:border-blue-400 group">
                                <svg viewBox="0 0 24 24" className="w-5 h-5 text-blue-400 group-hover:text-blue-300 fill-current" aria-hidden="true">
                                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 11.944 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                                </svg>
                            </a>
                        )}
                        {token.website_url && (
                            <a href={token.website_url} target="_blank" className="bg-purple-500/10 hover:bg-purple-500/20 p-2 rounded-full transition-colors border border-purple-500/30 hover:border-purple-400 group">
                                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-purple-400 group-hover:text-purple-300">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                                </svg>
                            </a>
                        )}

                        {/* Buy Button */}
                        <a
                            href={`https://dapp.quickswap.exchange/swap/best/MATIC/${token.contract_address}?chainId=${parseInt(token.chain_id, 16)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-1 rounded text-sm font-bold flex items-center gap-1 transition-colors"
                        >
                            🦄 Comprar Ahora
                        </a>
                        {/* Error Debug Badge */}
                        {(ownerError || supplyError) && (
                            <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded text-sm border border-red-500/30" title={String(ownerError || supplyError)}>
                                Error de Lectura (Hover)
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            {/* Tabs - Only visible to Owner */}
            {isOwner && (
                <div className="flex gap-4 border-b border-gray-700 mb-6">
                    {['overview', 'admin', 'growth'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-6 py-3 font-semibold capitalize transition-colors ${activeTab === tab ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            )}

            {/* Content */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 min-h-[400px]">
                {activeTab === 'overview' && (
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Resumen del Proyecto</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-2">Descripción (Base de Datos)</h3>
                                <p className="text-gray-200 bg-gray-900 p-4 rounded text-sm leading-relaxed">{token.description || "Sin descripción."}</p>
                            </div>
                            <div>
                                <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-2">Estadísticas On-Chain</h3>
                                <div className="bg-gray-900 p-4 rounded space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Total Supply:</span>
                                        <span className="font-mono text-white">
                                            {totalSupply ? (Number(totalSupply) / 10 ** 18).toLocaleString() : 'Cargando...'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-t border-gray-800 pt-2 mt-2">
                                        <span className="text-gray-400">Tu Balance:</span>
                                        <span className="font-mono text-green-400 font-bold">
                                            {balanceOf ? (Number(balanceOf) / 10 ** 18).toLocaleString() : '0'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-t border-gray-800 pt-2 mt-2">
                                        <span className="text-gray-400">Contract Owner:</span>
                                        <span className="font-mono text-blue-400 text-xs truncate max-w-[150px]" title={ownerAddress as string}>{ownerAddress as string || '...'}</span>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <a
                                        href={explorerUrl ? `${explorerUrl}/address/${token.contract_address}` : '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block w-full text-center py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors text-white"
                                    >
                                        Ver en {networkName} Explorer ↗
                                    </a>

                                    {/* Download Logo Button */}
                                    {isOwner && (
                                        <button
                                            onClick={handleDownloadLogo}
                                            disabled={!token.logo_url}
                                            className="mt-3 block w-full text-center py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded transition-colors text-gray-300 text-sm flex items-center justify-center gap-2"
                                        >
                                            <span>⬇️</span> Descargar Logo
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* DEXSCREENER EMBED - Moved to Overview */}
                        <div className="mt-8 w-full h-[500px] bg-gray-900 rounded-xl overflow-hidden border border-gray-700">
                            <iframe
                                src={`https://dexscreener.com/${token.chain_id === '0x89' ? 'polygon' :
                                    token.chain_id === '0x38' ? 'bsc' :
                                        token.chain_id === '0x1' ? 'ethereum' : 'polygon'
                                    }/${token.contract_address}?embed=1&theme=dark`}
                                width="100%"
                                height="100%"
                                frameBorder="0"
                            ></iframe>
                        </div>
                    </div>
                )}

                {
                    activeTab === 'admin' && (
                        <div>
                            <h2 className="text-2xl font-bold mb-4 text-red-400">Zona de Peligro / Admin</h2>
                            {!isOwner && (
                                <div className="bg-red-500/20 border border-red-500 text-red-200 p-4 rounded mb-6">
                                    ⚠️ No estás conectado con la cuenta propietaria del contrato. No podrás ejecutar estas acciones.
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="border border-gray-600 p-6 rounded-lg opacity-75">
                                    <h3 className="font-bold text-lg mb-2">Transferir Propiedad</h3>
                                    <p className="text-sm text-gray-400 mb-4">Transfiere el control del contrato a otra wallet. Irreversible si te equivocas de dirección.</p>
                                    <input type="text" placeholder="0x..." className="w-full bg-gray-900 border border-gray-600 rounded p-2 mb-3 text-white" disabled={!isOwner} />
                                    <button disabled={!isOwner} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 rounded text-white font-semibold w-full">Transferir</button>
                                </div>

                                <div className="border border-red-600/50 p-6 rounded-lg bg-red-900/10">
                                    <h3 className="font-bold text-lg mb-2 text-red-400">Renunciar Propiedad</h3>
                                    <p className="text-sm text-gray-400 mb-4">Nadie podrá controlar el contrato nunca más. Es necesario para "tokens comunitarios".</p>
                                    <button disabled={!isOwner} className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 rounded text-white font-semibold w-full">Renunciar</button>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg mb-2">Comunidad</h3>
                                    <p className="text-sm text-gray-400 mb-4">Si abandonas la propiedad, el token será gobernado por la comunidad (o nadie).</p>
                                    <button
                                        onClick={handleRenounceOwnership}
                                        disabled={!isOwner || isRenouncing}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 rounded text-white font-semibold w-full"
                                    >
                                        {isRenouncing ? "Renunciando..." : "Renunciar (IRREVERSIBLE)"}
                                    </button>
                                </div>
                            </div>

                            {/* Verification Section */}
                            {/* Verification Section */}
                            <div className="mt-8 border-t border-gray-700 pt-8">
                                <h3 className="text-xl font-bold mb-6 text-yellow-400">✅ Verificación de Contrato</h3>

                                {/* AUTO VERIFY (New) */}
                                <div className="bg-blue-900/20 border border-blue-500/50 p-6 rounded-xl mb-8">
                                    <h4 className="font-bold text-lg text-blue-300 mb-2 flex items-center gap-2">
                                        <span>🤖</span> Verificación Automática
                                    </h4>
                                    <p className="text-sm text-gray-400 mb-4">
                                        Conecta con PolygonScan para verificar en 1 click. Necesitas una API Key gratuita.
                                    </p>
                                    <div className="flex gap-2">
                                        <input
                                            id="apiKeyInput"
                                            type="text"
                                            value={apiKey}
                                            onChange={(e) => {
                                                setApiKey(e.target.value);
                                                localStorage.setItem('polygonScanApiKey', e.target.value);
                                            }}
                                            placeholder="PolygonScan API Key (ej. XJ9...)"
                                            className="flex-1 bg-black/50 border border-gray-600 rounded p-3 text-white focus:border-blue-500 outline-none font-mono text-sm"
                                        />
                                        <button
                                            onClick={async (e) => {
                                                const btn = e.currentTarget;
                                                if (!apiKey) return alert("Falta la API Key");

                                                btn.disabled = true;
                                                const originalText = btn.innerText;
                                                btn.innerText = "Verificando...";

                                                try {
                                                    const res = await fetch('/api/verify', {
                                                        method: 'POST',
                                                        body: JSON.stringify({
                                                            contractAddress: token.contract_address,
                                                            name: token.name,
                                                            symbol: token.ticker,
                                                            initialSupply: totalSupply ? (Number(totalSupply) / 10 ** 18).toString() : "1000000",
                                                            initialOwner: ownerAddress || userAddress,
                                                            apiKey
                                                        })
                                                    });
                                                    const data = await res.json();
                                                    if (data.success) {
                                                        alert("✅ Solicitud Enviada\nGUID: " + data.guid + "\nEspera 30s y refresca PolygonScan.");
                                                    } else {
                                                        alert("❌ Error: " + data.error);
                                                    }
                                                } catch (err) {
                                                    console.error(err);
                                                    alert("Error de conexión");
                                                } finally {
                                                    btn.disabled = false;
                                                    btn.innerText = originalText;
                                                }
                                            }}
                                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded transition-colors disabled:opacity-50"
                                        >
                                            Verificar Ahora
                                        </button>
                                    </div>
                                    <div className="mt-2 text-right">
                                        <a href="https://docs.etherscan.io/getting-an-api-key" target="_blank" className="text-xs text-blue-400 underline hover:text-white">Conseguir API Key (Gratis)</a>
                                    </div>
                                </div>

                                <h4 className="font-bold text-gray-400 mb-4 border-b border-gray-700 pb-2">O método manual:</h4>

                                {!showVerifyModal ? (
                                    <div>
                                        <p className="text-gray-400 mb-4 text-sm">Si no tienes API Key, descarga el código y súbelo a mano.</p>
                                        <button
                                            onClick={async () => {
                                                setShowVerifyModal(true);
                                                try {
                                                    const res = await fetch('/SimpleToken_flat.sol');
                                                    const text = await res.text();
                                                    setFlatCode(text);
                                                } catch (e) {
                                                    alert("Error cargando código fuente.");
                                                }
                                            }}
                                            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded transition-colors w-full"
                                        >
                                            Abrir Guía Manual (Flattened Code)
                                        </button>
                                    </div>
                                ) : (
                                    <div className="bg-gray-900 p-6 rounded-xl border border-yellow-500/30">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-xl font-bold text-yellow-400">Guía de Verificación Manual</h3>
                                            <button onClick={() => setShowVerifyModal(false)} className="text-gray-400 hover:text-white">✕</button>
                                        </div>

                                        <ol className="list-decimal list-inside space-y-3 text-gray-300 mb-6 text-sm">
                                            <li>Ve a <a href={`${explorerUrl}/verifyContract?a=${token.contract_address}`} target="_blank" className="text-blue-400 underline">PolygonScan Verify</a>.</li>
                                            <li><strong>Compiler Type:</strong> Solidity (Single file).</li>
                                            <li><strong>Compiler Version:</strong> v0.8.33+commit...</li>
                                            <li><strong>License:</strong> MIT.</li>
                                            <li><strong>Optimization:</strong> Yes (200 runs).</li>
                                            <li><strong>Source Code:</strong> Copia y pega TODO esto:</li>
                                        </ol>

                                        <div className="relative">
                                            <textarea
                                                readOnly
                                                value={flatCode || "Cargando código..."}
                                                className="w-full h-48 bg-black text-xs text-green-400 font-mono p-4 rounded border border-gray-700"
                                            />
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(flatCode);
                                                    alert("Código Copiado!");
                                                }}
                                                className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1 rounded"
                                            >
                                                Copiar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                }

                {
                    activeTab === 'growth' && (
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-2xl font-bold mb-4 text-green-400">Herramientas de Crecimiento</h2>
                                <p className="text-gray-400 mb-6">Utiliza estas herramientas para distribuir tu token y aumentar tu comunidad.</p>

                                {/* Socials Editor */}
                                {isOwner && (
                                    <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 mb-8">
                                        <h3 className="text-lg font-bold text-white mb-4">📢 Redes Sociales del Proyecto</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <input
                                                type="text"
                                                placeholder="Twitter URL"
                                                value={socials.twitter}
                                                onChange={(e) => setSocials({ ...socials, twitter: e.target.value })}
                                                className="bg-gray-800 border border-gray-600 rounded p-2 text-white"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Telegram URL"
                                                value={socials.telegram}
                                                onChange={(e) => setSocials({ ...socials, telegram: e.target.value })}
                                                className="bg-gray-800 border border-gray-600 rounded p-2 text-white"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Website URL"
                                                value={socials.website}
                                                onChange={(e) => setSocials({ ...socials, website: e.target.value })}
                                                className="bg-gray-800 border border-gray-600 rounded p-2 text-white"
                                            />
                                        </div>
                                        <button
                                            onClick={handleSaveSocials}
                                            disabled={savingSocials}
                                            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white font-semibold"
                                        >
                                            {savingSocials ? 'Guardando...' : 'Guardar Redes'}
                                        </button>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    <LiquidityWizard
                                        tokenAddress={token.contract_address as `0x${string}`}
                                        tokenSymbol={token.ticker}
                                        onPoolFound={setLpAddress}
                                    />



                                    {/* CHART LINK */}
                                    {/* CHART LINK - REMOVED, now embedded below */}
                                </div>

                                {/* LIQUIDITY LOCKER */}
                                <div className="mb-8">
                                    <LiquidityLocker defaultTokenAddress={lpAddress} />
                                </div>

                                {/* DEXSCREENER EMBED - REMOVED FROM HERE */}




                                {/* WHALE WATCHER & HOLDERS */}
                                <div className="mb-6 space-y-4">
                                    <h3 className="text-xl font-bold mb-4 text-blue-400">📊 Monitorización Avanzada</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <a
                                            href={`https://polygonscan.com/token/${token.contract_address}#balances`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-gray-800 p-4 rounded-lg flex items-center gap-4 hover:bg-gray-700 transition-colors border border-gray-700 hover:border-purple-500"
                                        >
                                            <div className="text-2xl">👥</div>
                                            <div>
                                                <h4 className="font-bold text-white">Top Holders</h4>
                                                <p className="text-xs text-gray-400">Ver lista oficial en Explorador</p>
                                            </div>
                                        </a>
                                        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                                            <h4 className="font-bold text-white mb-2 flex items-center gap-2">🐋 Alertas de Ballenas</h4>
                                            <WhaleWatcher tokenAddress={token.contract_address as `0x${string}`} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Airdrop Tool */}
                            <div className="bg-gray-900 p-6 rounded-xl border border-gray-700">
                                <h3 className="text-xl font-bold text-white mb-4">🎁 Super Airdrop Tool</h3>
                                <p className="text-sm text-gray-400 mb-4">
                                    Envía tokens a hasta 100 direcciones simultáneamente. El contrato optimizado ahorra hasta un 40% de gas.
                                    <br />
                                    Formato: <code>Direccion,Cantidad</code> (una por línea).
                                </p>

                                <textarea
                                    className="w-full h-40 bg-gray-800 text-white p-4 rounded font-mono text-sm border border-gray-600 focus:ring-green-500 focus:border-green-500"
                                    placeholder={`0x123...abc, 100\n0x456...def, 500`}
                                    id="airdropInput"
                                />

                                <button
                                    onClick={async () => {
                                        const input = (document.getElementById('airdropInput') as HTMLTextAreaElement).value;
                                        if (!input) return alert("Introduce direcciones");

                                        const lines = input.split('\n').filter(l => l.trim());
                                        const recipients: `0x${string}`[] = [];
                                        const amounts: bigint[] = [];

                                        try {
                                            lines.forEach(line => {
                                                const [addr, amt] = line.split(',').map(s => s.trim());
                                                if (!addr.startsWith('0x')) throw new Error(`Direccion inválida: ${addr}`);
                                                recipients.push(addr as `0x${string}`);
                                                // Assume amount is in tokens, convert to wei
                                                amounts.push(BigInt(Math.floor(Number(amt) * 10 ** 18)));
                                            });

                                            // Trigger Write
                                            writeContract({
                                                address: token.contract_address as `0x${string}`,
                                                abi: TOKEN_ABI,
                                                functionName: 'multisend',
                                                args: [recipients, amounts],
                                            });

                                        } catch (e: any) {
                                            alert("Error en formato: " + e.message);
                                        }
                                    }}
                                    className="mt-4 px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded w-full transition-transform active:scale-95"
                                >
                                    🚀 Ejecutar Airdrop
                                </button>
                            </div>
                        </div>
                    )}
            </div>
        </div >
    );
}
