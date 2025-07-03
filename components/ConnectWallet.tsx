'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useEffect, useState } from 'react'; // <-- 1. Importa useEffect y useState

export function ConnectWallet() {
  const [isClient, setIsClient] = useState(false); // <-- 2. Añade un estado para saber si es cliente
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();

  // 3. useEffect solo se ejecuta en el cliente, después del primer render
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 4. Si aún no estamos en el cliente, no renderizamos nada (o un placeholder)
  //    Esto asegura que el servidor y el primer render del cliente sean iguales.
  if (!isClient) {
    return null;
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-4">
        <div className="text-sm font-mono bg-gray-700 px-3 py-2 rounded-md">
          {`${address?.slice(0, 6)}...${address?.slice(-4)}`}
        </div>
        <button
          onClick={() => disconnect()}
          className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-md transition-colors"
        >
          Desconectar
        </button>
      </div>
    );
  }

  const injectedConnector = connectors.find(c => c.id === 'injected');

  return (
    <div>
      {injectedConnector && (
          <button
            key={injectedConnector.id}
            onClick={() => connect({ connector: injectedConnector })}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-md transition-colors"
          >
            Conectar Billetera
          </button>
      )}
    </div>
  );
}