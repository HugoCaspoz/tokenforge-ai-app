import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { AirdropClient } from '@/components/AirdropClient';

// ✅ PASO 1: Ajusta esta interfaz para que sea EXACTAMENTE igual a la de AirdropClient.
// Cambiamos 'ticker' por 'symbol' y añadimos 'decimals'.
export interface TokenForAirdrop {
  contract_address: string;
  chain_id: string;
  name: string;
  symbol: string; 
  decimals: number; 
}

export default async function ManageTokenPage({ params }: { params: { contractAddress: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // ✅ PASO 2: Ajusta la consulta a Supabase para que pida 'symbol' y 'decimals'.
  // Nota: Asegúrate de que tu tabla 'projects' en Supabase tiene columnas llamadas 'symbol' y 'decimals'.
  // Si tu columna se llama 'ticker', puedes seleccionarla y renombrarla abajo.
  const { data: project, error } = await supabase
    .from('projects')
    .select('name, symbol, decimals, chain_id, contract_address') 
    .eq('contract_address', params.contractAddress)
    .eq('user_id', user.id)
    .single();

  if (error || !project) {
    console.error("Error: Proyecto no encontrado o no pertenece al usuario.", error);
    return redirect('/dashboard');
  }

  // ✅ PASO 3: Creamos el objeto 'token' con las propiedades correctas.
  const token: TokenForAirdrop = {
    name: project.name,
    symbol: project.symbol!, // <-- Usamos 'symbol' en lugar de 'ticker'
    decimals: project.decimals!, // <-- Añadimos 'decimals'
    chain_id: project.chain_id!,
    contract_address: project.contract_address!,
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex justify-center p-4 pt-32">
      <main className="w-full max-w-2xl">
        <AirdropClient token={token} />
      </main>
    </div>
  );
}