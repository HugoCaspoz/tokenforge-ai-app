'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import TokenDashboard from '@/components/TokenDashboard';

interface Props {
    params: {
        address: string;
    };
}

export default function PublicTokenPage({ params }: Props) {
    const [token, setToken] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchToken = async () => {
            const supabase = createClient();
            const { address } = params;

            const { data, error } = await supabase
                .from('projects')
                .select('id, name, ticker, logo_url, contract_address, chain_id, description, twitter_url, telegram_url, website_url, user_id')
                .eq('contract_address', address)
                .single();

            if (error || !data) {
                setError('Token not found');
                setLoading(false);
                return;
            }

            setToken(data);
            setLoading(false);
        };

        fetchToken();
    }, [params.address]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 pt-20 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    if (error || !token) {
        return (
            <div className="min-h-screen bg-gray-900 pt-20 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-400 mb-4">Error</h1>
                    <p className="text-gray-400">{error || 'Token not found'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 pt-20">
            <TokenDashboard token={token} />
        </div>
    );
}
