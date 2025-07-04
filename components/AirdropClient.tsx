// En: components/AirdropClient.tsx
'use client';

import { useState } from 'react';
import type { TokenForAirdrop } from '@/app/token/[contractAddress]/page';

// Dirección del monedero de tu servidor (la pública de tu DEPLOYER_PRIVATE_KEY)
const SERVER_WALLET_ADDRESS = process.env.NEXT_PUBLIC_SERVER_WALLET_ADDRESS!;

export function AirdropClient({ token }: { token: TokenForAirdrop }) {
  const [recipients, setRecipients] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const handleAirdrop = async () => {
    setStatus('Iniciando airdrop...');
    setError('');

    // Separamos las direcciones y filtramos las que estén vacías
    const recipientList = recipients.split(/[\n,]+/).map(addr => addr.trim()).filter(Boolean);

    if (recipientList.length === 0 || !amount) {
      setError('Por favor, introduce al menos una dirección y una cantidad.');
      setStatus('');
      return;
    }

    try {
      const response = await fetch('/api/airdrops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractAddress: token.contract_address,
          chainId: token.chain_id,
          recipients: recipientList,
          amountPerRecipient: amount,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Falló la petición de airdrop.');
      }

      setStatus(result.message);
      setRecipients('');
      setAmount('');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ha ocurrido un error desconocido.');
      }
      setStatus('');
    }
  };

  return (
    <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full">
      <h1 className="text-3xl font-bold mb-2">Gestionar {token.name} (${token.ticker})</h1>
      <p className="text-sm font-mono text-purple-400 break-all">{token.contract_address}</p>

      <div className="border-t border-gray-700 my-6"></div>

      <h2 className="text-2xl font-semibold mb-4">Herramienta de Airdrop</h2>

      <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-300 p-4 rounded-md mb-6">
        <h3 className="font-bold">Instrucciones Importantes</h3>
        <p className="text-sm mt-2">1. Para usar esta herramienta, primero debes enviar la cantidad total de tokens que quieres repartir a nuestro monedero de plataforma.</p>
        <p className="font-mono text-xs mt-2 p-2 bg-gray-900 rounded break-all">{SERVER_WALLET_ADDRESS}</p>
        <p className="text-sm mt-2">2. Una vez enviados, rellena los campos de abajo y haz clic en "Iniciar Airdrop". Nuestro sistema se encargará de repartirlos y pagar todo el gas.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="recipients" className="block text-sm font-medium text-gray-300 mb-1">Direcciones de Destinatarios</label>
          <textarea
            id="recipients"
            rows={8}
            value={recipients}
            onChange={(e) => setRecipients(e.target.value)}
            placeholder="Pega aquí las direcciones, una por línea o separadas por comas."
            className="w-full p-2 bg-gray-700 text-white rounded-md border border-gray-600"
          />
        </div>
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-1">Cantidad por Destinatario</label>
          <input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Ej: 100"
            className="w-full p-2 bg-gray-700 text-white rounded-md border border-gray-600"
          />
        </div>
        <button
          onClick={handleAirdrop}
          disabled={!!status && !error}
          className="w-full py-3 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-500 transition-colors disabled:bg-gray-500"
        >
          {status ? status : '🚀 Iniciar Airdrop'}
        </button>
      </div>
      {error && <p className="mt-4 text-center text-red-400">{error}</p>}
    </div>
  );
}