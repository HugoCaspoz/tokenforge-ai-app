'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { TokenData } from '../Wizard';
import Link from 'next/link';
import { PLAN_DETAILS, NETWORK_NAMES, NETWORK_EXPLORERS } from '@/lib/plans';
import { useWalletClient, usePublicClient } from 'wagmi';
import { parseEther } from 'viem';
import { TOKEN_ABI, TOKEN_BYTECODE } from '@/lib/tokenArtifacts';
import { useTranslation } from '@/lib/i18n';

const networkKeys = Object.keys(NETWORK_NAMES) as Array<keyof typeof NETWORK_NAMES>;

interface Step3Props {
  tokenData: TokenData;
  onDeploySuccess?: () => void;
}

export default function Step3_Deploy({ tokenData, onDeploySuccess }: Step3Props) {
  const { t } = useTranslation();
  // const supabase = createClient(); // REMOVED
  const [supply, setSupply] = useState(1000000);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [contractAddress, setContractAddress] = useState('');
  const [loadingDeploy, setLoadingDeploy] = useState(false);
  const [serverInfo, setServerInfo] = useState<any>(null);

  useEffect(() => {
    fetch('/api/debug-wallet')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setServerInfo(data);
      })
      .catch(err => console.error(err));
  }, []);

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
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();

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
        setError(t('wizard.step3.errorNeedLogin'));
      }
    };

    fetchUserProfile();
  }, []);

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
      setError(t('wizard.step3.errorNeedSubscription'));
      return;
    }

    const available = getTokensAvailable(selectedChainId);
    if (available <= 0) {
      setError(t('wizard.step3.errorLimit'));
      return;
    }

    // Server-Side: We assume the admin pays gas.
    // However, we need the user's address to assign ownership.
    let ownerAddress = '';

    if (walletClient) {
      const addresses = await walletClient.getAddresses();
      ownerAddress = addresses[0];
    } else {
      // If wallet not connected, we prompt them to connect just for the address
      setError(t('wizard.step3.errorConnectWallet'));
      return;
    }

    if (!ownerAddress) {
      setError(t('wizard.step3.errorNoAddress'));
      return;
    }

    setLoadingDeploy(true);
    try {
      setStatus(t('wizard.step3.requestingDeploy'));

      // Call API for Server-Side Deployment
      const response = await fetch('/api/deploy-mainnet-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenData,
          chainId: selectedChainId,
          initialSupply: supply,
          ownerAddress: ownerAddress // Send connected address to receive ownership
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('wizard.step3.errorDeploy'));
      }

      const newContractAddress = data.contractAddress;
      setStatus(`¡Despliegue exitoso! Dirección: ${newContractAddress}`);
      setContractAddress(newContractAddress);

      // Don't reset wizard - let user see success message
      // if (onDeploySuccess) {
      //   onDeploySuccess();
      // }

    } catch (err: any) {
      console.error(err);
      setError(err.message || t('wizard.step3.errorDeployUnknown'));
    } finally {
      setLoadingDeploy(false);
    }
  };

  const currentPlanName = PLAN_DETAILS[activePlanKey]?.name || 'Ninguno';

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">{t('wizard.step3.title')}</h2>
      <p className="text-gray-400 mb-6">{t('wizard.step3.subtitle')}</p>

      {/* Estado Suscripción */}
      <div className="bg-gray-800 p-4 rounded-md mb-6 border border-purple-600">
        <h3 className="text-lg font-semibold text-white mb-2">{t('wizard.step3.yourPlan')} <span className="text-purple-400">{currentPlanName}</span></h3>
        {!isSubscribed && (
          <p className="text-red-400 mb-2">{t('wizard.step3.noSubscription')}</p>
        )}

        <p className="text-gray-300 text-sm mt-2">{t('wizard.step3.planLimits')}</p>
        <ul className="text-gray-400 text-sm list-disc pl-5">
          {networkKeys.map(chainId => {
            const plan = PLAN_DETAILS[activePlanKey];
            const limit = (plan ? plan.limits[chainId] : 0) as number;
            const label = limit === -1 ? t('wizard.step3.unlimited') : `${getTokensAvailable(chainId)} de ${limit}`;
            const name = NETWORK_NAMES[chainId] || chainId;
            return <li key={chainId}>{name}: {label}</li>
          })}
        </ul>

        {!isSubscribed && (
          <p className="mt-3">
            <Link href="/subscription" className="text-purple-300 hover:underline">{t('wizard.step3.manageSubscription')}</Link>
          </p>
        )}
      </div>

      {/* Suministro */}
      <div className="mb-6">
        <label htmlFor="supply" className="block text-sm font-medium text-gray-300 mb-2">
          {t('wizard.step3.totalSupply')}
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
          <h3 className="text-lg font-semibold text-white mb-3">{t('wizard.step3.chooseNetwork')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {networkKeys.map((chainId) => {
              const available = getTokensAvailable(chainId);
              const name = NETWORK_NAMES[chainId];
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
                    {isDisabled ? <span className="text-red-400">{t('wizard.step3.notAvailable')}</span> : <span className="text-green-400">{t('wizard.step3.available')}</span>}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Server Wallet Debug Panel - ONLY FOR ADMIN/DEBUG */}
        {/* <div className="mb-4 p-4 text-xs font-mono bg-black/40 border border-gray-700 rounded text-gray-400">
          <p className="font-bold mb-1">📢 ESTADO DEL CLÚSTER DE DESPLIEGUE (SERVER):</p>
          {serverInfo ? (
            <>
              <p>Billetera Servidor: <span className="text-yellow-200">{serverInfo.address}</span></p>
              <p>Saldo: <span className={parseFloat(serverInfo.balance) > 0.5 ? "text-green-400" : "text-red-500 font-bold"}>{serverInfo.balance}</span></p>
              {parseFloat(serverInfo.balance) < 0.5 && (
                <p className="text-red-400 mt-2 bg-red-900/20 p-2 rounded">
                  ⚠️ CRÍTICO: El servidor no tiene fondos suficientes. Por favor, asegúrate de que la variable <code>DEPLOYER_PRIVATE_KEY</code> en Vercel corresponda a una billetera con saldo.
                </p>
              )}
            </>
          ) : (
            <p className="animate-pulse">Verificando estado del servidor...</p>
          )}
        </div> */}

        <button
          onClick={handleDeploy}
          disabled={loadingDeploy || !isSubscribed || getTokensAvailable(selectedChainId) <= 0}
          className="w-full px-6 py-4 bg-green-600 text-white font-bold text-lg rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-500"
        >
          {loadingDeploy ? t('wizard.step3.deploying') : `${t('wizard.step3.requestDeploy')} ${NETWORK_NAMES[selectedChainId as keyof typeof NETWORK_NAMES]}`}
        </button>
      </div>

      {status && <p className="mt-4 text-center text-blue-300 animate-pulse">{status}</p>}
      {error && <p className="mt-4 text-center text-red-400">{error}</p>}

      {contractAddress && (
        <div className="mt-6 text-center text-white bg-green-500/20 p-4 rounded border border-green-500">
          <p className="font-semibold text-lg mb-2">{t('wizard.step3.success')}</p>
          <p className="text-sm text-gray-300 mb-4">{t('wizard.step3.successDesc')}</p>

          <a
            href={`${NETWORK_EXPLORERS[selectedChainId as keyof typeof NETWORK_EXPLORERS] || 'https://etherscan.io'}/address/${contractAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white font-bold transition-colors"
          >
            {t('wizard.step3.viewOn')} {NETWORK_NAMES[selectedChainId as keyof typeof NETWORK_NAMES] || 'Explorer'}
          </a>

          <p className="font-mono text-xs text-gray-500 break-all mt-4">{contractAddress}</p>
        </div>
      )}
    </div>
  );
}