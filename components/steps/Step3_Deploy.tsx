// En: frontend/components/steps/Step3_Deploy.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client'; // Importa el cliente de Supabase
import type { TokenData } from '../Wizard';
import Link from 'next/link'; 
// Ya no necesitamos 'ethers', 'loadStripe', 'contractArtifact' para este paso de UI de selección.
// Los importo si handleTestnetDeploy los usa, si no, puedes eliminarlos.

// Define las configuraciones de red, ahora con más detalles para el UI
const networkOptions = [
  {
    id: 'polygon',
    name: 'Polygon',
    description: 'Bajas comisiones y alta velocidad.',
    maxTokensKey: 'polygon_tokens_allowed', // Clave para buscar en el objeto profile de Supabase
    tokensUsedKey: 'polygon_tokens_used', // Clave para buscar en el objeto profile de Supabase
  },
  {
    id: 'bnb',
    name: 'BNB Chain',
    description: 'Acceso a un ecosistema masivo.',
    maxTokensKey: 'bnb_tokens_allowed',
    tokensUsedKey: 'bnb_tokens_used',
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    description: 'La red más segura y prestigiosa.',
    maxTokensKey: 'ethereum_tokens_allowed',
    tokensUsedKey: 'ethereum_tokens_used',
  },
];

interface Step3Props {
  tokenData: TokenData;
}

