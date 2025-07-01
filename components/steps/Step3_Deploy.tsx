// En: frontend/components/steps/Step3_Deploy.tsx
'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { loadStripe } from '@stripe/stripe-js';
import type { TokenData } from '../Wizard';
import contractArtifact from '@/lib/contracts/TokenForgeERC20.json';

// Cargamos la clave publicable de Stripe desde las variables de entorno
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface Step3Props {
  tokenData: TokenData;
}

export default function Step3_Deploy({ tokenData }: Step3Props) {
  const [supply, setSupply] = useState(1000000);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [contractAddress, setContractAddress] = useState('');
  const [loadingPayment, setLoadingPayment] = useState(false);

  const handleTestnetDeploy = async () => {
    setStatus('Iniciando despliegue en Testnet...');
    setError('');
    // ... (La lógica de despliegue que ya tenías)
    // Este es un resumen, asegúrate de que es la misma que ya funcionaba
    if (typeof window.ethereum === 'undefined') {
      setError('Por favor, instala MetaMask para continuar.');
      setStatus('');
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const factory = new ethers.ContractFactory(contractArtifact.abi, contractArtifact.bytecode, signer);
      setStatus('Enviando transacción a MetaMask...');
      const contract = await factory.deploy(await signer.getAddress(), tokenData.name, tokenData.ticker, supply);
      setStatus('Desplegando en Testnet...');
      await contract.waitForDeployment();
      const address = await contract.getAddress();
      setContractAddress(address);
      setStatus('¡Contrato desplegado con éxito en Testnet!');
    } catch (err: any) {
      setError(err.reason || err.message || 'Error desconocido.');
      setStatus('');
    }
  };

  const handleMainnetCheckout = async () => {
    setLoadingPayment(true);
    setError('');
    try {
      // Ahora enviamos el ID del proyecto a nuestra API
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: tokenData.id }), // <-- ENVIAMOS EL ID
      });

      // ... (el resto de la función no cambia)
      const { sessionId, error } = await response.json();
      if (error) throw new Error(error);
      const stripe = await stripePromise;
      if (!stripe) throw new Error("Stripe.js no se ha cargado.");
      await stripe.redirectToCheckout({ sessionId });

    } catch (err: any) {
      setError(err.message);
    }
    setLoadingPayment(false);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Paso 3: Configuración y Lanzamiento</h2>
      <p className="text-gray-400 mb-6">Define la cantidad total de monedas y lanza tu token en una red de pruebas gratuita o en una red principal.</p>
      
      <div className="mb-6">
        <label htmlFor="supply" className="block text-sm font-medium text-gray-300 mb-1">Cantidad Total (Total Supply)</label>
        <input 
          type="number" 
          id="supply"
          value={supply}
          onChange={(e) => setSupply(Number(e.target.value))}
          className="w-full p-2 bg-gray-700 text-white rounded-md border border-gray-600"
        />
      </div>

      <div className="space-y-4">
        {/* Botón para Testnet */}
        <button
          onClick={handleTestnetDeploy}
          className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-500 transition-colors"
        >
          🧪 Lanzar en Testnet (Gratis)
        </button>

        {/* Botón para Mainnet */}
        <button
          onClick={handleMainnetCheckout}
          disabled={loadingPayment}
          className="w-full px-6 py-4 bg-green-600 text-white font-bold text-lg rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-500"
        >
          {loadingPayment ? 'Preparando pago...' : '🚀 Pagar para Lanzar en Mainnet'}
        </button>
      </div>

      {status && <p className="mt-4 text-center text-blue-300 animate-pulse">{status}</p>}
      {error && <p className="mt-4 text-center text-red-400">{error}</p>}
      
      {contractAddress && (
        <div className="mt-6 text-center p-4 bg-purple-900/50 border border-purple-700 rounded-md">
            {/* ... (el mismo JSX que ya tenías para mostrar la dirección) ... */}
            <p>Contrato desplegado en: {contractAddress}</p>
        </div>
      )}
    </div>
  );
}