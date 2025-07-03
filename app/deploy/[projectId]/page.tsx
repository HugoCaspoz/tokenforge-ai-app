// En: app/deploy/[projectId]/page.tsx

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
// El nombre de tu componente cliente, asegúrate de que sea el correcto
import { DeployClient } from '@/components/DeployClient'; 

export interface ProjectForDeploy {
  id: number;
  name: string;
  ticker: string;
  supply: number | null;
  is_paid: boolean; // Pasamos el estado de pago al cliente
}

export default async function DeployPage({ params }: { params: { projectId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: project, error } = await supabase
    .from('projects')
    .select('id, name, ticker, supply, is_paid') // Asegúrate de seleccionar is_paid
    .eq('id', params.projectId)
    .eq('user_id', user.id)
    .single();

  /**
   * ✅ CORRECCIÓN: Eliminamos la comprobación de `!project.is_paid`.
   * Ahora solo redirigimos si el proyecto no se encuentra o hay un error.
   */
  if (error || !project) {
    console.error("Error al buscar el proyecto:", error);
    redirect('/dashboard');
  }

  // El componente cliente se encargará de mostrar las opciones de pago o de despliegue
  // basándose en si `project.is_paid` es true o false.
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <main className="max-w-xl w-full">
        <DeployClient project={project} />
      </main>
    </div>
  );
}