'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { UserProfile as ServerUserProfile, DeployedToken, NetworkUsage } from '@/app/profile/page';
import { PLAN_DETAILS, NETWORK_NAMES, NETWORK_EXPLORERS } from '@/lib/plans';
import { useTranslation } from '@/lib/i18n';

// Type override to avoid import issues if needed, or use the imported one.
// Since UserProfile is exported from page.tsx, we can use it directly.
type UserProfile = ServerUserProfile;

interface ProfileClientProps {
  profile: UserProfile | null;
  deployedTokens: DeployedToken[];
  usage: NetworkUsage[];
}

export function ProfileClient({ profile, deployedTokens, usage }: ProfileClientProps) {
  const { t } = useTranslation();
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
        <p className="text-yellow-400">{t('profile.subscription.error')}</p>
      </div>
    );
  }

  // Get plan name from translation if possible, fallback to hardcoded name
  const planKey = profile.plan_activo as keyof typeof PLAN_DETAILS;
  // We need to map the plan key to the translation key structure if they match
  // In plans.ts keys are: free, basic, pro, advanced (mapped to enterprise in DB)
  // Let's check what we have in translation: free, basic, pro, enterprise
  // We should probably use the ID from PLAN_DETAILS to be safe, or just use the key if it matches.
  // profile.plan_activo comes from DB.

  let translationPlanKey = planKey;
  if (planKey === 'advanced' as any) translationPlanKey = 'enterprise' as any; // Handle the mismatch if any

  const currentPlanName = t(`plans.${translationPlanKey}.name`);
  const isFreePlan = !profile.plan_activo || profile.plan_activo === 'free';

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold">{t('profile.title')}</h1>

      {/* Sección de Suscripción */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">{t('profile.subscription.title')}</h2>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-lg">{t('profile.subscription.currentPlan')} <span className="font-bold text-purple-400">{currentPlanName}</span></p>
            {/* ✅ Mostramos la fecha de renovación si existe y no es el plan gratuito */}
            {profile.current_period_end && !isFreePlan && (
              <p className="text-sm text-gray-400 mt-1">
                {t('profile.subscription.renewsOn')} {new Date(profile.current_period_end).toLocaleDateString()}
              </p>
            )}
          </div>
          {/* ✅ Botón dinámico que cambia de texto y de función */}
          <button
            onClick={handleSubscriptionClick}
            disabled={loading}
            className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-500 transition-colors disabled:bg-gray-500"
          >
            {loading ? t('profile.subscription.loading') : (isFreePlan ? t('profile.subscription.choosePlan') : t('profile.subscription.manage'))}
          </button>
        </div>
      </div>

      {/* Sección de Uso por Red */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">{t('profile.usage.title')}</h2>
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
            <p className="text-gray-400">{t('profile.usage.noPlan')} <a href="/subscription" className="text-purple-400 hover:underline">{t('profile.usage.upgrade')}</a></p>
          )}
        </div>
      </div>

      {/* Sección de Tokens Desplegados */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">{t('profile.deployments.title')}</h2>
          {/* ✅ Check if user has quota remaining in ANY network */}
          {usage.some(u => u.deployed < u.limit) && (
            <Link
              href="/create"
              className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded transition-colors text-sm flex items-center gap-2"
            >
              <span>+</span> {t('profile.deployments.createToken')}
            </Link>
          )}
        </div>
        {deployedTokens.length > 0 ? (
          <ul className="space-y-2">
            {deployedTokens.map(token => {
              const chainId = token.chain_id as keyof typeof NETWORK_NAMES;
              const networkName = NETWORK_NAMES[chainId] || token.chain_id;
              const explorerBaseUrl = NETWORK_EXPLORERS[chainId as keyof typeof NETWORK_EXPLORERS];
              const explorerUrl = explorerBaseUrl ? `${explorerBaseUrl}/address/${token.contract_address}` : '#';

              return (
                <li key={token.contract_address} className="bg-gray-700 p-4 rounded-md flex items-start gap-4">
                  {/* Logo */}
                  <div className="flex-shrink-0 w-12 h-12 bg-gray-600 rounded-full overflow-hidden flex items-center justify-center">
                    {token.logo_url ? (
                      <img src={token.logo_url} alt={`${token.name} logo`} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-bold text-gray-400">{token.ticker[0]}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold text-white">{token.name} <span className="text-gray-400 text-sm ml-2">${token.ticker}</span></h3>
                        <p className="text-sm text-blue-400 mb-1">{networkName}</p>
                      </div>
                      <a
                        href={explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded transition-colors"
                      >
                        {t('profile.deployments.viewExplorer')}
                      </a>
                    </div>

                    {token.description && (
                      <p className="text-gray-300 text-sm mt-2">{token.description}</p>
                    )}

                    <div className="flex items-center gap-4 mt-4">
                      <div className="p-2 bg-gray-800 rounded text-xs font-mono text-gray-500 break-all select-all flex-grow">
                        {token.contract_address}
                      </div>
                      <a
                        href={`/manage/${token.contract_address}`}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded text-white text-xs font-bold transition-colors whitespace-nowrap"
                      >
                        {t('profile.deployments.manage')}
                      </a>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-gray-400">{t('profile.deployments.noTokens')}</p>
        )}
      </div>
    </div>
  );
}