'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { LOCKER_ABI } from '@/lib/lockerArtifacts';
import { TOKEN_ABI } from '@/lib/tokenArtifacts'; // Using standard ERC20 ABI
import { createClient } from '@/utils/supabase/client';

// TODO: Replace with deployed contract address
const LOCKER_ADDRESS = "0x60fD775038d1b64986F38f0e02942B59245084ea";

export default function LiquidityLocker({ defaultTokenAddress }: { defaultTokenAddress?: string }) {
    const { address } = useAccount();
    const [tokenAddress, setTokenAddress] = useState('');
    const [amount, setAmount] = useState('');
    const [unlockDate, setUnlockDate] = useState('');
    const [isApproving, setIsApproving] = useState(false);

    // Auto-fill from prop
    useEffect(() => {
        if (defaultTokenAddress) {
            setTokenAddress(defaultTokenAddress);
        }
    }, [defaultTokenAddress]);

    const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();

    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash,
    });

    // Read user locks
    const { data: userLocks, refetch: refetchLocks } = useReadContract({
        address: LOCKER_ADDRESS,
        abi: LOCKER_ABI,
        functionName: 'getLocksByOwner',
        args: [address as `0x${string}`],
        query: {
            enabled: !!address,
        }
    });

    const handleApprove = async () => {
        if (!tokenAddress || !amount) return;
        setIsApproving(true);
        try {
            writeContract({
                address: tokenAddress as `0x${string}`,
                abi: TOKEN_ABI,
                functionName: 'approve',
                args: [LOCKER_ADDRESS, parseUnits(amount, 18)], // Assuming 18 decimals for now
            });
        } catch (e) {
            console.error(e);
        } finally {
            setIsApproving(false);
        }
    };

    const handleLock = async () => {
        if (!tokenAddress || !amount || !unlockDate) return;
        const timestamp = Math.floor(new Date(unlockDate).getTime() / 1000);

        writeContract({
            address: LOCKER_ADDRESS,
            abi: LOCKER_ABI,
            functionName: 'lock',
            args: [tokenAddress as `0x${string}`, parseUnits(amount, 18), BigInt(timestamp)],
        }, {
            onSuccess: async () => {
                // Update DB to mark project as locked with expiration date
                const supabase = createClient();
                // Convert local datetime string to ISO string for DB
                const isoDate = new Date(unlockDate).toISOString();

                await supabase.from('projects').update({
                    is_locked: true,
                    locked_until: isoDate
                }).eq('contract_address', tokenAddress);

                alert("¡Liquidez Bloqueada con Éxito!");
            }
        });
    };

    const handleWithdraw = async (lockId: bigint) => {
        writeContract({
            address: LOCKER_ADDRESS,
            abi: LOCKER_ABI,
            functionName: 'withdraw',
            args: [lockId],
        });
    };

    return (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h2 className="text-2xl font-bold mb-6 text-purple-400">🔒 Liquidity Locker</h2>



            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Create Lock Form */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Create New Lock</h3>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">
                            LP Token Address
                            {defaultTokenAddress && <span className="ml-2 text-green-400 text-xs font-bold">✅ Detectado Automáticamente</span>}
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={tokenAddress}
                                onChange={(e) => setTokenAddress(e.target.value)}
                                placeholder="0x..."
                                readOnly={!!defaultTokenAddress}
                                className={`w-full border border-gray-600 rounded p-3 text-white focus:border-purple-500 outline-none ${defaultTokenAddress ? 'bg-gray-800 text-gray-400 cursor-not-allowed' : 'bg-gray-900'}`}
                            />
                            {defaultTokenAddress && (
                                <span className="absolute right-3 top-3 text-lg">🔒</span>
                            )}
                        </div>
                        {defaultTokenAddress && <p className="text-xs text-gray-500 mt-1">Dirección del par detectada y bloqueada por seguridad.</p>}
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Amount</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.0"
                            className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-white focus:border-purple-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Unlock Date</label>
                        <input
                            type="datetime-local"
                            value={unlockDate}
                            onChange={(e) => setUnlockDate(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-white focus:border-purple-500 outline-none"
                        />
                    </div>

                    <div className="flex gap-4 pt-2">
                        <button
                            onClick={handleApprove}
                            disabled={isPending || isConfirming}
                            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded transition-colors"
                        >
                            1. Approve
                        </button>
                        <button
                            onClick={handleLock}
                            disabled={isPending || isConfirming}
                            className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-4 rounded transition-colors"
                        >
                            2. Lock
                        </button>
                    </div>

                    {hash && <div className="text-xs text-gray-400 truncate">Tx: {hash}</div>}
                    {isConfirming && <div className="text-yellow-400 text-sm">Confirming...</div>}
                    {isConfirmed && <div className="text-green-400 text-sm">Transaction Confirmed!</div>}
                    {writeError && <div className="text-red-400 text-sm break-words">{writeError.message}</div>}
                </div>

                {/* Your Locks List */}
                <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Your Locks</h3>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        {userLocks && userLocks.length > 0 ? (
                            userLocks
                                .filter((lock: any) => !defaultTokenAddress || lock.token.toLowerCase() === defaultTokenAddress.toLowerCase())
                                .map((lock: any) => (
                                    <div key={lock.id.toString()} className="bg-gray-900 p-4 rounded border border-gray-700">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs text-gray-500">ID: {lock.id.toString()}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded ${lock.withdrawn ? 'bg-gray-700 text-gray-400' : 'bg-green-900 text-green-400'}`}>
                                                {lock.withdrawn ? 'Withdrawn' : 'Active'}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-300 mb-1">
                                            Token: <span className="font-mono text-xs">{lock.token.slice(0, 6)}...{lock.token.slice(-4)}</span>
                                        </div>
                                        <div className="text-sm text-gray-300 mb-1">
                                            Amount: <span className="font-mono text-white">{formatUnits(lock.amount, 18)}</span>
                                        </div>
                                        <div className="text-sm text-gray-300 mb-3">
                                            Unlock: {new Date(Number(lock.unlockTime) * 1000).toLocaleString()}
                                        </div>

                                        {!lock.withdrawn && (
                                            <button
                                                onClick={() => handleWithdraw(lock.id)}
                                                disabled={Date.now() < Number(lock.unlockTime) * 1000 || isPending}
                                                className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 rounded text-sm font-bold transition-colors"
                                            >
                                                {Date.now() < Number(lock.unlockTime) * 1000
                                                    ? `Locked (${Math.ceil((Number(lock.unlockTime) * 1000 - Date.now()) / (1000 * 60 * 60 * 24))} days left)`
                                                    : 'Withdraw Funds'}
                                            </button>
                                        )}
                                    </div>
                                ))
                        ) : (
                            <p className="text-gray-500 text-sm text-center py-8">No locks found.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
