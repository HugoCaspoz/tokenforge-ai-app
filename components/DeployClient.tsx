// En: frontend/components/DeployClient.tsx
'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import contractArtifact from '@/lib/contracts/TokenForgeERC20.json';
import { ProjectForDeploy } from '@/app/deploy/[projectId]/page';

// Configuración de la red de despliegue (Ejemplo con Polygon Mainnet)
const targetNetwork = {
  name: 'Polygon Mainnet',
  chainId: '0x89', // 137 en hexadecimal
};

export function DeployClient({ project }: { project: ProjectForDeploy }) {
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [contractAddress, setContractAddress] = useState('');
  
  const handleDeploy = async () => {
    setStatus(`Iniciando despliegue en ${targetNetwork.name}...`);
    setError('');

    if (typeof window.ethereum === 'undefined') {
      return setError('Por favor, instala MetaMask.');
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Pedimos al usuario que cambie a la red correcta si no está en ella
      await provider.send('wallet_switchEthereumChain', [{ chainId: targetNetwork.chainId }]);
      
      const signer = await provider.getSigner();
      const factory = new ethers.ContractFactory(contractArtifact.abi, contractArtifact.bytecode, signer);
      
      setStatus('Enviando transacción a MetaMask... Por favor, aprueba la transacción.');
      const contract = await factory.deploy(
        await signer.getAddress(),
        project.name,
        project.ticker,
        project.supply || 1000000 // Usa el supply guardado o un valor por defecto
      );

      setStatus(`Desplegando en ${targetNetwork.name}... Esto puede tardar unos segundos.`);
      await contract.waitForDeployment();
      
      const address = await contract.getAddress();
      setContractAddress(address);
      setStatus(`¡Contrato desplegado con éxito en ${targetNetwork.name}!`);

    } catch (err: any) {
      setError(err.reason || err.message || 'Error desconocido.');
      setStatus('');
    }
  };

  return (
    <div className="bg-gray-800 p-8 rounded-lg shadow-xl ring-1 ring-green-500">
      <h1 className="text-3xl font-bold text-center mb-2">Desplegar Token</h1>
      <p className="text-center text-gray-400 mb-6">Estás a punto de lanzar tu token en una red real.</p>

      <div className="bg-gray-900 p-4 rounded-md mb-6 space-y-1">
        <p><strong>Nombre:</strong> {project.name}</p>
        <p><strong>Ticker:</strong> ${project.ticker.toUpperCase()}</p>
        <p><strong>Supply:</strong> {(project.supply || 1000000).toLocaleString()}</p>
      </div>

      <button 
        onClick={handleDeploy} 
        disabled={!!contractAddress} 
        className="w-full py-3 bg-purple-600 text-white font-bold rounded-md hover:bg-purple-500 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
      >
        🚀 Desplegar en {targetNetwork.name}
      </button>

      {status && <p className="mt-4 text-center text-blue-300">{status}</p>}
      {error && <p className="mt-4 text-center text-red-400">{error}</p>}

      {contractAddress && (
         <div className="mt-4 text-center">
            <p className="text-white">Tu token está en la dirección:</p>
            <p className="font-mono text-sm bg-gray-900 p-2 rounded mt-2 break-all">{contractAddress}</p>
            <a 
                href={`https://polygonscan.com/token/${contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 text-blue-400 hover:text-blue-300"
            >
                Ver en Polygonscan &rarr;
            </a>
         </div>
      )}
    </div>
  );
}