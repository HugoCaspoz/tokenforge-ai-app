// En: frontend/app/dashboard/page.tsx

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardClient } from '@/components/DashboardClient';

// La interfaz del proyecto no cambia
interface Project {
  id: number;
  name: string;
  ticker: string;
  logo_url: string | null;
  is_paid: boolean;
}

export default async function DashboardPage({ searchParams }: { searchParams: { payment: string } }) {
  const supabase = createClient();

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
  
  const paymentSuccess = searchParams?.payment === 'success';

  // Pasamos los datos al componente de cliente para que los renderice.
  return <DashboardClient projects={projects || []} paymentSuccess={paymentSuccess} />;
}
