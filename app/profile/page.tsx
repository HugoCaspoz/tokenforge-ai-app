import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { ProfileClient } from '@/components/ProfileClient';
import { PLAN_DETAILS, NETWORK_NAMES } from '@/lib/plans'; // ✅ Importamos nuestra nueva configuración

// ✅ Tipos de datos actualizados para reflejar la nueva estructura
export interface UserProfile {
  plan_activo: keyof typeof PLAN_DETAILS; // 'free', 'basic', 'pro'
  subscripcion_activa_hasta: string | null;
}

export interface DeployedToken {
  name: string;
  ticker: string;
  chain_id: string;
  contract_address: string;
}

// ✅ Nuevo tipo para los datos de uso que pasaremos al cliente
export interface NetworkUsage {
  networkName: string;
  deployed: number;
  limit: number;
}

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan_activo, subscripcion_activa_hasta')
    .eq('id', user.id)
    .single<UserProfile>();

  const { data: deployedTokens } = await supabase
    .from('projects')
    .select('name, ticker, chain_id, contract_address')
    .eq('user_id', user.id)
    .not('contract_address', 'is', null);

  // ✅ LÓGICA CLAVE: Procesamos los datos en el servidor
  const activePlanKey = profile?.plan_activo || 'free';
  const planLimits = PLAN_DETAILS[activePlanKey].limits;

  // Contamos cuántos tokens se han desplegado en cada red
  const deploymentsByNetwork: { [key: string]: number } = {};
  if (deployedTokens) {
    for (const token of deployedTokens) {
      deploymentsByNetwork[token.chain_id] = (deploymentsByNetwork[token.chain_id] || 0) + 1;
    }
  }

  // Creamos el array de uso para pasarlo al cliente
  const usageData: NetworkUsage[] = Object.keys(planLimits).map(chainId => ({
    networkName: NETWORK_NAMES[chainId as keyof typeof NETWORK_NAMES] || 'Red Desconocida',
    deployed: deploymentsByNetwork[chainId as keyof typeof deploymentsByNetwork] || 0,
    limit: planLimits[chainId as keyof typeof planLimits],
  }));

  return (
    <div className="min-h-screen bg-gray-900 text-white flex justify-center p-4 pt-32">
      <main className="w-full max-w-4xl">
        <ProfileClient 
          profile={profile}
          deployedTokens={deployedTokens as DeployedToken[] || []}
          usage={usageData} // ✅ Pasamos los datos de uso ya calculados
        />
      </main>
    </div>
  );
}