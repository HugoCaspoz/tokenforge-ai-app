import { createClient } from '@/utils/supabase/server';
import { notFound, redirect } from 'next/navigation';
import TokenDashboard from '@/components/TokenDashboard';

export default async function ManageTokenPage({ params }: { params: { address: string } }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch project details
    // Note: We search by contract_address AND user_id to ensure ownership security (viewing rights)
    // Actually, admins might want to see tokens they don't user-own if they are transferred, 
    // but for this platform "management" implies being the creator or being on the whitelist.
    // For now, only the creator can see the dashboard.
    const { data: token } = await supabase
        .from('projects')
        .select('*')
        .eq('contract_address', params.address)
        .eq('user_id', user.id)
        .single();

    if (!token) {
        // If not found, maybe it exists but belongs to another user? 
        // Secure by default: 404
        notFound();
    }

    return (
        <main className="min-h-screen bg-gray-900 text-white pt-24 pb-12">
            <TokenDashboard token={token} />
        </main>
    );
}
