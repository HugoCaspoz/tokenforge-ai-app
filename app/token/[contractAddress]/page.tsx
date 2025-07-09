import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { AirdropClient } from '@/components/AirdropClient';

// Esta interfaz define la "plantilla" de datos que le pasamos al componente cliente.
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

  // Creamos un objeto 'token' limpio que coincide con la interfaz que espera el componente.
  const token: TokenForAirdrop = {
    name: project.name,
    ticker: project.ticker,
    chain_id: project.chain_id!,
    contract_address: project.contract_address!,
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex justify-center p-4 pt-32">
      <main className="w-full max-w-2xl">
        {/* ✅ CORRECCIÓN: Ahora la llamada es correcta porque el componente AirdropClient
            espera una única prop llamada 'token' que contiene toda la información.
        */}
        <AirdropClient token={token} />
      </main>
    </div>
  );
}
