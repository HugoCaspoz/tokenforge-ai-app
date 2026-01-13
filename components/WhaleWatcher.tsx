'use client';

import { useEffect, useState } from 'react';
import { useWatchContractEvent } from 'wagmi';
import { TOKEN_ABI } from '@/lib/tokenArtifacts';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';

interface WhaleWatcherProps {
    tokenAddress: `0x${string}`;
    decimals?: number;
    threshold?: number; // Minimum amount to trigger alert
}

export default function WhaleWatcher({ tokenAddress, decimals = 18, threshold = 1000 }: WhaleWatcherProps) {
    const { t } = useTranslation();
    const [lastWhaleTx, setLastWhaleTx] = useState<{
        from: string;
        to: string;
        amount: string;
        hash: string;
    } | null>(null);

    useWatchContractEvent({
        address: tokenAddress,
        abi: TOKEN_ABI,
        eventName: 'Transfer',
        onLogs(logs) {
            logs.forEach(log => {
                const { from, to, value } = log.args;
                // Value is bigint
                const formattedValue = Number(value) / (10 ** decimals);

                if (formattedValue >= threshold) {
                    const info = {
                        from: from as string,
                        to: to as string,
                        amount: formattedValue.toLocaleString(),
                        hash: log.transactionHash,
                    };
                    setLastWhaleTx(info);

                    toast.info(t('tokenDetail.growth.whaleWatcher.toastTitle'), {
                        description: t('tokenDetail.growth.whaleWatcher.toastDesc').replace('{amount}', formattedValue.toLocaleString()),
                        action: {
                            label: t('tokenDetail.growth.whaleWatcher.toastAction'),
                            onClick: () => window.open(`https://polygonscan.com/tx/${log.transactionHash}`, '_blank')
                        }
                    });
                }
            });
        },
    });

    useEffect(() => {
        if (Notification.permission !== "granted") {
            Notification.requestPermission();
        }
    }, []);

    if (!lastWhaleTx) return (
        <div className="bg-gray-900/50 p-4 rounded border border-gray-700 text-sm text-gray-500 italic">
            {t('tokenDetail.growth.whaleWatcher.listening').replace('{amount}', threshold.toLocaleString())}
        </div>
    );

    return (
        <div className="bg-blue-900/30 border border-blue-500 p-4 rounded animate-pulse">
            <h4 className="text-blue-300 font-bold flex items-center gap-2 mb-2">
                {t('tokenDetail.growth.whaleWatcher.detected')}
            </h4>
            <div className="text-sm font-mono space-y-1">
                <p><span className="text-gray-400">{t('tokenDetail.growth.whaleWatcher.amount')}</span> <span className="text-white font-bold">{lastWhaleTx.amount}</span></p>
                <p><span className="text-gray-400">{t('tokenDetail.growth.whaleWatcher.from')}</span> {lastWhaleTx.from?.slice(0, 6)}...{lastWhaleTx.from?.slice(-4)}</p>
                <p><span className="text-gray-400">{t('tokenDetail.growth.whaleWatcher.to')}</span> {lastWhaleTx.to?.slice(0, 6)}...{lastWhaleTx.to?.slice(-4)}</p>
                <a
                    href={`https://polygonscan.com/tx/${lastWhaleTx.hash}`}
                    target="_blank"
                    className="text-xs text-blue-400 underline mt-2 block"
                >
                    {t('tokenDetail.growth.whaleWatcher.viewTx')}
                </a>
            </div>
            <button
                onClick={() => setLastWhaleTx(null)}
                className="mt-3 text-xs bg-blue-800 hover:bg-blue-700 px-2 py-1 rounded text-white"
            >
                {t('tokenDetail.growth.whaleWatcher.clear')}
            </button>
        </div>
    );
}
