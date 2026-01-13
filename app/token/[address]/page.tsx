import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';

const TokenDashboard = dynamic(() => import('@/components/TokenDashboard'), { ssr: false });

interface Props {
    params: {
        address: string;
    };
}

export default async function PublicTokenPage({ params }: Props) {
    const supabase = createClient();
    const { address } = params;

    const { data: token, error } = await supabase
        .from('projects')
        .select('id, name, ticker, logo_url, contract_address, chain_id, description, twitter_url, telegram_url, website_url, user_id')
        .eq('contract_address', address)
        .single();

    if (error || !token) {
        return notFound();
    }

    return (
        <div className="min-h-screen bg-gray-900 pt-20">
            <TokenDashboard token={token} />
        </div>
    );
}
