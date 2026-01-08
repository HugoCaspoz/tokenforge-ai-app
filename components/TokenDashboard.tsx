'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { createClient } from '@/utils/supabase/client';
import { NETWORK_NAMES, NETWORK_EXPLORERS } from '@/lib/plans';

import { TOKEN_ABI } from '@/lib/tokenArtifacts';
import LiquidityWizard from './LiquidityWizard';
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
    };
}

export default function TokenDashboard({ token }: TokenDashboardProps) {
    const supabase = createClient();
    const { address: userAddress, isConnected } = useAccount();
    const [activeTab, setActiveTab] = useState<'overview' | 'admin' | 'growth'>('overview');
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [flatCode, setFlatCode] = useState("");
    const [apiKey, setApiKey] = useState("");

    useEffect(() => {
        const savedKey = localStorage.getItem('polygonScanApiKey');
        if (savedKey) setApiKey(savedKey);
    }, []);

    const { writeContract, isPending: isAirdropPending, error: airdropError } = useWriteContract();

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
                    <div className="flex gap-2 mt-3">
                        <span className="bg-gray-700 px-3 py-1 rounded text-sm text-gray-300">Network: {networkName}</span>
                        {isOwner ? (
                            <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded text-sm border border-green-500/30">Eres el Owner</span>
                        ) : (
                            <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded text-sm border border-yellow-500/30">Solo Vista (No eres Owner)</span>
                        )}
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
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'admin' && (
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
                                    onClick={() => alert("Función de renuncia no implementada en UI por seguridad. Usar Remix si es necesario.")}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded text-white font-semibold w-full opacity-50 cursor-not-allowed"
                                >
                                    Renunciar (Próximamente)
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
                )}

                {activeTab === 'growth' && (
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-2xl font-bold mb-4 text-green-400">Herramientas de Crecimiento</h2>
                            <p className="text-gray-400 mb-6">Utiliza estas herramientas para distribuir tu token y aumentar tu comunidad.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <LiquidityWizard
                                    tokenAddress={token.contract_address as `0x${string}`}
                                    tokenSymbol={token.ticker}
                                />



                                {/* CHART LINK */}
                                <a
                                    href={`https://dexscreener.com/polygon/${token.contract_address}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-gray-700 p-6 rounded-lg text-center hover:bg-gray-600 transition-colors cursor-pointer block border border-transparent hover:border-blue-500 group relative"
                                    title="Ver Gráfica en DexScreener"
                                >
                                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📈</div>
                                    <h3 className="font-bold text-white">Ver Gráfica</h3>
                                    <p className="text-xs text-gray-300 mt-2">DexScreener</p>
                                    <span className="absolute bottom-2 left-0 w-full text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        (Precio y Velas)
                                    </span>
                                </a>


                                <div className="bg-gray-700 p-6 rounded-lg text-center hover:bg-gray-600 transition-colors cursor-pointer">
                                    <div className="text-4xl mb-3">📢</div>
                                    <h3 className="font-bold">Compartir</h3>
                                    <p className="text-xs text-gray-300 mt-2">Generar imagen para redes</p>
                                </div>
                            </div>

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
        </div>
    );
}
