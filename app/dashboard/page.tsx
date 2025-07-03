// En: frontend/app/dashboard/page.tsx

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardClient } from '@/components/DashboardClient';

/**
 * 1. Definimos un tipo explícito y robusto para las props de la página.
 * Esta es la forma recomendada por Next.js para evitar errores de tipos.
 */
type Props = {
  searchParams: { [key: string]: string | string[] | undefined };
};

// 2. Usamos el nuevo tipo 'Props' en la firma de la función.
export default async function DashboardPage({ searchParams }: Props) {
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
    // Opcional: podrías mostrar un estado de error en la UI en lugar de una lista vacía.
  }
  
  const paymentSuccess = searchParams.payment === 'success';

  return <DashboardClient projects={projects || []} paymentSuccess={paymentSuccess} />;
}