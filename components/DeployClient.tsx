'use client';

import { useState } from 'react';
import { ProjectForDeploy } from '@/app/deploy/[projectId]/page';
import { ConnectWallet } from './ConnectWallet';
import { useAccount } from 'wagmi';
import { loadStripe } from '@stripe/stripe-js';
// Asegúrate de que este artefacto del contrato es el correcto
import contractArtifact from '@/lib/contracts/TokenForgeERC20.json'; 
import { ethers } from 'ethers';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const deploymentPlans = [
  {
    id: 'polygon', name: 'Plan Eficiente', network: 'Polygon',
    description: 'Bajas comisiones y alta velocidad.', priceId: 'price_1Pf...', // Reemplaza con tu Price ID real
  },
  {
    id: 'bnb', name: 'Plan Rendimiento', network: 'BNB Chain',
    description: 'Acceso a un ecosistema masivo.', priceId: 'price_1Pf...', // Reemplaza con tu Price ID real
  },
  {
    id: 'ethereum', name: 'Plan Máxima Seguridad', network: 'Ethereum',
    description: 'La red más segura y prestigiosa.', priceId: 'price_1Pf...', // Reemplaza con tu Price ID real
  },
];

const supportedNetworks = [
  { name: 'Polygon Mainnet', chainId: '0x89', explorerUrl: 'https://polygonscan.com' },
  { name: 'BNB Smart Chain', chainId: '0x38', explorerUrl: 'https://bscscan.com' },
];

export function DeployClient({ project }: { project: ProjectForDeploy }) {
  // Estado para la lógica de PAGO
  const [selectedPlan, setSelectedPlan] = useState(deploymentPlans[0]);
  const [loadingPayment, setLoadingPayment] = useState(false);
  
  // Estado para la lógica de DESPLIEGUE
  const [selectedNetwork, setSelectedNetwork] = useState(supportedNetworks[0]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [contractAddress, setContractAddress] = useState('');

  const { isConnected, address } = useAccount();

  const handleMainnetCheckout = async () => {
    // ... (la función de pago que ya teníamos)
  };

  const handleDeploy = async () => {
    // ... (la función de despliegue que ya tenías)
  };

  return (
    <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Lanzamiento en Mainnet</h1>
        <ConnectWallet />
      </div>

      <div className="bg-gray-900 p-4 rounded-md mb-6 space-y-1">
        <p><strong>Proyecto:</strong> {project.name}</p>
        <p><strong>Ticker:</strong> ${project.ticker.toUpperCase()}</p>
      </div>

      {/* === LÓGICA CONDICIONAL === */}
      {project.is_paid ? (
        <>
          {/* --- SECCIÓN 1: SI YA ESTÁ PAGADO (Muestra UI de Despliegue) --- */}
          <h2 className="text-xl font-semibold text-green-400 mb-4">¡Proyecto Activado! Listo para desplegar.</h2>
          
          <div className="mb-6">
            <label htmlFor="network" className="block text-sm font-medium text-gray-300 mb-2">
              Selecciona la Red de Despliegue:
            </label>
            <select
              id="network"
              value={selectedNetwork.chainId}
              onChange={(e) => setSelectedNetwork(supportedNetworks.find(n => n.chainId === e.target.value)!)}
              className="w-full p-3 bg-gray-700 text-white rounded-md border border-gray-600 focus:ring-2 focus:ring-purple-500"
            >
              {supportedNetworks.map(network => (
                <option key={network.chainId} value={network.chainId}>
                  {network.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleDeploy}
            disabled={!!contractAddress || !!status || !isConnected}
            className="w-full py-3 bg-purple-600 text-white font-bold rounded-md hover:bg-purple-500 transition-colors disabled:bg-gray-500"
          >
            {isConnected ? (status ? status : `🚀 Desplegar en ${selectedNetwork.name}`) : 'Conecta tu billetera para desplegar'}
          </button>
        </>
      ) : (
        <>
          {/* --- SECCIÓN 2: SI AÚN NO ESTÁ PAGADO (Muestra UI de Pago) --- */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white mb-3">Paso 1: Elige tu Red Principal para Activar</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {deploymentPlans.map((plan) => (
                    <button
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan)}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${ selectedPlan.id === plan.id ? 'border-purple-500 bg-purple-900/50 scale-105' : 'border-gray-600 bg-gray-800 hover:border-gray-500' }`}
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
          {loadingPayment ? 'Preparando pago...' : `Pagar para Activar en ${selectedPlan.network}`}
        </button>
        </>
      )}

      {error && <p className="mt-4 text-center text-red-400">{error}</p>}
      {status && <p className="mt-4 text-center text-blue-300 animate-pulse">{status}</p>}
      
      {contractAddress && (
         <div className="mt-4 text-center">
            <p className="text-white">✅ ¡Contrato desplegado con éxito en Mainnet!</p>
            <p className="font-mono text-sm bg-gray-900 p-2 rounded mt-2 break-all">{contractAddress}</p>
            <a href={`${selectedNetwork.explorerUrl}/address/${contractAddress}`} target="_blank" rel="noopener noreferrer" className="inline-block mt-4 text-blue-400 hover:text-blue-300">
                Ver en el Explorador de Bloques &rarr;
            </a>
         </div>
      )}
    </div>
  );
}