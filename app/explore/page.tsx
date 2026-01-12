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
}

export default function ExplorePage() {
    const supabase = createClient();
    const [projects, setProjects] = useState<Project[]>([]);
    const [filter, setFilter] = useState<'all' | 'renounced' | 'locked'>('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            setLoading(true);
            let query = supabase
                .from('projects')
                .select('*')
                .not('contract_address', 'is', null)
                .order('created_at', { ascending: false });

            if (filter === 'renounced') {
                query = query.eq('is_renounced', true);
            } else if (filter === 'locked') {
                query = query.eq('is_locked', true);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching projects:', error);
            } else {
                setProjects(data || []);
            }
            setLoading(false);
        };

        fetchProjects();
    }, [filter]);

    return (
        <div className="min-h-screen bg-gray-900 text-white pt-24 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-4">Explorar Tokens</h1>
                    <p className="text-gray-400">Descubre los proyectos más recientes lanzados en TokenCrafter.</p>
                </div>

                {/* Filters */}
                <div className="flex justify-center gap-4 mb-12">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-6 py-2 rounded-full font-semibold transition-colors ${filter === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setFilter('renounced')}
                        className={`px-6 py-2 rounded-full font-semibold transition-colors ${filter === 'renounced' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                        Renunciados ✅
                    </button>
                    <button
                        onClick={() => setFilter('locked')}
                        className={`px-6 py-2 rounded-full font-semibold transition-colors ${filter === 'locked' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                        Liquidez Bloqueada 🔒
                    </button>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map((project) => (
                            <motion.div
                                key={project.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-purple-500/50 transition-colors"
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-600">
                                        {project.logo_url ? (
                                            <img src={project.logo_url} alt={project.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xl text-gray-400">{project.ticker[0]}</span>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{project.name}</h3>
                                        <span className="text-sm text-purple-400">${project.ticker}</span>
                                    </div>
                                </div>

                                <p className="text-gray-400 text-sm mb-4 line-clamp-2 h-10">
                                    {project.description || "Sin descripción."}
                                </p>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    <span className="bg-gray-700 px-2 py-1 rounded text-xs text-gray-300">
                                        {project.chain_id === '0x89' ? 'Polygon' : 'Unknown Chain'}
                                    </span>
                                    {project.is_renounced && (
                                        <span className="bg-green-900/50 text-green-400 border border-green-500/30 px-2 py-1 rounded text-xs">
                                            Renunciado
                                        </span>
                                    )}
                                    {project.is_locked && (
                                        <span className="bg-blue-900/50 text-blue-400 border border-blue-500/30 px-2 py-1 rounded text-xs">
                                            Bloqueado
                                        </span>
                                    )}
                                </div>

                                <Link
                                    href={`/token/${project.contract_address}`} // Assuming you have a public token view page, otherwise link to explorer or dashboard if owner
                                    className="block w-full text-center py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors text-white text-sm font-semibold"
                                >
                                    Ver Detalles
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}

                {!loading && projects.length === 0 && (
                    <div className="text-center py-20 text-gray-500">
                        No se encontraron proyectos con estos filtros.
                    </div>
                )}
            </div>
        </div>
    );
}
