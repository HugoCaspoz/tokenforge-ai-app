'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { createClient } from '@/utils/supabase/client';
import { NETWORK_NAMES, NETWORK_EXPLORERS } from '@/lib/plans';

import { TOKEN_ABI } from '@/lib/tokenArtifacts';
import { NETWORK_RPCS } from '@/lib/plans';
import LiquidityWizard from './LiquidityWizard';
import LiquidityLocker from './LiquidityLocker';
import WhaleWatcher from './WhaleWatcher';
import FavoriteButton from './FavoriteButton';
import SnapshotView from './SnapshotView';
import AirdropTool from './AirdropTool';
import { useHolders } from '@/hooks/useHolders';
import LockedContentManager from './LockedContentManager';
import { useTranslation } from '@/lib/i18n';

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
    const { t } = useTranslation();
    // const supabase = createClient(); // MOVED INSIDE FUNCTION TO AVOID SERVER CRASH
    const { address: userAddress, isConnected } = useAccount();
    const [activeTab, setActiveTab] = useState<'overview' | 'admin' | 'growth' | 'community'>('overview');
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [flatCode, setFlatCode] = useState("");
    const [apiKey, setApiKey] = useState("");
    const [lpAddress, setLpAddress] = useState<string>("");
    const [selectedForAirdrop, setSelectedForAirdrop] = useState<string[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Holders Data
    const rpcUrl = NETWORK_RPCS[token.chain_id as keyof typeof NETWORK_RPCS];
    const { holders, loading: loadingHolders } = useHolders(token.contract_address, rpcUrl);

    // Socials State
    const [socials, setSocials] = useState({
        twitter: token.twitter_url || '',
        telegram: token.telegram_url || '',
        website: token.website_url || ''
    });
    const [savingSocials, setSavingSocials] = useState(false);

    const handleSaveSocials = async () => {
        setSavingSocials(true);
        const { createClient } = await import('@/utils/supabase/client');
        const supabase = createClient();

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

    // Contract Existence Check (Polling for Propagation) - DISABLED
    const contractAddress = token.contract_address;
    // const publicClient = usePublicClient({ chainId: Number(token.chain_id) }); // Removed to avoid potential unnecessary calls

    // We assume contract is ready since we are in management page.
    // If it's not ready, the READ hooks will just return undefined/error which is fine.
    const isContractReady = true;

    // Read Token Info (Only if ready)
    const { data: tokenName, refetch: refetchName } = useReadContract({
        address: contractAddress as `0x${string}`,
        abi: TOKEN_ABI,
        functionName: 'name',
        chainId: Number(token.chain_id),
    });

    const { data: tokenSymbol, refetch: refetchSymbol } = useReadContract({
        address: contractAddress as `0x${string}`,
        abi: TOKEN_ABI,
        functionName: 'symbol',
        chainId: Number(token.chain_id),
    });

    const { data: totalSupply, refetch: refetchSupply, error: supplyError } = useReadContract({
        address: contractAddress as `0x${string}`,
        abi: TOKEN_ABI,
        functionName: 'totalSupply',
        chainId: Number(token.chain_id),
    });

    const { data: balanceOf, refetch: refetchBalance } = useReadContract({
        address: contractAddress as `0x${string}`,
        abi: TOKEN_ABI,
        functionName: 'balanceOf',
        args: [userAddress as `0x${string}`],
        chainId: Number(token.chain_id),
        query: { enabled: !!userAddress }
    });

    const { data: ownerAddress, refetch: refetchOwner, error: ownerError } = useReadContract({
        address: contractAddress as `0x${string}`,
        abi: TOKEN_ABI,
        functionName: 'owner',
        chainId: Number(token.chain_id),
    });

    // Effect to refetch once ready - Removed as we fetch immediately

    if (ownerError) console.error("Owner Fetch Error:", ownerError);
    if (supplyError) console.error("Supply Fetch Error:", supplyError);

    const isLoading = false; // We can use derived state if needed

    // Subscription State
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loadingSubscription, setLoadingSubscription] = useState(true);

    useEffect(() => {
        const checkSubscription = async () => {
            const { createClient } = await import('@/utils/supabase/client');
            const supabase = createClient();

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('projects') // Typo in original? No, profiles.
                    .select('plan_activo') // Check original code... it was from 'profiles'
                // Wait, original code said .from('profiles'). Let's double check.
                // Yes, line 213 is from('profiles').
                // Let's rewrite safely.
                // }
            }
        };
        // Re-writing the whole useEffect block safely
        const runCheck = async () => {
            const { createClient } = await import('@/utils/supabase/client');
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('plan_activo').eq('id', user.id).single();
                const plan = profile?.plan_activo || 'free';
                setIsSubscribed(plan !== 'free');
            }
            setLoadingSubscription(false);
        }
        runCheck();
    }, []);

    // Derived State
    const isOwner = userAddress && ownerAddress && userAddress.toLowerCase() === ownerAddress.toLowerCase();
    const canManage = isOwner && isSubscribed;
    const networkName = NETWORK_NAMES[token.chain_id as keyof typeof NETWORK_NAMES] || 'Unknown Network';
    const explorerUrl = NETWORK_EXPLORERS[token.chain_id as keyof typeof NETWORK_EXPLORERS];

    const handleRenounceOwnership = async () => {
        if (!canManage) return;

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
                    const { createClient } = await import('@/utils/supabase/client');
                    const supabase = createClient();
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

    if (!mounted) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mb-4"></div>
        </div>
    );

    return (
        <div className="w-full max-w-6xl mx-auto p-6">


            {/* Header */}
            <div className="flex flex-col md:flex-row items-center gap-6 mb-8 bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg relative text-center md:text-left">
                <div className="absolute top-4 right-4">
                    {mounted && <FavoriteButton projectId={token.id} />}
                </div>
                <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden border-4 border-gray-600 shrink-0">
                    {token.logo_url ? <img src={token.logo_url} alt="Logo" className="w-full h-full object-cover" /> : <span className="text-4xl text-gray-400">{token.ticker[0]}</span>}
                </div>
                <div className="w-full">
                    <h1 className="text-3xl md:text-4xl font-bold text-white flex flex-col md:flex-row items-center gap-2 md:gap-3 justify-center md:justify-start">
                        {token.name} <span className="text-gray-400 text-xl md:text-2xl font-normal">${token.ticker}</span>
                    </h1>
                    <p className="text-blue-400 font-mono mt-1">{token.contract_address}</p>
                    <div className="flex gap-2 mt-3 flex-wrap">
                        <span className="bg-gray-700 px-3 py-1 rounded text-sm text-gray-300">Network: {networkName}</span>
                        {mounted && isOwner ? (
                            <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded text-sm border border-green-500/30">{t('tokenDetail.youAreOwner')}</span>
                        ) : mounted && (
                            <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded text-sm border border-yellow-500/30">{t('tokenDetail.viewOnly')}</span>
                        )}

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
                            {t('tokenDetail.buyNow')}
                        </a>
                        {/* Error Debug Badge */}
                        {(ownerError || supplyError) && (
                            <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded text-sm border border-red-500/30" title={String(ownerError || supplyError)}>
                                {t('tokenDetail.readError')}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Subscription Warning */}
            {
                isOwner && !isSubscribed && !loadingSubscription && (
                    <div className="mb-6 bg-yellow-500/10 border border-yellow-500/50 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">🔒</span>
                            <div>
                                <h3 className="font-bold text-yellow-400">{t('dashboard.subscriptionPaused')}</h3>
                                <p className="text-sm text-gray-400">{t('dashboard.subscriptionPausedDesc')}</p>
                            </div>
                        </div>
                        <a
                            href="/subscription"
                            className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded transition-colors whitespace-nowrap"
                        >
                            {t('dashboard.reactivateSubscription')}
                        </a>
                    </div>
                )
            }

            {/* Tabs */}
            {/* Tabs - Only visible if canManage (Owner + Subscribed) */}
            {
                canManage && (
                    <div className="flex gap-4 border-b border-gray-700 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                        {['overview', 'admin', 'growth', 'community'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-6 py-3 font-semibold capitalize transition-colors whitespace-nowrap ${activeTab === tab ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                )
            }

            {/* Content */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 min-h-[400px]">
                {activeTab === 'overview' && (
                    <div>
                        <h2 className="text-2xl font-bold mb-4">{t('tokenDetail.projectSummary')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-2">{t('tokenDetail.description')}</h3>
                                <p className="text-gray-200 bg-gray-900 p-4 rounded text-sm leading-relaxed">{token.description || t('tokenDetail.noDescription')}</p>
                            </div>
                            <div>
                                <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-2">{t('tokenDetail.onChainStats')}</h3>
                                <div className="bg-gray-900 p-4 rounded space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Total Supply:</span>
                                        <span className="font-mono text-white">
                                            {totalSupply ? (Number(totalSupply) / 10 ** 18).toLocaleString('en-US') : 'Cargando...'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-t border-gray-800 pt-2 mt-2">
                                        <span className="text-gray-400">Tu Balance:</span>
                                        <span className="font-mono text-green-400 font-bold">
                                            {balanceOf ? (Number(balanceOf) / 10 ** 18).toLocaleString('en-US') : '0'}
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
                                        {t('tokenDetail.viewOnPolygon').replace('Polygon', networkName)} ↗
                                    </a>

                                    {/* Download Logo Button */}
                                    <button
                                        onClick={handleDownloadLogo}
                                        disabled={!token.logo_url}
                                        className="mt-3 block w-full text-center py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded transition-colors text-gray-300 text-sm flex items-center justify-center gap-2"
                                    >
                                        <span>⬇️</span> {t('tokenDetail.downloadLogo')}
                                    </button>
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
                            <h2 className="text-2xl font-bold mb-4 text-red-400">{t('tokenDetail.admin.title')}</h2>
                            {!isOwner && (
                                <div className="bg-red-500/20 border border-red-500 text-red-200 p-4 rounded mb-6">
                                    {t('tokenDetail.admin.notOwnerWarning')}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="border border-gray-600 p-6 rounded-lg opacity-75">
                                    <h3 className="font-bold text-lg mb-2">{t('tokenDetail.admin.transferOwnership')}</h3>
                                    <p className="text-sm text-gray-400 mb-4">{t('tokenDetail.admin.transferDesc')}</p>
                                    <input type="text" placeholder="0x..." className="w-full bg-gray-900 border border-gray-600 rounded p-2 mb-3 text-white" disabled={!isOwner} />
                                    <button disabled={!isOwner} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 rounded text-white font-semibold w-full">{t('tokenDetail.admin.transfer')}</button>
                                </div>

                                <div className="border border-red-600/50 p-6 rounded-lg bg-red-900/10">
                                    <h3 className="font-bold text-lg mb-2 text-red-400">{t('tokenDetail.admin.ownershipTitle')}</h3>
                                    <p className="text-sm text-gray-400 mb-4">
                                        {t('tokenDetail.admin.renounceCommunityDesc')}
                                    </p>
                                    <button
                                        onClick={handleRenounceOwnership}
                                        disabled={!isOwner || isRenouncing}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 rounded text-white font-semibold w-full"
                                    >
                                        {isRenouncing ? t('tokenDetail.admin.renouncing') : t('tokenDetail.admin.renounceOwnership')}
                                    </button>
                                </div>
                            </div>

                            {/* Verification Section */}
                            {/* Verification Section */}
                            <div className="mt-8 border-t border-gray-700 pt-8">
                                <h3 className="text-xl font-bold mb-6 text-yellow-400">{t('tokenDetail.admin.verification')}</h3>

                                {/* AUTO VERIFY (New) */}
                                <div className="bg-blue-900/20 border border-blue-500/50 p-6 rounded-xl mb-8">
                                    <h4 className="font-bold text-lg text-blue-300 mb-2 flex items-center gap-2">
                                        <span>🤖</span> {t('tokenDetail.admin.autoVerification')}
                                    </h4>
                                    <p className="text-sm text-gray-400 mb-4">
                                        {t('tokenDetail.admin.autoVerificationDesc')}
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
                                                            initialSupplyRaw: totalSupply ? totalSupply.toString() : "1000000000000000000000000",
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
                                            {t('tokenDetail.admin.verifyNow')}
                                        </button>
                                    </div>
                                    <div className="mt-2 text-right">
                                        <a href="https://docs.etherscan.io/getting-an-api-key" target="_blank" className="text-xs text-blue-400 underline hover:text-white">{t('tokenDetail.admin.getApiKey')}</a>
                                    </div>
                                </div>

                                <h4 className="font-bold text-gray-400 mb-4 border-b border-gray-700 pb-2">{t('tokenDetail.admin.orManual')}</h4>

                                {!showVerifyModal ? (
                                    <div>
                                        <p className="text-gray-400 mb-4 text-sm">{t('tokenDetail.admin.manualNoApiKey')}</p>
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
                                            {t('tokenDetail.admin.openManualGuide')}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="bg-gray-900 p-6 rounded-xl border border-yellow-500/30">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-xl font-bold text-yellow-400">{t('tokenDetail.admin.manualGuide')}</h3>
                                            <button onClick={() => setShowVerifyModal(false)} className="text-gray-400 hover:text-white">✕</button>
                                        </div>

                                        <ol className="list-decimal list-inside space-y-3 text-gray-300 mb-6 text-sm">
                                            <li>Ve a <a href={`${explorerUrl}/verifyContract?a=${token.contract_address}`} target="_blank" className="text-blue-400 underline">PolygonScan Verify</a>.</li>
                                            <li><strong>Compiler Type:</strong> {t('tokenDetail.admin.manualSteps.step2')}</li>
                                            <li><strong>Compiler Version:</strong> {t('tokenDetail.admin.manualSteps.step3')}</li>
                                            <li><strong>License:</strong> {t('tokenDetail.admin.manualSteps.step4')}</li>
                                            <li><strong>Optimization:</strong> {t('tokenDetail.admin.manualSteps.step5')}</li>
                                            <li><strong>Source Code:</strong> {t('tokenDetail.admin.manualSteps.step6')}</li>
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
                                                    alert(t('tokenDetail.admin.codeCopied'));
                                                }}
                                                className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1 rounded"
                                            >
                                                {t('tokenDetail.admin.copy')}
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
                                <h2 className="text-2xl font-bold mb-4 text-green-400">{t('tokenDetail.growth.title')}</h2>
                                <p className="text-gray-400 mb-6">{t('tokenDetail.growth.subtitle')}</p>

                                {/* 2-Column Desktop Layout */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                                    {/* LEFT COLUMN (MetaData & Monitoring) - 40% */}
                                    <div className="lg:col-span-5 space-y-8">
                                        {/* Socials Editor */}
                                        {isOwner && (
                                            <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700">
                                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                                    <span>📢</span> {t('tokenDetail.growth.socials')}
                                                </h3>
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="text-xs text-gray-400 block mb-1">Twitter (X)</label>
                                                        <input
                                                            type="text"
                                                            placeholder="https://x.com/..."
                                                            value={socials.twitter}
                                                            onChange={(e) => setSocials({ ...socials, twitter: e.target.value })}
                                                            className="w-full bg-black/40 border border-gray-700 rounded p-2 text-white text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-400 block mb-1">Telegram</label>
                                                        <input
                                                            type="text"
                                                            placeholder="https://t.me/..."
                                                            value={socials.telegram}
                                                            onChange={(e) => setSocials({ ...socials, telegram: e.target.value })}
                                                            className="w-full bg-black/40 border border-gray-700 rounded p-2 text-white text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-400 block mb-1">Website</label>
                                                        <input
                                                            type="text"
                                                            placeholder="https://project.com"
                                                            value={socials.website}
                                                            onChange={(e) => setSocials({ ...socials, website: e.target.value })}
                                                            className="w-full bg-black/40 border border-gray-700 rounded p-2 text-white text-sm"
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={handleSaveSocials}
                                                        disabled={savingSocials}
                                                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded text-white font-semibold text-sm transition-colors"
                                                    >
                                                        {savingSocials ? t('tokenDetail.growth.saving') : t('tokenDetail.growth.saveNetworks')}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Monitoring */}
                                        <div>
                                            <h3 className="text-xl font-bold mb-4 text-blue-400">{t('tokenDetail.growth.monitoring')}</h3>
                                            <div className="space-y-4">
                                                <a
                                                    href={`https://polygonscan.com/token/${token.contract_address}#balances`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="bg-gray-800 p-4 rounded-lg flex items-center gap-4 hover:bg-gray-700 transition-colors border border-gray-700 hover:border-purple-500 group"
                                                >
                                                    <div className="text-2xl group-hover:scale-110 transition-transform">👥</div>
                                                    <div>
                                                        <h4 className="font-bold text-white">{t('tokenDetail.growth.topHolders')}</h4>
                                                        <p className="text-xs text-gray-400">{t('tokenDetail.growth.viewOnExplorer')}</p>
                                                    </div>
                                                </a>
                                                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                                                    <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                                                        <span>🐋</span> {t('tokenDetail.growth.whaleAlerts')}
                                                    </h4>
                                                    <WhaleWatcher tokenAddress={token.contract_address as `0x${string}`} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* RIGHT COLUMN (Liquidity Tools) - 60% */}
                                    <div className="lg:col-span-7 space-y-8">
                                        <div className="relative">
                                            {/* Glow Effect */}
                                            <div className="absolute -inset-1 bg-purple-500/20 rounded-xl blur-lg opacity-50 pointer-events-none"></div>
                                            <LiquidityWizard
                                                tokenAddress={token.contract_address as `0x${string}`}
                                                tokenSymbol={token.ticker}
                                                onPoolFound={setLpAddress}
                                            />
                                        </div>

                                        <div className="pt-4 border-t border-gray-800">
                                            <LiquidityLocker defaultTokenAddress={lpAddress} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    )
                }

                {
                    activeTab === 'community' && (
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-2xl font-bold mb-4 text-pink-400">{t('tokenDetail.community.title')}</h2>
                                <p className="text-gray-400 mb-6">{t('tokenDetail.community.snapshot')}</p>

                                {/* Locked Content Section (Moved to Top) */}
                                <div className="mb-8 border-b border-gray-800 pb-8">
                                    <LockedContentManager projectId={token.id} />
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Left Column: Snapshot */}
                                    <div className="lg:col-span-2">
                                        <h3 className="text-xl font-bold text-white mb-4">{t('tokenDetail.community.snapshotTitle')}</h3>
                                        <SnapshotView
                                            holders={holders}
                                            loading={loadingHolders}
                                            onSelectForAirdrop={setSelectedForAirdrop}
                                        />
                                    </div>

                                    {/* Right Column: Airdrop Tool */}
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-4">{t('tokenDetail.community.airdropTitle')}</h3>
                                        <AirdropTool
                                            tokenAddress={token.contract_address}
                                            selectedAddresses={selectedForAirdrop}
                                        />

                                        <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl mt-6">
                                            <h4 className="font-bold text-blue-300 mb-2">{t('tokenDetail.community.proTipTitle')}</h4>
                                            <p className="text-sm text-gray-400">
                                                {t('tokenDetail.community.proTipDesc')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div>
        </div >
    );
}
