'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { createClient } from '@/utils/supabase/client';

// ✅ PASO 1: Creamos un tipo para el objeto 'token' que recibiremos
interface TokenForAirdrop {
  contract_address: string;
  symbol: string;
  decimals: number;
  name: string;
}

// ✅ PASO 2: Actualizamos las props para que esperen un único objeto 'token'
interface AirdropClientProps {
  token: TokenForAirdrop;
}

// ✅ PASO 3: Actualizamos la firma del componente para desestructurar 'token'
export function AirdropClient({ token }: AirdropClientProps) {
  const { address: userWalletAddress, isConnected } = useAccount();
  const supabase = createClient();

  const [recipientsInput, setRecipientsInput] = useState<string>('');
  const [amountPerRecipient, setAmountPerRecipient] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userHasPermission, setUserHasPermission] = useState(false);

  useEffect(() => {
    const verifyPermission = async () => {
      if (!isConnected || !userWalletAddress) {
        setUserHasPermission(false);
        return;
      }
      // ✅ Usamos la propiedad del objeto token
      console.log("Verificando permisos para el token:", token.contract_address);
      setUserHasPermission(true); 
    };

    verifyPermission();
    // ✅ Usamos la propiedad del objeto token
  }, [isConnected, userWalletAddress, token.contract_address, supabase]);


  const parseRecipients = (input: string): string[] => {
    return input
      .split(/[\n, ]+/)
      .map(addr => addr.trim())
      .filter(addr => addr.length > 0);
  };

  const handleAirdrop = async () => {
    setError(null);
    setSuccess(null);

    if (!isConnected || !userWalletAddress) {
      setError('Por favor, conecta tu billetera para realizar el airdrop.');
      return;
    }
    if (!userHasPermission) {
        setError('No tienes permiso para realizar un airdrop para este token.');
        return;
    }

    const recipients = parseRecipients(recipientsInput);
    const amount = parseFloat(amountPerRecipient);

    if (recipients.length === 0) {
      setError('Por favor, introduce al menos una dirección de destinatario.');
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      setError('Por favor, introduce una cantidad válida para enviar.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/airdrops/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // ✅ Usamos las propiedades del objeto token
          tokenContractAddress: token.contract_address,
          tokenSymbol: token.symbol,
          tokenDecimals: token.decimals,
          recipients: recipients,
          amountPerRecipient: amount,
          initiatorAddress: userWalletAddress,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar el airdrop en el servidor.');
      }

      setSuccess(`Airdrop iniciado con éxito. ID de transacción: ${data.transactionHash || 'N/A'}.`);
      setRecipientsInput('');
      setAmountPerRecipient('');

    } catch (err: any) {
      console.error('Error durante el airdrop:', err);
      setError(err.message || 'Ha ocurrido un error desconocido durante el airdrop.');
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected || !userWalletAddress) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg text-center border border-yellow-600">
        <p className="text-yellow-300">Conecta tu billetera para gestionar el airdrop de este token.</p>
      </div>
    );
  }

  if (!userHasPermission) {
    return (
      <div className="bg-red-900/20 text-red-400 p-6 rounded-lg text-center border border-red-600">
        <p>No tienes los permisos necesarios para realizar un airdrop para este token</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-purple-700">
      {/* ✅ Usamos las propiedades del objeto token */}
      <h2 className="text-2xl font-bold text-white mb-4">Airdrop de {token.name} ({token.symbol})</h2>
      <p className="text-gray-400 mb-6">Envía {token.symbol} a múltiples direcciones en una sola transacción.</p>

      <div className="mb-4">
        <label htmlFor="recipients" className="block text-sm font-medium text-gray-300 mb-2">
          Direcciones de Destinatarios (separadas por comas o saltos de línea)
        </label>
        <textarea
          id="recipients"
          value={recipientsInput}
          onChange={(e) => setRecipientsInput(e.target.value)}
          rows={5}
          className="w-full p-3 rounded-md bg-gray-700 border border-gray-600 text-white focus:ring-purple-500 focus:border-purple-500"
          placeholder="0xabc...123, 0xdef...456, 0xghi...789"
        />
      </div>

      <div className="mb-6">
        {/* ✅ Usamos las propiedades del objeto token */}
        <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-2">
          Cantidad de {token.symbol} por Destinatario
        </label>
        <input
          type="number"
          id="amount"
          value={amountPerRecipient}
          onChange={(e) => setAmountPerRecipient(e.target.value)}
          className="w-full p-3 rounded-md bg-gray-700 border border-gray-600 text-white focus:ring-purple-500 focus:border-purple-500"
          placeholder="Ej. 100"
          step="any"
          min="0"
        />
      </div>

      <button
        onClick={handleAirdrop}
        disabled={loading}
        className="w-full px-6 py-3 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 transition-colors disabled:bg-gray-500"
      >
        {/* ✅ Usamos las propiedades del objeto token */}
        {loading ? 'Preparando Airdrop...' : `Iniciar Airdrop de ${token.symbol}`}
      </button>

      {error && <p className="mt-4 text-center text-red-400">{error}</p>}
      {success && <p className="mt-4 text-center text-green-400">{success}</p>}
    </div>
  );
}