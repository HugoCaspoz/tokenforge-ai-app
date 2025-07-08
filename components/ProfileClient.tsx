'use client';

import { useState } from 'react';
import type { UserProfile, DeployedToken } from '@/app/profile/page';

// Definimos los límites y características de cada plan
const planDetails = {
  free: { name: 'Free', limit: 0 },
  basic: { name: 'Basic', limit: 2 },
  pro: { name: 'Pro', limit: 5 },
  advanced: { name: 'Advanced', limit: 10 },
};

const explorers = {
  '0x89': 'https://polygonscan.com',
  '0x38': 'https://bscscan.com',
  '0x1':  'https://etherscan.io',
};

interface ProfileClientProps {
  profile: UserProfile;
  deployedTokens: DeployedToken[];
}

export function ProfileClient({ profile, deployedTokens }: ProfileClientProps) {
  const [loading, setLoading] = useState(false);

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/create-customer-portal-session', {
        method: 'POST',
      });
      const { url, error } = await response.json();
      if (error) { throw new Error(error); }
      window.location.href = url;
    } catch (err) {
      console.error(err);
      // Aquí podrías mostrar un error con un toast
    }
    setLoading(false);
  };

  const currentPlan = planDetails[profile.plan_activo as keyof typeof planDetails] || planDetails.free;
  const tokensDeployedCount = deployedTokens.length;

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold">Mi Perfil</h1>

      {/* Sección de Suscripción */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">Mi Suscripción</h2>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-lg">Plan Actual: <span className="font-bold text-purple-400">{currentPlan.name}</span></p>
            {profile.subscripcion_activa_hasta && (
              <p className="text-sm text-gray-400">
                Tu plan se renueva el: {new Date(profile.subscripcion_activa_hasta).toLocaleDateString()}
              </p>
            )}
          </div>
          <button
            onClick={handleManageSubscription}
            disabled={loading}
            className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-500 transition-colors disabled:bg-gray-500"
          >
            {loading ? 'Cargando...' : 'Gestionar Suscripción'}
          </button>
        </div>
        <div className="mt-4">
            <p className="text-sm text-gray-300">Despliegues este mes: {tokensDeployedCount} / {currentPlan.limit}</p>
            <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${(tokensDeployedCount / currentPlan.limit) * 100}%` }}></div>
            </div>
        </div>
      </div>

      {/* Sección de Tokens Desplegados */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">Mis Tokens Desplegados</h2>
        <div className="space-y-3">
          {deployedTokens.length > 0 ? (
            deployedTokens.map((token) => (
              <div key={token.contract_address} className="flex justify-between items-center bg-gray-700 p-3 rounded-md">
                <div>
                  <p className="font-bold">{token.name} (${token.ticker})</p>
                  <p className="text-xs font-mono text-gray-400">{token.contract_address}</p>
                </div>
                <a
                  href={`${explorers[token.chain_id as keyof typeof explorers]}/address/${token.contract_address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-purple-400 hover:underline"
                >
                  Ver en Explorador &rarr;
                </a>
              </div>
            ))
          ) : (
            <p className="text-gray-400">Aún no has desplegado ningún token en una red principal.</p>
          )}
        </div>
      </div>
    </div>
  );
}
