// En: frontend/components/steps/Step3_Deploy.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { TokenData } from '../Wizard';
import Link from 'next/link';
import { PLAN_DETAILS, NETWORK_NAMES, NETWORK_EXPLORERS } from '@/lib/plans';
import { useWalletClient, usePublicClient } from 'wagmi';
import { parseEther } from 'viem';
import { TOKEN_ABI, TOKEN_BYTECODE } from '@/lib/tokenArtifacts';

const networkKeys = Object.keys(NETWORK_NAMES) as Array<keyof typeof NETWORK_NAMES>;

interface Step3Props {
  tokenData: TokenData;
}

const [status, setStatus] = useState('');
const [error, setError] = useState('');
const [contractAddress, setContractAddress] = useState('');
const [loadingDeploy, setLoadingDeploy] = useState(false);

// Wagmi Hooks
const { data: walletClient } = useWalletClient();
const publicClient = usePublicClient();

// Guardamos el plan activo (clave) y el perfil completo si es necesario
const [activePlanKey, setActivePlanKey] = useState<keyof typeof PLAN_DETAILS>('free');
const [isSubscribed, setIsSubscribed] = useState(false);
const [deploymentsCount, setDeploymentsCount] = useState<Record<string, number>>({});

// Configuración inicial de red (primera disponible en PLAN_DETAILS o default)
const [selectedChainId, setSelectedChainId] = useState<string>('0x89');

useEffect(() => {
  const fetchUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // 1. Obtener Perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan_activo')
        .eq('id', user.id)
        .single();

      const planKey = (profile?.plan_activo as keyof typeof PLAN_DETAILS) || 'free';
      setActivePlanKey(planKey);
      // Consideramos suscrito si no es free
      setIsSubscribed(planKey !== 'free');

      // 2. Obtener conteo de despliegues (para calcular restantes)
      const { data: tokens } = await supabase
        .from('projects')
        .select('chain_id')
        .eq('user_id', user.id)
        .not('contract_address', 'is', null);

      const counts: Record<string, number> = {};
      if (tokens) {
        tokens.forEach((t: any) => {
          if (t.chain_id) counts[t.chain_id] = (counts[t.chain_id] || 0) + 1;
        });
      }
      setDeploymentsCount(counts);

    } else {
      setError('Necesitas iniciar sesión.');
    }
  };

  fetchUserProfile();
}, [supabase]);

const getTokensAvailable = (chainId: string) => {
  const plan = PLAN_DETAILS[activePlanKey];
  if (!plan) return 0;

  // @ts-ignore - Typescript check for generic key access
  const limit = (plan.limits[chainId as keyof typeof NETWORK_NAMES] || 0) as number;
  if (limit === -1) return 9999; // Infinito

  const used = deploymentsCount[chainId] || 0;
  return Math.max(0, limit - used);
};

const handleDeploy = async () => {
  setError('');
  setStatus('');

  if (!isSubscribed) {
    setError('Necesitas una suscripción activa para desplegar en Mainnet.');
    return;
  }

  const available = getTokensAvailable(selectedChainId);
  if (available <= 0) {
    setError(`Has alcanzado el límite de tokens para esta red con tu plan actual.`);
    return;
  }

  if (!walletClient || !publicClient) {
    setError('Por favor conecta tu wallet para desplegar.');
    return;
  }

  setLoadingDeploy(true);
  try {
    setStatus('Iniciando despliegue... Por favor confirma la transacción en tu wallet.');

    const hash = await walletClient.deployContract({
      abi: TOKEN_ABI,
      bytecode: TOKEN_BYTECODE as `0x${string}`,
      args: [tokenData.name, tokenData.ticker, parseEther(supply.toString()), await walletClient.getAddresses().then(a => a[0])],
    });

    setStatus(`Transacción enviada: ${hash}. Esperando confirmación...`);

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status !== 'success') {
      throw new Error('La transacción falló en la blockchain.');
    }

    const newContractAddress = receipt.contractAddress;
    if (!newContractAddress) throw new Error('No se obtuvo la dirección del contrato.');

    setStatus('Registrando token en la plataforma...');

    // Save to DB
    const response = await fetch('/api/record-deployment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tokenData,
        chainId: selectedChainId,
        contractAddress: newContractAddress,
        transactionHash: hash
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error registrando el despliegue.');
    }

    setStatus(`Despliegue exitoso. Dirección: ${newContractAddress}`);
    setContractAddress(newContractAddress);

  } catch (err: any) {
    console.error(err);
    setError(err.message || 'Ha ocurrido un error durante el despliegue.');
  } finally {
    setLoadingDeploy(false);
  }
};

// --- REAL DEPLOYMENT HOOKS ---
const { data: walletClient } = import('wagmi').then(mod => mod.useWalletClient()).catch(() => ({ data: null })); // Dynamic import workaround failing?
// Let's use standard imports at top.
// const { data: walletClient } = useWalletClient(); 
// We need to add useWalletClient to imports.

