// En: app/token/[contractAddress]/page.tsx

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { AirdropClient } from '@/components/AirdropClient';

// Esta interfaz ya no es necesaria aquí, ya que pasamos las props directamente.
// export interface TokenForAirdrop { ... }

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
        {/* ✅ CORRECCIÓN: Pasamos las props de la forma que AirdropClient espera.
          - contractAddress viene de la URL (params).
          - tokenSymbol viene del 'ticker' del proyecto.
          - tokenDecimals se asume como 18, que es el estándar para la mayoría de tokens.
        */}
        <AirdropClient 
          contractAddress={params.contractAddress}
          tokenSymbol={project.ticker}
          tokenDecimals={18} 
        />
      </main>
    </div>
  );
}
