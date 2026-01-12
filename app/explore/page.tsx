'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { motion } from 'framer-motion';

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
    const supabase = createClient();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({
        security: 'all' as 'all' | 'renounced' | 'locked' | 'safe',
        sort: 'newest' as 'newest' | 'volume' | 'marketcap' | 'gainers'
    });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            // 1. Trigger background market data update (fire and forget)
            fetch('/api/market-data').catch(console.error);

            // 2. Fetch from DB
            let query = supabase
                .from('projects')
                .select('*')
                .not('contract_address', 'is', null);

            const { data, error } = await query;
            if (error) {
                console.error(error);
            } else {
                setProjects(data || []);
            }
            setLoading(false);
        };

        fetchData();
    }, []);

    // Filter and Sort Logic
    const filteredProjects = projects.filter(p => {
        if (filter.security === 'renounced' && !p.is_renounced) return false;
        if (filter.security === 'locked') {
            if (!p.locked_until) return false;
            return new Date(p.locked_until) > new Date();
        }
        if (filter.security === 'safe') {
            // Trust Score > 80 logic (Renounced + Locked)
            const isRenounced = p.is_renounced;
            const isLocked = p.locked_until && new Date(p.locked_until) > new Date();
            return isRenounced && isLocked;
        }
        return true;
    }).sort((a, b) => {
        switch (filter.sort) {
            case 'volume': return (b.volume_24h || 0) - (a.volume_24h || 0);
            case 'marketcap': return (b.market_cap || 0) - (a.market_cap || 0);
            case 'gainers': return (b.price_change_24h || 0) - (a.price_change_24h || 0);
            default: return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(); // Newest
        }
    });

    const getTrustScore = (p: Project) => {
        let score = 0;
        if (p.is_renounced) score += 40;
        if (p.locked_until && new Date(p.locked_until) > new Date()) score += 40;
        if (p.twitter_url || p.telegram_url || p.website_url) score += 20;
        return score;
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white pt-24 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-4">Explorar Tokens</h1>
                    <p className="text-gray-400">Descubre las gemas ocultas en TokenCrafter.</p>
                </div>

                {/* Controls */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8 bg-gray-800 p-4 rounded-xl border border-gray-700">
                    {/* Security Filters */}
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
                        <button onClick={() => setFilter({ ...filter, security: 'all' })} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap ${filter.security === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>Todos</button>
                        <button onClick={() => setFilter({ ...filter, security: 'safe' })} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap ${filter.security === 'safe' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>🛡️ 100% Seguros</button>
                        <button onClick={() => setFilter({ ...filter, security: 'renounced' })} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap ${filter.security === 'renounced' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>Renunciados</button>
                        <button onClick={() => setFilter({ ...filter, security: 'locked' })} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap ${filter.security === 'locked' ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>Liquidez Bloqueada</button>
                    </div>

                    {/* Sort */}
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm">Ordenar por:</span>
                        <select
                            value={filter.sort}
                            onChange={(e) => setFilter({ ...filter, sort: e.target.value as any })}
                            className="bg-gray-900 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2.5"
                        >
                            <option value="newest">Más Recientes</option>
                            <option value="volume">Mayor Volumen (24h)</option>
                            <option value="marketcap">Market Cap</option>
                            <option value="gainers">Top Gainers (%)</option>
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
                                    <div className={`absolute top-4 right-4 px-2 py-1 rounded text-xs font-bold border ${trustScore >= 80 ? 'bg-green-900/80 text-green-400 border-green-500/50' : trustScore >= 50 ? 'bg-yellow-900/80 text-yellow-400 border-yellow-500/50' : 'bg-red-900/80 text-red-400 border-red-500/50'}`}>
                                        Score: {trustScore}/100
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
                                            <p className="text-xs text-gray-500">Volumen 24h</p>
                                            <p className="font-mono text-sm font-semibold">${(project.volume_24h || 0).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Liquidez</p>
                                            <p className="font-mono text-sm font-semibold">${(project.liquidity_usd || 0).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Cambio 24h</p>
                                            <p className={`font-mono text-sm font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                                {isPositive ? '▲' : '▼'} {(project.price_change_24h || 0).toFixed(2)}%
                                            </p>
                                        </div>
                                    </div>

                                    {/* Badges */}
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {project.is_renounced && (
                                            <span className="bg-green-900/30 text-green-400 border border-green-500/30 px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
                                                ✅ Renunciado
                                            </span>
                                        )}
                                        {project.locked_until && new Date(project.locked_until) > new Date() && (
                                            <span className="bg-blue-900/30 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
                                                🔒 Lock: {new Date(project.locked_until).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 mt-auto">
                                        <a
                                            href={`https://quickswap.exchange/#/swap?outputCurrency=${project.contract_address}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-2 rounded text-center transition-colors"
                                        >
                                            Comprar
                                        </a>
                                        <Link
                                            href={`/token/${project.contract_address}`}
                                            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold py-2 rounded text-center transition-colors"
                                        >
                                            Ver Detalles
                                        </Link>
                                    </div>

                                    {/* Socials */}
                                    <div className="flex justify-center gap-3 mt-4 border-t border-gray-700/50 pt-3">
                                        {project.twitter_url && <a href={project.twitter_url} target="_blank" className="text-gray-400 hover:text-blue-400 transition-colors">🐦</a>}
                                        {project.telegram_url && <a href={project.telegram_url} target="_blank" className="text-gray-400 hover:text-blue-300 transition-colors">✈️</a>}
                                        {project.website_url && <a href={project.website_url} target="_blank" className="text-gray-400 hover:text-purple-400 transition-colors">🌐</a>}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {!loading && filteredProjects.length === 0 && (
                    <div className="text-center py-20 text-gray-500">
                        No se encontraron proyectos con estos filtros.
                    </div>
                )}
            </div>
        </div>
    );
}
