// En: frontend/app/deploy/[projectId]/page.tsx
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DeployClient } from '@/components/DeployClient';

export interface ProjectForDeploy {
  id: number;
  name: string;
  ticker: string;
  supply: number | null;
}

export default async function DeployPage({ params }: { params: { projectId: string } }) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
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
