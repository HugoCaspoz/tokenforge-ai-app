import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { TOKEN_ABI } from '@/lib/tokenArtifacts';
import { toast } from 'sonner';

interface AirdropToolProps {
    tokenAddress: string;
    selectedAddresses: string[];
}

export default function AirdropTool({ tokenAddress, selectedAddresses }: AirdropToolProps) {
    const [amountPerUser, setAmountPerUser] = useState('');

    const { data: hash, writeContract, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const handleAirdrop = () => {
        if (!amountPerUser || selectedAddresses.length === 0) return;

        try {
            const amountWei = parseEther(amountPerUser);
            // Create array of amounts (same for everyone for now)
            const amounts = selectedAddresses.map(() => amountWei);

            writeContract({
                address: tokenAddress as `0x${string}`,
                abi: TOKEN_ABI,
                functionName: 'multisend',
                args: [selectedAddresses as `0x${string}`[], amounts],
            });
        } catch (e) {
            console.error(e);
            toast.error("Error preparando airdrop");
        }
    };

    if (isSuccess) {
        toast.success("¡Airdrop enviado con éxito!");
    }

    return (
        <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                🪂 Airdrop Pro
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                        Destinatarios Seleccionados
                    </label>
                    <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700 text-white font-mono">
                        {selectedAddresses.length} usuarios
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                        Cantidad por Usuario
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            value={amountPerUser}
                            onChange={(e) => setAmountPerUser(e.target.value)}
                            placeholder="0.00"
                            className="block w-full rounded-lg border-gray-600 bg-gray-700 text-white shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2.5"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <span className="text-gray-400 text-xs">TOKENS</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6">
                <button
                    onClick={handleAirdrop}
                    disabled={isPending || isConfirming || selectedAddresses.length === 0 || !amountPerUser}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02]"
                >
                    {isPending || isConfirming ? 'Enviando Airdrop...' : `Enviar Airdrop a ${selectedAddresses.length} usuarios`}
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                    * Se enviarán {amountPerUser || 0} tokens a cada dirección seleccionada. Asegúrate de tener saldo suficiente.
                </p>
            </div>
        </div>
    );
}
