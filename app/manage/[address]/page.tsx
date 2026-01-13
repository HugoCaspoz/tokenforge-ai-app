'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import TokenDashboard from '@/components/TokenDashboard';

export default function ManageTokenPage({ params }: { params: { address: string } }) {
    const [token, setToken] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchToken = async () => {
            const supabase = createClient();

            // Check auth
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // Fetch token
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .eq('contract_address', params.address)
                .eq('user_id', user.id)
                .single();

            if (error || !data) {
                setError('Token not found or you do not have permission to manage it.');
                setLoading(false);
                return;
            }

            setToken(data);
            setLoading(false);
        };

        fetchToken();
    }, [params.address, router]);

    if (loading) {
        return (
            <main className="min-h-screen bg-gray-900 text-white pt-24 pb-12 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
            </main>
        );
    }

    if (error || !token) {
        return (
            <main className="min-h-screen bg-gray-900 text-white pt-24 pb-12 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-400 mb-4">Error</h1>
                    <p className="text-gray-400">{error || 'Token not found'}</p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-900 text-white pt-24 pb-12">
            <TokenDashboard token={token} />
        </main>
    );
}
