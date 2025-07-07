'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi'; // Para obtener la dirección de la billetera conectada
import { createClient } from '@/utils/supabase/client'; // Para obtener el usuario si es necesario

interface AirdropClientProps {
  contractAddress: string; // Dirección del contrato del token que se va a hacer airdrop
  tokenSymbol: string;     // Símbolo del token (ej. 'TKN')
  tokenDecimals: number;   // Decimales del token (ej. 18)
}

export function AirdropClient({ contractAddress, tokenSymbol, tokenDecimals }: AirdropClientProps) {
  const { address: userWalletAddress, isConnected } = useAccount();
  const supabase = createClient();

  const [recipientsInput, setRecipientsInput] = useState<string>('');
  const [amountPerRecipient, setAmountPerRecipient] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userHasPermission, setUserHasPermission] = useState(false); // Para verificar si el usuario es el dueño del token

  useEffect(() => {
    const verifyPermission = async () => {
      // Si el usuario no tiene la billetera conectada, no puede ser el dueño
      if (!isConnected || !userWalletAddress) {
        setUserHasPermission(false);
        return;
      }

      // TODO: Implementar la lógica para verificar si el userWalletAddress es el propietario
      // o tiene permiso para hacer airdrop de este token.
      // Esto podría implicar:
      // 1. Consultar tu base de datos de Supabase para ver si el user_id está asociado al token.
      // 2. Si el token tiene una función 'owner()' en el contrato, podrías llamarla (requiere proveedor RPC).
      // Por ahora, asumiremos que el backend lo verificará, o que para fines de UI, si está conectado es suficiente.
      // Aquí, por simplicidad, si la billetera está conectada, asumimos permiso para el UI.
      setUserHasPermission(true); // Asumiendo permiso si está conectado. DEBE SER REVISADO EN EL BACKEND.
    };

    verifyPermission();
  }, [isConnected, userWalletAddress, contractAddress, supabase]);


  const parseRecipients = (input: string): string[] => {
    // Divide por comas, saltos de línea o espacios y filtra entradas vacías
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
      // ✅ Llama a tu endpoint de backend para iniciar el airdrop
      // Este endpoint manejará la interacción con la blockchain, la firma, etc.
      const response = await fetch('/api/airdrops/start', { // Ajusta esta URL si tu endpoint está en otro lugar
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Opcional: Si tu API necesita el token de sesión de Supabase, lo obtendrías aquí
          // 'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          tokenContractAddress: contractAddress,
          tokenSymbol: tokenSymbol,
          tokenDecimals: tokenDecimals,
          recipients: recipients,
          amountPerRecipient: amount,
          initiatorAddress: userWalletAddress, // Dirección de la billetera del usuario que inicia
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar el airdrop en el servidor.');
      }

      setSuccess(`Airdrop iniciado con éxito. ID de transacción: ${data.transactionHash || 'N/A'}. Puede tomar un tiempo en confirmarse.`);
      setRecipientsInput(''); // Limpiar inputs después del éxito
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
        <div className="mt-4">
            {/* Asume que ConnectWallet está disponible globalmente o se importa */}
            {/* Si no, el usuario ya debería haber conectado su wallet a través del Header */}
            {/* <ConnectWallet /> */}
            <p className="text-gray-400 text-sm">Asegúrate de que tu billetera esté conectada.</p>
        </div>
      </div>
    );
  }

  if (!userHasPermission) {
    return (
      <div className="bg-red-900/20 text-red-400 p-6 rounded-lg text-center border border-red-600">
        <p>No tienes los permisos necesarios para realizar un airdrop para este token.</p>
        <p className="text-sm mt-2">Asegúrate de ser el propietario o tener la autorización adecuada.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-purple-700">
      <h2 className="text-2xl font-bold text-white mb-4">Airdrop de {tokenSymbol}</h2>
      <p className="text-gray-400 mb-6">Envía {tokenSymbol} a múltiples direcciones en una sola transacción.</p>

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
        <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-2">
          Cantidad de {tokenSymbol} por Destinatario
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
        {loading ? 'Preparando Airdrop...' : `Iniciar Airdrop de ${tokenSymbol}`}
      </button>

      {error && <p className="mt-4 text-center text-red-400">{error}</p>}
      {success && <p className="mt-4 text-center text-green-400">{success}</p>}
    </div>
  );
}