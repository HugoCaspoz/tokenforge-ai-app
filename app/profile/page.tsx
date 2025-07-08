import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { ProfileClient } from '@/components/ProfileClient'; // Crearemos este componente a continuación

// Definimos los tipos de datos que pasaremos
export interface UserProfile {
  plan_activo: string;
  subscripcion_activa_hasta: string | null;
}

export interface DeployedToken {
  name: string;
  ticker: string;
  chain_id: string;
  contract_address: string;
}

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Obtenemos el perfil del usuario (plan, etc.)
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan_activo, subscripcion_activa_hasta')
    .eq('id', user.id)
    .single();

  // Obtenemos todos los tokens que el usuario ya ha desplegado
  const { data: deployedTokens } = await supabase
    .from('projects')
    .select('name, ticker, chain_id, contract_address')
    .eq('user_id', user.id)
    .not('contract_address', 'is', null); // Filtramos solo los que tienen una dirección

  return (
    <div className="min-h-screen bg-gray-900 text-white flex justify-center p-4 pt-32">
      <main className="w-full max-w-4xl">
        <ProfileClient 
          profile={profile as UserProfile} 
          deployedTokens={deployedTokens as DeployedToken[]} 
        />
      </main>
    </div>
  );
}
