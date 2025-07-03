// En: frontend/app/deploy/[projectId]/page.tsx
// ¡Este archivo ya está correcto! No necesita cambios.

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { DeployClient } from '@/components/DeployClient';

export interface ProjectForDeploy {
  id: number;
  name: string;
  ticker: string;
  supply: number | null;
}

// Esta firma de función ya es la correcta, por eso no da error.
export default async function DeployPage({ params }: { params: { projectId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: project, error } = await supabase
    .from('projects')
    .select('id, name, ticker, supply, is_paid')
    .eq('id', params.projectId)
    .eq('user_id', user.id)
    .single();

  if (error || !project || !project.is_paid) {
    console.error("Error al buscar el proyecto o el proyecto no está pagado:", error);
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <main className="max-w-xl w-full">
        <DeployClient project={project as ProjectForDeploy} />
      </main>
    </div>
  );
}