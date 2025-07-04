// En: app/token/[contractAddress]/page.tsx

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { AirdropClient } from '@/components/AirdropClient'; // Crearemos este componente a continuación

// Definimos la información que pasaremos al componente
export interface TokenForAirdrop {
  contract_address: string;
  chain_id: string;
  name: string;
  ticker: string;
}

export default async function ManageTokenPage({ params }: { params: { contractAddress: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Buscamos el proyecto que corresponde a esta dirección de contrato y a este usuario
  const { data: project, error } = await supabase
    .from('projects')
    .select('name, ticker, chain_id, contract_address')
    .eq('contract_address', params.contractAddress)
    .eq('user_id', user.id)
    .single();

  if (error || !project) {
    console.error("Error: Proyecto no encontrado o no pertenece al usuario.", error);
    return redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex justify-center p-4 pt-32">
      <main className="w-full max-w-2xl">
        <AirdropClient token={project as TokenForAirdrop} />
      </main>
    </div>
  );
}