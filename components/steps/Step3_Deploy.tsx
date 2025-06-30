// En: frontend/components/steps/Step3_Deploy.tsx
'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import type { TokenData } from '../Wizard';
import contractArtifact from '@/lib/contracts/TokenForgeERC20.json';

interface Step3Props {
  tokenData: TokenData;
}

export default function Step3_Deploy({ tokenData }: Step3Props) {
  const [supply, setSupply] = useState(1000000);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [contractAddress, setContractAddress] = useState('');

  const handleDeploy = async () => {
    setStatus('Iniciando despliegue...');
    setError('');
    setContractAddress('');

    if (typeof window.ethereum === 'undefined') {
      setError('Por favor, instala MetaMask para continuar.');
      setStatus('');
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const factory = new ethers.ContractFactory(
        contractArtifact.abi,
        contractArtifact.bytecode,
        signer
      );

      setStatus('Enviando transacción a MetaMask... Por favor, aprueba la transacción.');

      const contract = await factory.deploy(
        await signer.getAddress(),
        tokenData.name,
        tokenData.ticker,
        supply
      );

      setStatus('Desplegando el contrato en la blockchain... Esto puede tardar unos segundos.');
      await contract.waitForDeployment();
      
      const address = await contract.getAddress();
      setContractAddress(address);
      setStatus('¡Contrato desplegado con éxito!');

    } catch (err) { // <--- CAMBIO AQUÍ
      console.error(err);
      // Ethers often throws errors with a 'reason' property
      const a = err as { reason?: string, message?: string};
      setError(a.reason || a.message || 'Ha ocurrido un error desconocido.');
      setStatus('');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Paso 3: Configuración y Lanzamiento</h2>
      <p className="text-gray-400 mb-6">Estás a punto de lanzar tu token. Define la cantidad total de monedas y despliega tu contrato en la red de pruebas Sepolia.</p>
      
      <div className="mb-4">
        <label htmlFor="supply" className="block text-sm font-medium text-gray-300 mb-1">Cantidad Total (Total Supply)</label>
        <input 
          type="number" 
          id="supply"
          value={supply}
          onChange={(e) => setSupply(Number(e.target.value))}
          className="w-full p-2 bg-gray-700 text-white rounded-md border border-gray-600"
        />
      </div>

      <button
        onClick={handleDeploy}
        disabled={!!status && status !== '¡Contrato desplegado con éxito!'}
        className="w-full px-6 py-4 bg-green-600 text-white font-bold text-lg rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-500"
      >
        🚀 ¡Lanzar mi Token!
      </button>

      {status && <p className="mt-4 text-center text-blue-300 animate-pulse">{status}</p>}
      {error && <p className="mt-4 text-center text-red-400">{error}</p>}
      
      {contractAddress && (
        <div className="mt-6 text-center p-4 bg-purple-900/50 border border-purple-700 rounded-md">
            <h3 className="font-bold text-xl text-purple-300">🎉 ¡Felicidades! 🎉</h3>
            <p className="text-white mt-2">Tu token ha sido creado en la siguiente dirección:</p>
            <p className="font-mono text-sm bg-gray-900 p-2 rounded mt-2 break-all">{contractAddress}</p>
            <a 
                href={`https://sepolia.etherscan.io/token/${contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 text-blue-400 hover:text-blue-300"
            >
                Ver en el Explorador de Bloques (Sepolia Etherscan) &rarr;
            </a>
        </div>
      )}
    </div>
  );
}