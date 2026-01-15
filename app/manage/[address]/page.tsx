import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import TokenDashboard from '@/components/TokenDashboard';

export default async function ManageTokenPage({ params }: { params: { address: string } }) {
    const supabase = createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }

    // Fetch token
    const { data: token, error } = await supabase
        .from('projects')
        .select('*')
        .eq('contract_address', params.address)
        .eq('user_id', user.id)
        .single();

    if (error || !token) {
        return (
            <main className="min-h-screen bg-gray-900 text-white pt-24 pb-12 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-400 mb-4">Error</h1>
                    <p className="text-gray-400">Token not found or you do not have permission to manage it.</p>
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
