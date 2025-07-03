'use client';

import { useState } from 'react';
import { ProjectForDeploy } from '@/app/api/deploy/[projectId]/page';
import { ConnectWallet } from './ConnectWallet'; // Importa el botón
import { useAccount } from 'wagmi'; // Importa el hook de wagmi

const supportedNetworks = [
  {
    name: 'Polygon Mainnet',
    chainId: '0x89',
    explorerUrl: 'https://polygonscan.com',
  },
  {
    name: 'BNB Smart Chain',
    chainId: '0x38',
    explorerUrl: 'https://bscscan.com',
  },
];

export function DeployClient({ project }: { project: ProjectForDeploy }) {
  const [selectedNetwork, setSelectedNetwork] = useState(supportedNetworks[0]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [contractAddress, setContractAddress] = useState('');

  // Obtiene la información de la cuenta conectada desde wagmi
  const { address: ownerAddress, isConnected } = useAccount();

  const handleDeploy = async () => {
    if (!isConnected || !ownerAddress) {
      setError('Por favor, conecta tu billetera para continuar.');
      return;
    }

    setStatus(`Enviando petición de despliegue...`);
    setError('');

    try {
      const response = await fetch('/api/deploy/mainnet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          chainId: selectedNetwork.chainId,
          ownerAddress: ownerAddress, // Usa la dirección de la billetera conectada
        }),
      });

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      setContractAddress(result.contractAddress);
      setStatus(`¡Contrato desplegado con éxito en ${selectedNetwork.name}!`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ha ocurrido un error desconocido.';
      setError(errorMessage);
      setStatus('');
    }
  };

  return (
    <div className="bg-gray-800 p-8 rounded-lg shadow-xl ring-1 ring-green-500">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Lanzamiento en Mainnet</h1>
        <ConnectWallet />
      </div>

      <div className="bg-gray-900 p-4 rounded-md mb-6 space-y-1">
        <p><strong>Nombre:</strong> {project.name}</p>
        <p><strong>Ticker:</strong> ${project.ticker.toUpperCase()}</p>
        <p><strong>Supply:</strong> {(project.supply || 1000000).toLocaleString()}</p>
      </div>

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
        className="w-full py-3 bg-purple-600 text-white font-bold rounded-md hover:bg-purple-500 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
      >
        {isConnected ? (status ? status : `🚀 Desplegar en ${selectedNetwork.name}`) : 'Conecta tu billetera para desplegar'}
      </button>

      {error && <p className="mt-4 text-center text-red-400">{error}</p>}

      {contractAddress && (
         <div className="mt-4 text-center">
            <p className="text-white">Tu token está en la dirección:</p>
            <p className="font-mono text-sm bg-gray-900 p-2 rounded mt-2 break-all">{contractAddress}</p>
            <a
                href={`${selectedNetwork.explorerUrl}/address/${contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 text-blue-400 hover:text-blue-300"
            >
                Ver en el Explorador de Bloques &rarr;
            </a>
         </div>
      )}
    </div>
  );
}