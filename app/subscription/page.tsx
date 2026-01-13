// app/subscription/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client'; // Importa el cliente de Supabase para el lado del cliente
import { useRouter } from 'next/navigation'; // Para redirigir
import { useTranslation } from '@/lib/i18n';

// Define los planes con los Price IDs que configurarás en Stripe
const subscriptionPlans = [
  {
    id: 'basic',
    name: 'Basic', // Key for translation lookup if needed, or keep as identifier
    price: '4,99 €/mes',
    priceId: 'price_1Rh3vdIs18b5tpWUCAWSrz6n',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'Próximamente',
    priceId: '', // Disabled
  },
  {
    id: 'advanced',
    name: 'Advanced',
    price: 'Próximamente',
    priceId: '', // Disabled
  },
];

// Importa loadStripe aquí, ya que se usa en este componente.
import { loadStripe } from '@stripe/stripe-js';
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function SubscriptionPage() {
  const { t } = useTranslation();
  // const supabase = createClient(); // REMOVED
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userSubscription, setUserSubscription] = useState<any | null>(null);
  const [loadingCheckout, setLoadingCheckout] = useState(false);

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Redirigir a login si no está autenticado
        router.push('/login');
        return;
      }

      // Consulta el perfil del usuario para obtener su estado de suscripción
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user subscription profile:', profileError);
        setError(t('subscription.errorLoad'));
      } else {
        setUserSubscription(profile);
      }
      setLoading(false);
    };

    fetchSubscriptionStatus();
  }, [router, t]); // Dependencias para el useEffect

  const handleSubscribe = async (priceId: string) => {
    setLoadingCheckout(true);
    setError('');

    const { createClient } = await import('@/utils/supabase/client');
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError(t('subscription.errorLogin'));
      setLoadingCheckout(false);
      return;
    }

    try {
      console.log('🟡 DEBUG: El ID del usuario en el frontend es:', user.id);
      // Llama a tu API de checkout para crear la sesión de Stripe Checkout
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: priceId,
          userId: user.id, // Pasamos el ID del usuario de Supabase
        }),
      });

      const { sessionId, error: responseError } = await response.json();

      if (responseError) {
        throw new Error(responseError);
      }

      const stripe = await stripePromise; // Usa la promesa de Stripe cargada
      if (!stripe) {
        throw new Error(t('subscription.errorStripe'));
      }

      await stripe.redirectToCheckout({ sessionId });
    } catch (err: any) {
      setError(err.message || t('subscription.errorProcess'));
    } finally {
      setLoadingCheckout(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white">{t('subscription.loading')}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 pt-32">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center text-purple-400">{t('subscription.title')}</h1>

        {error && <p className="bg-red-900/20 text-red-400 p-3 rounded-md mb-6">{error}</p>}

        {userSubscription && userSubscription.is_subscribed ? (
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-purple-700 mb-8">
            <h2 className="text-2xl font-bold mb-4">{t('subscription.current.title')} <span className="text-purple-400">{userSubscription.active_subscription_plan || 'N/A'}</span></h2>
            <p className="text-lg text-gray-300 mb-2">{t('subscription.current.status')} <span className="capitalize">{userSubscription.subscription_status || 'desconocido'}</span></p>
            {userSubscription.subscription_ends_at && (
              <p className="text-lg text-gray-300 mb-4">{t('subscription.current.ends')} {new Date(userSubscription.subscription_ends_at).toLocaleDateString()}</p>
            )}

            <h3 className="text-xl font-semibold mb-3">{t('subscription.current.limitsTitle')}</h3>
            <ul className="list-disc pl-6 text-gray-300 mb-6">
              <li>Polygon: {userSubscription.unlimited_deployments ? t('subscription.current.unlimited') : `${userSubscription.polygon_tokens_used} / ${userSubscription.polygon_tokens_allowed}`} tokens</li>
              <li>BNB Chain: {userSubscription.unlimited_deployments ? t('subscription.current.unlimited') : `${userSubscription.bnb_tokens_used} / ${userSubscription.bnb_tokens_allowed}`} tokens</li>
              <li>Ethereum: {userSubscription.unlimited_deployments ? t('subscription.current.unlimited') : `${userSubscription.ethereum_tokens_used} / ${userSubscription.ethereum_tokens_allowed}`} tokens</li>
            </ul>

            {/* ✅ CORRECCIÓN AQUÍ: Usar <button> en lugar de <Link> para la acción "Gestionar Suscripción" */}
            <p className="text-center">
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  setError('');
                  setLoadingCheckout(true);
                  try {
                    // Llama a tu nuevo endpoint de backend para crear la sesión del Portal de Clientes
                    const response = await fetch('/api/create-customer-portal-session', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ customerId: userSubscription.stripe_customer_id })
                    });
                    const { url, error: portalError } = await response.json();
                    if (portalError) throw new Error(portalError);
                    window.location.href = url; // Redirige al portal de clientes de Stripe
                  } catch (err: any) {
                    setError(err.message || t('subscription.errorPortal'));
                  } finally {
                    setLoadingCheckout(false);
                  }
                }}
                disabled={loadingCheckout} // La prop 'disabled' SÍ funciona en <button>
                className={`bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-6 rounded-md transition-colors ${loadingCheckout ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loadingCheckout ? t('subscription.loadingPortal') : t('subscription.manageButton')}
              </button>
            </p>
          </div>
        ) : (
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-purple-700 mb-8 text-center">
            <h2 className="text-2xl font-bold mb-4">{t('subscription.noActive.title')}</h2>
            <p className="text-lg text-gray-300 mb-6">{t('subscription.noActive.subtitle')}</p>
          </div>
        )}

        <h2 className="text-3xl font-bold mb-6 text-center">{t('subscription.plansTitle')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {subscriptionPlans.map((plan) => (
            <div key={plan.id} className={`bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col justify-between ${userSubscription?.active_subscription_plan === plan.name ? 'border-4 border-purple-500' : 'border border-gray-700'}`}>
              <div>
                <h3 className="text-2xl font-bold text-purple-400 mb-2">{t(`plans.${plan.id}.name`)}</h3>
                <p className="text-4xl font-extrabold mb-4">{plan.id === 'basic' ? plan.price : t('common.comingSoon')}</p>
                <p className="text-gray-300 mb-4">{t(`plans.${plan.id}.description`)}</p>
                <ul className="text-gray-400 text-sm list-disc pl-5 mb-6">
                  {plan.id === 'basic' && (
                    <>
                      <li>{t('subscription.features.basic.1')}</li>
                      <li>{t('subscription.features.basic.2')}</li>
                    </>
                  )}
                  {plan.id === 'pro' && (
                    <>
                      <li>{t('subscription.features.pro.1')}</li>
                      <li>{t('subscription.features.pro.2')}</li>
                      <li>{t('subscription.features.pro.3')}</li>
                      <li>{t('subscription.features.pro.4')}</li>
                    </>
                  )}
                  {plan.id === 'advanced' && (
                    <>
                      <li>{t('subscription.features.advanced.1')}</li>
                      <li>{t('subscription.features.advanced.2')}</li>
                      <li>{t('subscription.features.advanced.3')}</li>
                      <li>{t('subscription.features.advanced.4')}</li>
                    </>
                  )}
                </ul>
              </div>
              <button
                onClick={() => handleSubscribe(plan.priceId)}
                disabled={!plan.priceId || loadingCheckout || (userSubscription?.is_subscribed && userSubscription?.active_subscription_plan === plan.name)}
                className={`w-full py-3 rounded-md font-semibold transition-colors ${!plan.priceId
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : userSubscription?.active_subscription_plan === plan.name
                    ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
              >
                {!plan.priceId ? t('subscription.buttons.dev') : userSubscription?.active_subscription_plan === plan.name ? t('subscription.buttons.current') : (loadingCheckout ? t('subscription.buttons.redirecting') : t('subscription.buttons.choose'))}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}