// Actually, let's redefine the component logic properly below using imports we add.
/* 
   We need to update imports first. 
   I will initiate a separate 'replace_file_content' for imports, 
   then replacing the handleDeploy logic.
*/
// Cancelling this replacement chunk to do imports first.
return;
/* Placeholder to stop tool execution logic and switch to imports first */

const currentPlanName = PLAN_DETAILS[activePlanKey]?.name || 'Ninguno';

return (
  <div>
    <h2 className="text-2xl font-bold text-white mb-2">Paso 3: Configuración y Lanzamiento</h2>
    <p className="text-gray-400 mb-6">Define el suministro y selecciona la red.</p>

    {/* Estado Suscripción */}
    <div className="bg-gray-800 p-4 rounded-md mb-6 border border-purple-600">
      <h3 className="text-lg font-semibold text-white mb-2">Tu Plan Actual: <span className="text-purple-400">{currentPlanName}</span></h3>
      {!isSubscribed && (
        <p className="text-red-400 mb-2">Actualmente no tienes una suscripción activa. ¡Suscríbete para desplegar en Mainnet!</p>
      )}

      <p className="text-gray-300 text-sm mt-2">Límites de tu plan:</p>
      <ul className="text-gray-400 text-sm list-disc pl-5">
        {networkKeys.map(chainId => {
          const plan = PLAN_DETAILS[activePlanKey];
          const limit = (plan ? plan.limits[chainId] : 0) as number;
          const label = limit === -1 ? "Ilimitados" : `${getTokensAvailable(chainId)} de ${limit}`;
          const name = NETWORK_NAMES[chainId] || chainId;
          return <li key={chainId}>{name}: {label}</li>
        })}
      </ul>

      {!isSubscribed && (
        <p className="mt-3">
          <Link href="/subscription" className="text-purple-300 hover:underline">Gestionar Suscripción aquí</Link>
        </p>
      )}
    </div>

    {/* Suministro */}
    <div className="mb-6">
      <label htmlFor="supply" className="block text-sm font-medium text-gray-300 mb-2">
        Suministro Total (Ej. 1,000,000)
      </label>
      <input
        type="number"
        id="supply"
        value={supply}
        onChange={(e) => setSupply(Number(e.target.value))}
        className="w-full p-3 rounded-md bg-gray-700 border border-gray-600 text-white focus:ring-purple-500 focus:border-purple-500"
        min="1"
      />
    </div>

    {/* Selector de Red */}
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-3">Elige tu Red Principal:</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {networkKeys.map((chainId) => {
            const available = getTokensAvailable(chainId);
            const name = NETWORK_NAMES[chainId];
            // Si el límite del plan es 0 para esta red, no está permitida (o si available es 0 y no es -1)
            // Simplificación: usaremos available > 0 (o ilimitado) para habilitar
            const plan = PLAN_DETAILS[activePlanKey];
            const limit = (plan ? plan.limits[chainId] : 0) as number;
            const isDisabled = !isSubscribed || (limit !== -1 && available <= 0) || limit === 0;

            return (
              <button
                key={chainId}
                onClick={() => setSelectedChainId(chainId)}
                disabled={isDisabled}
                className={`p-4 rounded-lg border-2 text-left transition-all ${selectedChainId === chainId
                  ? 'border-purple-500 bg-purple-900/50 scale-105'
                  : 'border-gray-600 bg-gray-800 hover:border-gray-500'
                  } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <p className="font-bold text-white">{name}</p>
                <p className="text-sm mt-2">
                  {isDisabled ? <span className="text-red-400">No disponible</span> : <span className="text-green-400">Disponible</span>}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleDeploy}
        disabled={loadingDeploy || !isSubscribed || getTokensAvailable(selectedChainId) <= 0}
        className="w-full px-6 py-4 bg-green-600 text-white font-bold text-lg rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-500"
      >
        {loadingDeploy ? 'Desplegando...' : `🚀 Desplegar en ${NETWORK_NAMES[selectedChainId as keyof typeof NETWORK_NAMES]}`}
      </button>
    </div>

    {status && <p className="mt-4 text-center text-blue-300 animate-pulse">{status}</p>}
    {error && <p className="mt-4 text-center text-red-400">{error}</p>}

    {contractAddress && (
      <div className="mt-6 text-center text-white bg-green-500/20 p-4 rounded border border-green-500">
        <p className="font-semibold text-lg mb-2">¡Contrato desplegado con éxito! 🎉</p>
        <p className="text-sm text-gray-300 mb-4">Tu token ya vive en la blockchain.</p>

        <a
          href={`${NETWORK_EXPLORERS[selectedChainId as keyof typeof NETWORK_EXPLORERS] || 'https://etherscan.io'}/address/${contractAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white font-bold transition-colors"
        >
          Ver en {NETWORK_NAMES[selectedChainId as keyof typeof NETWORK_NAMES] || 'Explorer'}
        </a>

        <p className="font-mono text-xs text-gray-500 break-all mt-4">{contractAddress}</p>
      </div>
    )}
  </div>
);
}