'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // ✅ Importamos el router de Next.js
import type { UserProfile, DeployedToken, NetworkUsage } from '@/app/profile/page'; 
import { PLAN_DETAILS } from '@/lib/plans';

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
  usage: NetworkUsage[];
}

export function ProfileClient({ profile, deployedTokens, usage }: ProfileClientProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter(); // ✅ Inicializamos el router

  // ✅ Función inteligente que decide qué hacer al hacer clic
  const handleSubscriptionClick = async () => {
    // Si el usuario no tiene plan o es el gratuito, lo enviamos a la página de precios
    if (!profile?.plan_activo || profile.plan_activo === 'free') {
      router.push('/subscription');
      return;
    }

    // Si ya tiene un plan de pago, lo enviamos al portal de Stripe
    setLoading(true);
    try {
      const response = await fetch('/api/create-customer-portal-session', { method: 'POST' });
      const { url, error } = await response.json();
      if (error) { throw new Error(error); }
      window.location.href = url;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      alert(`Hubo un error: ${errorMessage}`); // Puedes cambiar esto por una notificación más elegante
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center">
            <p className="text-yellow-400">No se pudo cargar tu perfil. Inténtalo de nuevo más tarde.</p>
        </div>
    );
  }

  const currentPlanName = PLAN_DETAILS[profile.plan_activo]?.name || 'Sin Suscripción';
  const isFreePlan = !profile.plan_activo || profile.plan_activo === 'free';

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold">Mi Perfil</h1>

      {/* Sección de Suscripción */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">Mi Suscripción</h2>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-lg">Plan Actual: <span className="font-bold text-purple-400">{currentPlanName}</span></p>
            {/* ✅ Mostramos la fecha de renovación si existe y no es el plan gratuito */}
            {profile.subscripcion_activa_hasta && !isFreePlan && (
              <p className="text-sm text-gray-400 mt-1">
                Tu plan se renueva el: {new Date(profile.subscripcion_activa_hasta).toLocaleDateString()}
              </p>
            )}
          </div>
          {/* ✅ Botón dinámico que cambia de texto y de función */}
          <button 
            onClick={handleSubscriptionClick} 
            disabled={loading} 
            className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-500 transition-colors disabled:bg-gray-500"
          >
            {loading ? 'Cargando...' : (isFreePlan ? 'Elegir un Plan' : 'Gestionar Suscripción')}
          </button>
        </div>
      </div>
      
      {/* Sección de Uso por Red */}
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

      {/* Sección de Tokens Desplegados */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">Mis Tokens Desplegados</h2>
        {deployedTokens.length > 0 ? (
            <ul className="space-y-2">
                {deployedTokens.map(token => (
                    <li key={token.contract_address} className="flex justify-between items-center bg-gray-700 p-3 rounded-md">
                        <div>
                            <span className="font-bold">{token.name}</span>
                            <span className="text-sm text-gray-400 ml-2">${token.ticker.toUpperCase()}</span>
                        </div>
                        {/* Puedes añadir más detalles o enlaces al explorador si quieres */}
                    </li>
                ))}
            </ul>
        ) : (
            <p className="text-gray-400">Aún no has desplegado ningún token.</p>
        )}
      </div>
    </div>
  );
}