export default function Step3_Deploy({ tokenData }: Step3Props) {
  const supabase = createClient(); // Cliente de Supabase para obtener el estado del usuario
  const [supply, setSupply] = useState(1000000); // Esto podría seguir aquí para la configuración del token
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [contractAddress, setContractAddress] = useState('');
  const [loadingDeploy, setLoadingDeploy] = useState(false); // Para el despliegue real
  const [selectedNetwork, setSelectedNetwork] = useState(networkOptions[0]); // Estado para la red seleccionada

  // Estado para las capacidades de suscripción del usuario (se llenará desde Supabase)
  const [userProfile, setUserProfile] = useState<any | null>(null); // Guardaremos todo el perfil

  // Efecto para cargar las capacidades del usuario al montar el componente
  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*') // Selecciona todos los campos relevantes de la tabla profiles
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching user profile for capabilities:', profileError);
          setError('No se pudo cargar la información de tu suscripción.');
          return;
        }

        if (profile) {
          setUserProfile(profile);
        }
      } else {
        setError('Necesitas iniciar sesión para ver tus límites de despliegue.');
      }
    };

    fetchUserProfile();
  }, [supabase]); // Dependencia del cliente de Supabase

  // Función para obtener los tokens disponibles para la red seleccionada
  const getTokensAvailable = () => {
    if (!userProfile) return 0; // Si no hay perfil, 0 disponibles

    const allowed = userProfile[selectedNetwork.maxTokensKey] || 0;
    const used = userProfile[selectedNetwork.tokensUsedKey] || 0;
    return allowed - used;
  };

  const handleDeploy = async () => {
    setError('');
    setStatus('');

    if (!userProfile?.is_subscribed) {
      setError('Necesitas una suscripción activa para desplegar en Mainnet.');
      return;
    }

    const tokensAvailable = getTokensAvailable();
    const unlimitedDeployments = userProfile?.unlimited_deployments || false;

    if (tokensAvailable <= 0 && !unlimitedDeployments) {
      setError(`Has alcanzado el límite de tokens para desplegar en ${selectedNetwork.name} con tu plan actual.`);
      return;
    }

    // Validación adicional para redes específicas si el plan no las incluye
    const networkId = selectedNetwork.id;
    if (networkId === 'bnb' && userProfile.active_subscription_plan === 'Basic') {
        setError('Tu plan Basic no permite despliegues en BNB Chain.');
        return;
    }
    if (networkId === 'ethereum' && (userProfile.active_subscription_plan === 'Basic' || userProfile.active_subscription_plan === 'Pro')) {
        setError('Tu plan actual no permite despliegues en Ethereum.');
        return;
    }


    setLoadingDeploy(true);
    try {
      // ✅ Llama a tu endpoint de backend que realmente despliega el token.
      // Este endpoint debe VUELVE A VERIFICAR los límites en el SERVIDOR.
      const response = await fetch('/api/deploy-mainnet-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenData, // Datos del token
          networkId: selectedNetwork.id, // Red seleccionada
          initialSupply: supply, // Suministro
          // userId: user?.id, // Asegúrate de pasar el userId si tu API lo necesita, aunque se puede obtener del token de sesión
          // Otros datos necesarios para el despliegue
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al solicitar el despliegue.');
      }

      setStatus(`Despliegue iniciado para ${selectedNetwork.name}. Dirección de contrato: ${data.contractAddress}`);
      setContractAddress(data.contractAddress);

      // NO ACTUALIZAR LOS CONTADORES AQUÍ DIRECTAMENTE.
      // Los contadores (`_tokens_used`) deben ser actualizados por un WEBHOOK de Stripe
      // o por tu API de `/api/deploy-mainnet-token` *después* de un despliegue exitoso.
      // Luego, la página podría recargarse o el useEffect podría volver a ejecutarse
      // para obtener los datos actualizados de Supabase.
    } catch (err: any) {
      setError(err.message || 'Ha ocurrido un error durante el despliegue.');
    } finally {
      setLoadingDeploy(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Paso 3: Configuración y Lanzamiento</h2>
      <p className="text-gray-400 mb-6">Define la cantidad total de monedas y selecciona la red principal para tu despliegue.</p>

      {/* Mostrar estado de la suscripción actual y límites */}
      <div className="bg-gray-800 p-4 rounded-md mb-6 border border-purple-600">
        <h3 className="text-lg font-semibold text-white mb-2">Tu Plan Actual: <span className="text-purple-400">{userProfile?.active_subscription_plan || 'Ninguno Activo'}</span></h3>
        {!userProfile?.is_subscribed && (
          <p className="text-red-400 mb-2">Actualmente no tienes una suscripción activa. ¡Suscríbete para desplegar en Mainnet!</p>
        )}
        <p className="text-gray-300 text-sm">Tokens restantes por red:</p>
        <ul className="text-gray-400 text-sm list-disc pl-5">
          <li>Polygon: {userProfile?.unlimited_deployments ? 'Ilimitados' : `${(userProfile?.polygon_tokens_allowed || 0) - (userProfile?.polygon_tokens_used || 0)} de ${(userProfile?.polygon_tokens_allowed || 0)}`}</li>
          <li>BNB Chain: {userProfile?.unlimited_deployments ? 'Ilimitados' : `${(userProfile?.bnb_tokens_allowed || 0) - (userProfile?.bnb_tokens_used || 0)} de ${(userProfile?.bnb_tokens_allowed || 0)}`}</li>
          <li>Ethereum: {userProfile?.unlimited_deployments ? 'Ilimitados' : `${(userProfile?.ethereum_tokens_allowed || 0) - (userProfile?.ethereum_tokens_used || 0)} de ${(userProfile?.ethereum_tokens_allowed || 0)}`}</li>
        </ul>
        {/* Enlace a la página de gestión de suscripciones */}
        {!userProfile?.is_subscribed && (
          <p className="mt-3">
             <Link href="/subscription" className="text-purple-300 hover:underline">Gestionar Suscripción aquí</Link>
          </p>
        )}
      </div>

      <div className="mb-6">
        <label htmlFor="supply" className="block text-sm font-medium text-gray-300 mb-2">
          Suministro Total de Monedas (Ej. 1,000,000)
        </label>
        <input
          type="number"
          id="supply"
          value={supply}
          onChange={(e) => setSupply(Number(e.target.value))}
          className="w-full p-3 rounded-md bg-gray-700 border border-gray-600 text-white focus:ring-purple-500 focus:border-purple-500"
          placeholder="Ej. 1000000"
          min="1"
        />
      </div>

      <div className="space-y-4">
        {/* Botón de Testnet (mantener como opción gratuita) */}
        <button
          onClick={() => { /* Lógica de despliegue en Testnet, no usa suscripción. Asume que hay otra función para esto. */ }}
          className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-500 transition-colors"
        >
          🧪 Lanzar en Testnet (Gratis)
        </button>

        <div className="border-t border-gray-700 my-4"></div>

        {/* Selector de Red Principal (Mainnet) */}
        <div className="mb-4">
            <h3 className="text-lg font-semibold text-white mb-3">Elige tu Red Principal (Mainnet):</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {networkOptions.map((network) => {
                    const allowed = (userProfile?.[network.maxTokensKey] || 0) as number;
                    const used = (userProfile?.[network.tokensUsedKey] || 0) as number;
                    const tokensAvailable = allowed - used;
                    const unlimitedDeployments = userProfile?.unlimited_deployments || false;

                    // Lógica para determinar si la red está permitida por el plan actual
                    let isNetworkAllowedByPlan = false;
                    if (network.id === 'polygon' && (userProfile?.active_subscription_plan === 'Basic' || userProfile?.active_subscription_plan === 'Pro' || userProfile?.active_subscription_plan === 'Advanced')) {
                        isNetworkAllowedByPlan = true;
                    } else if (network.id === 'bnb' && (userProfile?.active_subscription_plan === 'Pro' || userProfile?.active_subscription_plan === 'Advanced')) {
                        isNetworkAllowedByPlan = true;
                    } else if (network.id === 'ethereum' && userProfile?.active_subscription_plan === 'Advanced') {
                        isNetworkAllowedByPlan = true;
                    }

                    // Deshabilitar el botón si no está suscrito, si la red no está permitida por el plan
                    // o si no hay tokens disponibles (a menos que sea ilimitado)
                    const isDisabled = !userProfile?.is_subscribed || !isNetworkAllowedByPlan || (!unlimitedDeployments && tokensAvailable <= 0);

                    return (
                        <button
                            key={network.id}
                            onClick={() => setSelectedNetwork(network)}
                            disabled={isDisabled}
                            className={`p-4 rounded-lg border-2 text-left transition-all ${
                                selectedNetwork.id === network.id
                                ? 'border-purple-500 bg-purple-900/50 scale-105'
                                : 'border-gray-600 bg-gray-800 hover:border-gray-500'
                            } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <p className="font-bold text-white">{network.name}</p>
                            <p className="text-xs text-gray-400 mt-2">{network.description}</p>
                            <p className="text-sm mt-2">
                                {isNetworkAllowedByPlan ? (
                                    <>
                                        Tokens disponibles: {unlimitedDeployments ? 'Ilimitados' : `${tokensAvailable}`}
                                    </>
                                ) : (
                                    <span className="text-red-400">No incluido en tu plan</span>
                                )}
                            </p>
                        </button>
                    );
                })}
            </div>
        </div>

        <button
          onClick={handleDeploy}
          disabled={loadingDeploy || !userProfile?.is_subscribed || (getTokensAvailable() <= 0 && !userProfile?.unlimited_deployments) || (selectedNetwork.id === 'bnb' && userProfile?.active_subscription_plan === 'Basic') || (selectedNetwork.id === 'ethereum' && (userProfile?.active_subscription_plan === 'Basic' || userProfile?.active_subscription_plan === 'Pro'))}
          className="w-full px-6 py-4 bg-green-600 text-white font-bold text-lg rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-500"
        >
          {loadingDeploy ? 'Desplegando...' : `🚀 Desplegar en ${selectedNetwork.name}`}
        </button>
      </div>

      {status && <p className="mt-4 text-center text-blue-300 animate-pulse">{status}</p>}
      {error && <p className="mt-4 text-center text-red-400">{error}</p>}

      {contractAddress && (
        <div className="mt-6 text-center p-4 bg-purple-900/50 border border-purple-700 rounded-md">
            <p className="font-semibold text-white">¡Contrato desplegado con éxito!</p>
            <p className="font-mono text-sm text-gray-300 break-all mt-2">{contractAddress}</p>
        </div>
      )}
    </div>
  );
}