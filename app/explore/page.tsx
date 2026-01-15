'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import FavoriteButton from '@/components/FavoriteButton';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/i18n';

interface Project {
    id: number;
    name: string;
    ticker: string;
    logo_url: string | null;
    contract_address: string;
    chain_id: string;
    description: string | null;
    is_renounced: boolean;
    is_locked: boolean;
    locked_until: string | null;
    twitter_url: string | null;
    telegram_url: string | null;
    website_url: string | null;
    market_cap: number;
    volume_24h: number;
    price_change_24h: number;
    liquidity_usd: number;
    created_at: string;
}

export default function ExplorePage() {
    const { t } = useTranslation();
    // const supabase = createClient(); // REMOVED
    const [projects, setProjects] = useState<Project[]>([]);
    const [favorites, setFavorites] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({
        security: [] as string[], // Changed to array for multi-select
        sort: 'newest' as 'newest' | 'volume' | 'marketcap' | 'gainers' | 'trust_score'
    });

    const getTrustScore = (p: Project) => {
        let score = 0;
        if (p.is_renounced) score += 40;
        if (p.locked_until && new Date(p.locked_until) > new Date()) score += 40;
        if (p.twitter_url || p.telegram_url || p.website_url) score += 20;
        return score;
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            // 1. Trigger background market data update (fire and forget)
            fetch('/api/market-data').catch(console.error);

            const { createClient } = await import('@/utils/supabase/client');
            const supabase = createClient();

            // 2. Fetch Projects
            const projectsQuery = supabase
                .from('projects')
                .select('*')
                .not('contract_address', 'is', null);

            // 3. Fetch Favorites (if user is logged in)
            const { data: { user } } = await supabase.auth.getUser();
            let userFavorites = new Set<number>();

            if (user) {
                const { data: favs } = await supabase
                    .from('favorites')
                    .select('project_id')
                    .eq('user_id', user.id);

                if (favs) {
                    userFavorites = new Set(favs.map(f => f.project_id));
                }
            }

            const { data, error } = await projectsQuery;
            if (error) {
                console.error(error);
            } else {
                setProjects(data || []);
                setFavorites(userFavorites);
            }
            setLoading(false);
        };

        fetchData();
    }, []);

    // Filter and Sort Logic
    const filteredProjects = projects.filter(p => {
        // Multi-select AND logic
        if (filter.security.length > 0) {
            if (filter.security.includes('favorites') && !favorites.has(p.id)) return false;
            if (filter.security.includes('renounced') && !p.is_renounced) return false;
            if (filter.security.includes('locked')) {
                if (!p.locked_until) return false;
                if (new Date(p.locked_until) <= new Date()) return false;
            }
            if (filter.security.includes('safe')) {
                // Safe = Renounced + Locked
                const isRenounced = p.is_renounced;
                const isLocked = p.locked_until && new Date(p.locked_until) > new Date();
                if (!isRenounced || !isLocked) return false;
            }
        }
        return true;
    }).sort((a, b) => {
        switch (filter.sort) {
            case 'volume': return (b.volume_24h || 0) - (a.volume_24h || 0);
            case 'marketcap': return (b.market_cap || 0) - (a.market_cap || 0);
            case 'gainers': return (b.price_change_24h || 0) - (a.price_change_24h || 0);
            case 'trust_score': return getTrustScore(b) - getTrustScore(a);
            default: return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(); // Newest
        }
    });

    const toggleFilter = (type: string) => {
        if (type === 'all') {
            setFilter({ ...filter, security: [] });
            return;
        }

        const newSecurity = filter.security.includes(type)
            ? filter.security.filter(t => t !== type)
            : [...filter.security, type];

        setFilter({ ...filter, security: newSecurity });
    };

    // getTrustScore moved up

    return (
        <div className="min-h-screen bg-gray-900 text-white pt-24 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-4">{t('explore.title')}</h1>
                    <p className="text-gray-400">{t('explore.subtitle')}</p>
                </div>

                {/* Controls */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8 bg-gray-800 p-4 rounded-xl border border-gray-700">
                    {/* Security Filters */}
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
                        <button
                            onClick={() => toggleFilter('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${filter.security.length === 0 ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                        >
                            {t('common.all')}
                        </button>
                        <button
                            onClick={() => toggleFilter('safe')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${filter.security.includes('safe') ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                        >
                            {t('explore.filters.safe')}
                        </button>
                        <button
                            onClick={() => toggleFilter('renounced')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${filter.security.includes('renounced') ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                        >
                            {t('explore.filters.renounced')}
                        </button>
                        <button
                            onClick={() => toggleFilter('locked')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${filter.security.includes('locked') ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                        >
                            {t('explore.filters.locked')}
                        </button>
                        <button
                            onClick={() => toggleFilter('favorites')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${filter.security.includes('favorites') ? 'bg-pink-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                        >
                            {t('explore.filters.favorites')}
                        </button>
                    </div>

                    {/* Sort */}
                    <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
                        <span className="text-gray-400 text-sm whitespace-nowrap">{t('explore.sortBy')}:</span>
                        <select
                            value={filter.sort}
                            onChange={(e) => setFilter({ ...filter, sort: e.target.value as any })}
                            className="bg-gray-900 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2.5 flex-1 md:flex-none"
                        >
                            <option value="newest">{t('explore.sortOptions.newest')}</option>
                            <option value="volume">{t('explore.sortOptions.volume')}</option>
                            <option value="marketcap">{t('explore.sortOptions.marketcap')}</option>
                            <option value="gainers">{t('explore.sortOptions.gainers')}</option>
                            <option value="trust_score">{t('explore.sortOptions.trust_score')}</option>
                        </select>
                    </div>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProjects.map((project) => {
                            const trustScore = getTrustScore(project);
                            const isPositive = (project.price_change_24h || 0) >= 0;

                            return (
                                <motion.div
                                    key={project.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/10 group relative"
                                >
                                    {/* Trust Score Badge */}
                                    <div className={`absolute top-14 right-4 px-2 py-1 rounded text-xs font-bold border ${trustScore >= 80 ? 'bg-green-900/80 text-green-400 border-green-500/50' : trustScore >= 50 ? 'bg-yellow-900/80 text-yellow-400 border-yellow-500/50' : 'bg-red-900/80 text-red-400 border-red-500/50'}`}>
                                        {t('explore.trustScore')}: {trustScore}/100
                                    </div>
                                    <div className="absolute top-4 right-4 z-10">
                                        <FavoriteButton projectId={project.id} />
                                    </div>

                                    {/* Header */}
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-14 h-14 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-600 group-hover:scale-105 transition-transform">
                                            {project.logo_url ? (
                                                <img src={project.logo_url} alt={project.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-2xl text-gray-400">{project.ticker[0]}</span>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg leading-tight">{project.name}</h3>
                                            <span className="text-sm text-purple-400 font-mono">${project.ticker}</span>
                                        </div>
                                    </div>

                                    {/* Market Data */}
                                    <div className="grid grid-cols-2 gap-2 mb-4 bg-gray-900/50 p-3 rounded-lg">
                                        <div>
                                            <p className="text-xs text-gray-500">Market Cap</p>
                                            <p className="font-mono text-sm font-semibold">${(project.market_cap || 0).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">{t('explore.volume24h')}</p>
                                            <p className="font-mono text-sm font-semibold">${(project.volume_24h || 0).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">{t('explore.liquidity')}</p>
                                            <p className="font-mono text-sm font-semibold">${(project.liquidity_usd || 0).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">{t('explore.change24h')}</p>
                                            <p className={`font-mono text-sm font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                                {isPositive ? '▲' : '▼'} {(project.price_change_24h || 0).toFixed(2)}%
                                            </p>
                                        </div>
                                    </div>

                                    {/* Badges */}
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {project.is_renounced && (
                                            <span className="bg-green-900/30 text-green-400 border border-green-500/30 px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
                                                {t('explore.badges.renounced')}
                                            </span>
                                        )}
                                        {project.locked_until && new Date(project.locked_until) > new Date() && (
                                            <span className="bg-blue-900/30 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
                                                Lock: {new Date(project.locked_until).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>

                                    {/* Social Icons */}
                                    <div className="flex gap-2 mb-3 justify-end">
                                        {/* Removed top social icons to avoid duplication and clutter, keeping only the footer ones with SVGs */}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 mt-auto">
                                        <a
                                            href={`https://dapp.quickswap.exchange/swap/best/MATIC/${project.contract_address}?chainId=${parseInt(project.chain_id, 16)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-2 rounded text-center transition-colors"
                                        >
                                            {t('explore.buy')}
                                        </a>
                                        <Link
                                            href={`/token/${project.contract_address}`}
                                            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold py-2 rounded text-center transition-colors"
                                        >
                                            {t('explore.viewDetails')}
                                        </Link>
                                    </div>

                                    {/* Socials */}
                                    <div className="flex justify-center gap-3 mt-4 border-t border-gray-700/50 pt-3">
                                        {project.twitter_url && (
                                            <a href={project.twitter_url} target="_blank" className="text-gray-400 hover:text-white transition-colors" title="Twitter / X">
                                                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
                                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                                </svg>
                                            </a>
                                        )}
                                        {project.telegram_url && (
                                            <a href={project.telegram_url} target="_blank" className="text-gray-400 hover:text-blue-400 transition-colors" title="Telegram">
                                                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
                                                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 11.944 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                                                </svg>
                                            </a>
                                        )}
                                        {project.website_url && (
                                            <a href={project.website_url} target="_blank" className="text-gray-400 hover:text-purple-400 transition-colors" title="Website">
                                                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                                                </svg>
                                            </a>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {!loading && filteredProjects.length === 0 && (
                    <div className="text-center py-20 text-gray-500">
                        {t('explore.noResults')}
                    </div>
                )}
            </div>
        </div>
    );
}
