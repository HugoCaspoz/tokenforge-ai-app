// En: frontend/components/steps/Step3_Deploy.tsx
'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { loadStripe } from '@stripe/stripe-js';
import type { TokenData } from '../Wizard';
import contractArtifact from '@/lib/contracts/TokenForgeERC20.json';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

/**
 * PASO 1: Define tus planes con sus respectivos Price IDs de Stripe.
 * Reemplaza 'price_...' con los IDs reales de tu dashboard de Stripe.
 */
const deploymentPlans = [
  {
    id: 'polygon',
    name: 'Plan Eficiente',
    network: 'Polygon (20€)',
    description: 'Bajas comisiones y alta velocidad.',
    priceId: 'price_1Rgie3Is18b5tpWUjWBPkHG4', 
  },
  {
    id: 'bnb',
    name: 'Plan Rendimiento',
    network: 'BNB Chain (50€)',
    description: 'Acceso a un ecosistema masivo.',
    priceId: 'price_1RgieUIs18b5tpWUeJ1KKoGT',
  },
  {
    id: 'ethereum',
    name: 'Plan Máxima Seguridad',
    network: 'Ethereum (300€)',
    description: 'La red más segura y prestigiosa.',
    priceId: 'price_1RgieqIs18b5tpWUAdb8nzpO',
  },
];

interface Step3Props {
  tokenData: TokenData;
}

export default function Step3_Deploy({ tokenData }: Step3Props) {
  const [supply, setSupply] = useState(1000000);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [contractAddress, setContractAddress] = useState('');
  const [loadingPayment, setLoadingPayment] = useState(false);

  // PASO 2: Añade un estado para guardar el plan seleccionado. Por defecto, el primero.
  const [selectedPlan, setSelectedPlan] = useState(deploymentPlans[0]);

  const handleTestnetDeploy = async () => {
    // ... esta función no necesita cambios ...
  };

  // PASO 4: Actualiza la lógica del botón de pago
  const handleMainnetCheckout = async () => {
    if (!selectedPlan) {
      setError('Por favor, selecciona un plan de despliegue.');
      return;
    }

    setLoadingPayment(true);
    setError('');
    
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          projectId: tokenData.id,
          // Usa el priceId del plan seleccionado en el estado
          priceId: selectedPlan.priceId,
        }),
      });

      const { sessionId, error: responseError } = await response.json();
      
      if (responseError) { throw new Error(responseError); }
      
      const stripe = await stripePromise;
      if (!stripe) { throw new Error("Stripe.js no se ha cargado."); }
      
      await stripe.redirectToCheckout({ sessionId });

    } catch (err) {
      if (err instanceof Error) { setError(err.message); } 
      else { setError('Ha ocurrido un error desconocido al preparar el pago.'); }
    }
    setLoadingPayment(false);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Paso 3: Configuración y Lanzamiento</h2>
      <p className="text-gray-400 mb-6">Define la cantidad total de monedas y lanza tu token en una red de pruebas gratuita o en una red principal.</p>
      
      <div className="mb-6">
        {/* ... Input para el Supply (sin cambios) ... */}
      </div>

      <div className="space-y-4">
        {/* Botón de Testnet (sin cambios) */}
        <button
          onClick={handleTestnetDeploy}
          className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-500 transition-colors"
        >
          🧪 Lanzar en Testnet (Gratis)
        </button>

        <div className="border-t border-gray-700 my-4"></div>

        {/* PASO 3: Crea el Selector Visual de Planes (JSX) */}
        <div className="mb-4">
            <h3 className="text-lg font-semibold text-white mb-3">Elige tu Red Principal (Mainnet):</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {deploymentPlans.map((plan) => (
                    <button
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan)}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                            selectedPlan.id === plan.id 
                            ? 'border-purple-500 bg-purple-900/50 scale-105' 
                            : 'border-gray-600 bg-gray-800 hover:border-gray-500'
                        }`}
                    >
                        <p className="font-bold text-white">{plan.name}</p>
                        <p className="text-sm text-purple-300">{plan.network}</p>
                        <p className="text-xs text-gray-400 mt-2">{plan.description}</p>
                    </button>
                ))}
            </div>
        </div>

        <button
          onClick={handleMainnetCheckout}
          disabled={loadingPayment || !selectedPlan}
          className="w-full px-6 py-4 bg-green-600 text-white font-bold text-lg rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-500"
        >
          {loadingPayment ? 'Preparando pago...' : `🚀 Pagar para Lanzar en ${selectedPlan.network}`}
        </button>
      </div>

      {status && <p className="mt-4 text-center text-blue-300 animate-pulse">{status}</p>}
      {error && <p className="mt-4 text-center text-red-400">{error}</p>}
      
      {contractAddress && (
        <div className="mt-6 text-center p-4 bg-purple-900/50 border border-purple-700 rounded-md">
            <p className="font-semibold text-white">¡Contrato desplegado con éxito en Testnet!</p>
            <p className="font-mono text-sm text-gray-300 break-all mt-2">{contractAddress}</p>
        </div>
      )}
    </div>
  );
}


