// En: frontend/app/dashboard/page.tsx

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface Project {
  id: number;
  name: string;
  ticker: string;
  logo_url: string | null;
  is_paid: boolean;
}

export default async function DashboardPage({ searchParams }: { searchParams: { payment: string } }) {
  const supabase = createServerComponentClient({ cookies });
  
  // CAMBIO 1: Usamos getUser() en lugar de getSession() para mayor seguridad.
  const { data: { user } } = await supabase.auth.getUser();

  // Si no hay un usuario verificado, redirigimos al login.
  if (!user) {
    redirect('/login');
  }

  // Ahora la consulta usa user.id
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, name, ticker, logo_url, is_paid')
    .eq('user_id', user.id) // Usamos el ID del usuario verificado
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
  }

  const paymentSuccess = searchParams.payment === 'success';

  return (
    <div className="min-h-screen bg-gray-900 text-white pt-24">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {paymentSuccess && (
          <div className="bg-green-500/20 border border-green-500 text-green-300 px-4 py-3 rounded-lg relative mb-6" role="alert">
            <strong className="font-bold">¡Pago completado! </strong>
            <span className="block sm:inline">Tu proyecto ha sido activado. Ahora puedes desplegarlo en Mainnet.</span>
          </div>
        )}

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Mis Proyectos</h1>
          <Link href="/create" className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-lg">
            + Crear Nuevo Token
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {projects && projects.length > 0 ? (
            projects.map((project: Project) => (
              <div key={project.id} className={`bg-gray-800 rounded-lg p-4 flex flex-col items-center text-center ring-1 ${project.is_paid ? 'ring-green-500' : 'ring-white/10'} relative`}>
                {project.is_paid && (
                  <span className="absolute top-2 right-2 text-xs bg-green-500 text-white font-bold px-2 py-1 rounded-full">PAGADO</span>
                )}
                <div className="w-24 h-24 mb-4 rounded-full bg-gray-700 flex items-center justify-center">
                  {project.logo_url ? (
                    <Image src={project.logo_url} alt={`Logo de ${project.name}`} width={96} height={96} className="rounded-full" />
                  ) : (
                    <span className="text-4xl">🪙</span>
                  )}
                </div>
                <h2 className="text-lg font-bold">{project.name}</h2>
                <p className="text-sm text-gray-400 bg-gray-700 px-2 py-1 rounded-full mt-1">${project.ticker.toUpperCase()}</p>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 bg-gray-800 rounded-lg">
              <h2 className="text-xl font-semibold">No tienes proyectos todavía</h2>
              <p className="text-gray-400 mt-2">¡Empieza a crear tu primer token ahora!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}