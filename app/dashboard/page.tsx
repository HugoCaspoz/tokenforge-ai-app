// En: frontend/app/dashboard/page.tsx
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers' // <-- Necesitamos importar cookies aquí
import { redirect } from 'next/navigation';
import { DashboardClient } from '@/components/DashboardClient';

interface Project {
  id: number;
  name: string;
  ticker: string;
  logo_url: string | null;
  is_paid: boolean;
}

export default async function DashboardPage({ searchParams }: { searchParams: { payment: string } }) {
  const cookieStore = cookies() // <-- Obtenemos el cookie store
  const supabase = createClient(cookieStore); // <-- Se lo pasamos al cliente

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, name, ticker, logo_url, is_paid')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
  }
  
  const paymentSuccess = searchParams.payment === 'success';

  return <DashboardClient projects={projects || []} paymentSuccess={paymentSuccess} />;
}
