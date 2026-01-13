'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
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
    const supabase = createClient();
    const { address: userAddress, isConnected } = useAccount();
    const [activeTab, setActiveTab] = useState<'overview' | 'admin' | 'growth' | 'community'>('overview');
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [flatCode, setFlatCode] = useState("");
    const [apiKey, setApiKey] = useState("");
    const [lpAddress, setLpAddress] = useState<string>("");
    const [selectedForAirdrop, setSelectedForAirdrop] = useState<string[]>([]);

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


    if (ownerError) console.error("Owner Fetch Error:", ownerError);
    if (supplyError) console.error("Supply Fetch Error:", supplyError);

    // Subscription State
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loadingSubscription, setLoadingSubscription] = useState(true);

    useEffect(() => {
        const checkSubscription = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('plan_activo')
                    .eq('id', user.id)
                    .single();

                const plan = profile?.plan_activo || 'free';
                setIsSubscribed(plan !== 'free');
            }
            setLoadingSubscription(false);
        };
        checkSubscription();
    }, [supabase]);

    // Derived State
    const isOwner = userAddress && ownerAddress && userAddress.toLowerCase() === ownerAddress.toLowerCase();
    const canManage = isOwner && isSubscribed;
    const networkName = NETWORK_NAMES[token.chain_id as keyof typeof NETWORK_NAMES] || 'Unknown Network';
    const explorerUrl = NETWORK_EXPLORERS[token.chain_id as keyof typeof NETWORK_EXPLORERS];

    const handleRenounceOwnership = async () => {
        if (!canManage) return;
        // ... (rest of handleRenounceOwnership)

        // ... (inside return)

        {/* Subscription Warning */ }
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

        {/* Tabs */ }
        {/* Tabs - Only visible if canManage (Owner + Subscribed) */ }
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

        {/* Content */ }
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
                                <h3 className="font-bold text-lg mb-2 text-red-400">{t('tokenDetail.admin.renounceOwnership')}</h3>
                                <p className="text-sm text-gray-400 mb-4">{t('tokenDetail.admin.renounceDesc')}</p>
                                <button disabled={!isOwner} className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 rounded text-white font-semibold w-full">{t('tokenDetail.admin.renounce')}</button>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-2">{t('dashboard.tabs.community')}</h3>
                                <p className="text-sm text-gray-400 mb-4">{t('tokenDetail.admin.communityNote')}</p>
                                <button
                                    onClick={handleRenounceOwnership}
                                    disabled={!isOwner || isRenouncing}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 rounded text-white font-semibold w-full"
                                >
                                    {isRenouncing ? t('tokenDetail.admin.renouncing') : t('tokenDetail.admin.renounceIrreversible')}
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
                                    <a href="https://docs.etherscan.io/getting-an-api-key" target="_blank" className="text-xs text-blue-400 underline hover:text-white">Conseguir API Key (Gratis)</a>
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

                            {/* Socials Editor */}
                            {isOwner && (
                                <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 mb-8">
                                    <h3 className="text-lg font-bold text-white mb-4">{t('tokenDetail.growth.socials')}</h3>
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
                                        {savingSocials ? t('tokenDetail.growth.saving') : t('tokenDetail.growth.saveNetworks')}
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
                                <h3 className="text-xl font-bold mb-4 text-blue-400">{t('tokenDetail.growth.monitoring')}</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <a
                                        href={`https://polygonscan.com/token/${token.contract_address}#balances`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-gray-800 p-4 rounded-lg flex items-center gap-4 hover:bg-gray-700 transition-colors border border-gray-700 hover:border-purple-500"
                                    >
                                        <div className="text-2xl">👥</div>
                                        <div>
                                            <h4 className="font-bold text-white">{t('tokenDetail.growth.topHolders')}</h4>
                                            <p className="text-xs text-gray-400">{t('tokenDetail.growth.viewOnExplorer')}</p>
                                        </div>
                                    </a>
                                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                                        <h4 className="font-bold text-white mb-2 flex items-center gap-2">{t('tokenDetail.growth.whaleAlerts')}</h4>
                                        <WhaleWatcher tokenAddress={token.contract_address as `0x${string}`} />
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

                            {/* Locked Content Section */}
                            <div className="mt-8">
                                <LockedContentManager projectId={token.id} />
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
        </div >
    );
}
