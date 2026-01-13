import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import dynamic from 'next/dynamic';
const TokenDashboard = dynamic(() => import('@/components/TokenDashboard'), { ssr: false });

export default async function ManageTokenPage({ params }: { params: { address: string } }) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value, ...options });
                    } catch (error) {
                        // Ignored
                    }
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value: '', ...options });
                    } catch (error) {
                        // Ignored
                    }
                },
            },
        }
    );

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
