'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAccount } from 'wagmi';

interface FavoriteButtonProps {
    projectId: number;
    className?: string;
}

export default function FavoriteButton({ projectId, className = "" }: FavoriteButtonProps) {
    // const supabase = createClient(); // REMOVED
    const { address } = useAccount();
    const [isFavorite, setIsFavorite] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const checkFavorite = async () => {
            if (!address) return;

            const { createClient } = await import('@/utils/supabase/client');
            const supabase = createClient();

            // Get user ID from auth
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('favorites')
                .select('id')
                .eq('project_id', projectId)
                .eq('user_id', user.id)
                .single();

            if (data) setIsFavorite(true);
        };

        checkFavorite();
    }, [address, projectId]);

    const toggleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!address) {
            alert("Conecta tu wallet para guardar favoritos.");
            return;
        }

        setLoading(true);

        const { createClient } = await import('@/utils/supabase/client');
        const supabase = createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert("Debes iniciar sesión para guardar favoritos.");
            setLoading(false);
            return;
        }

        if (isFavorite) {
            // Remove
            const { error } = await supabase
                .from('favorites')
                .delete()
                .eq('project_id', projectId)
                .eq('user_id', user.id);

            if (!error) setIsFavorite(false);
        } else {
            // Add
            const { error } = await supabase
                .from('favorites')
                .insert({
                    project_id: projectId,
                    user_id: user.id
                });

            if (!error) setIsFavorite(true);
        }
        setLoading(false);
    };

    return (
        <button
            onClick={toggleFavorite}
            disabled={loading}
            className={`transition-transform active:scale-95 ${className}`}
            title={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
        >
            {isFavorite ? (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-red-500">
                    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.312 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
            ) : (
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400 hover:text-red-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
            )}
        </button>
    );
}
