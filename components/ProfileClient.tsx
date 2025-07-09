'use client';

import { useState } from 'react';
// ✅ Importamos los tipos actualizados desde la página
import type { UserProfile, DeployedToken, NetworkUsage } from '@/app/profile/page'; 
import { PLAN_DETAILS } from '@/lib/plans'; // Importamos solo los detalles para el nombre

const explorers = {
  'Polygon': 'https://polygonscan.com',
  'BNB Chain': 'https://bscscan.com',
  'Ethereum': 'https://etherscan.io',
};

// Mapeo inverso de nombre a chain_id para buscar en los exploradores
const networkNameToChainId: { [key: string]: string } = {
  'Polygon': '0x89',
  'BNB Chain': '0x38',
  'Ethereum': '0x1',
};

interface ProfileClientProps {
  profile: UserProfile | null;
  deployedTokens: DeployedToken[];
  usage: NetworkUsage[]; // ✅ Recibimos el uso por red
}

export function ProfileClient({ profile, deployedTokens, usage }: ProfileClientProps) {
  const [loading, setLoading] = useState(false);

  const handleManageSubscription = async () => {
    setLoading(true);
    // ... (tu lógica para el portal de cliente se mantiene igual)
    try {
      const response = await fetch('/api/create-customer-portal-session', { method: 'POST' });
      const { url, error } = await response.json();
      if (error) { throw new Error(error); }
      window.location.href = url;
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    // ... (tu estado de error se mantiene igual)
    return <p>No se pudo cargar el perfil.</p>;
  }

  const currentPlanName = PLAN_DETAILS[profile.plan_activo]?.name || 'Sin Suscripción';

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold">Mi Perfil</h1>

      {/* Sección de Suscripción */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">Mi Suscripción</h2>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-lg">Plan Actual: <span className="font-bold text-purple-400">{currentPlanName}</span></p>
            {/* ... (lógica de la fecha se mantiene) ... */}
          </div>
          <button onClick={handleManageSubscription} disabled={loading} className="...">
            {loading ? 'Cargando...' : 'Gestionar Suscripción'}
          </button>
        </div>
      </div>
      
      {/* ✅ NUEVA Sección de Uso por Red */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">Uso de Despliegues</h2>
        <div className="space-y-4">
          {usage.filter(n => n.limit > 0).length > 0 ? (
            usage.filter(n => n.limit > 0).map(network => (
              <div key={network.networkName}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold">{network.networkName}</span>
                  <span className="text-sm text-gray-300">{network.deployed} / {network.limit}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${(network.deployed / network.limit) * 100}%` }}></div>
                </div>
              </div>
            ))
          ) : (
             <p className="text-gray-400">Tu plan actual no incluye despliegues en redes principales. <a href="/subscription" className="text-purple-400 hover:underline">¡Mejora tu plan!</a></p>
          )}
        </div>
      </div>

      {/* Sección de Tokens Desplegados (se mantiene casi igual) */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">Mis Tokens Desplegados</h2>
        {/* ... (Tu código para listar los tokens desplegados es correcto y puede mantenerse aquí) ... */}
      </div>
    </div>
  );
}