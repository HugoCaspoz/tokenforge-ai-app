// En: frontend/app/dashboard/page.tsx

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardClient } from '@/components/DashboardClient';

type Props = {
  searchParams: { [key: string]: string | string[] | undefined };
};

export default async function DashboardPage({ searchParams }: Props) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // ✅ CORRECCIÓN: Se añaden 'contract_address' y 'chain_id' a la consulta.
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, name, ticker, logo_url, is_paid, contract_address, chain_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
  }
  
  const paymentSuccess = searchParams.payment === 'success';

  return <DashboardClient projects={projects || []} paymentSuccess={paymentSuccess} />;
}