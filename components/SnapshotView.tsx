import { useState } from 'react';
import { Holder } from '@/hooks/useHolders';
import { useTranslation } from '@/lib/i18n';

interface SnapshotViewProps {
    holders: Holder[];
    loading: boolean;
    onSelectForAirdrop: (selectedAddresses: string[]) => void;
}

export default function SnapshotView({ holders, loading, onSelectForAirdrop }: SnapshotViewProps) {
    const { t } = useTranslation();
    const [selected, setSelected] = useState<Set<string>>(new Set());

    const toggleSelect = (address: string) => {
        const newSelected = new Set(selected);
        if (newSelected.has(address)) {
            newSelected.delete(address);
        } else {
            newSelected.add(address);
        }
        setSelected(newSelected);
        onSelectForAirdrop(Array.from(newSelected));
    };

    const selectAll = () => {
        if (selected.size === holders.length) {
            setSelected(new Set());
            onSelectForAirdrop([]);
        } else {
            const all = new Set(holders.map(h => h.address));
            setSelected(all);
            onSelectForAirdrop(Array.from(all));
        }
    };

    if (loading) {
        return <div className="text-center py-10 text-gray-400">{t('tokenDetail.community.snapshot.loading')}</div>;
    }

    if (holders.length === 0) {
        return <div className="text-center py-10 text-gray-400">{t('tokenDetail.community.snapshot.noHolders')}</div>;
    }

    return (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                <h3 className="font-bold text-white">{t('tokenDetail.community.snapshot.title').replace('{count}', String(holders.length))}</h3>
                <button
                    onClick={() => {
                        const csv = "Address,Balance,Percentage\n" + holders.map(h => `${h.address},${h.balance},${h.percentage.toFixed(2)}%`).join("\n");
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'snapshot.csv';
                        a.click();
                    }}
                    className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded transition-colors"
                >
                    {t('tokenDetail.community.snapshot.export')}
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-gray-900/50 text-gray-200 uppercase text-xs">
                        <tr>
                            <th className="p-4 w-10">
                                <input
                                    type="checkbox"
                                    checked={selected.size === holders.length && holders.length > 0}
                                    onChange={selectAll}
                                    className="rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500"
                                />
                            </th>
                            <th className="p-4">{t('tokenDetail.community.snapshot.rank')}</th>
                            <th className="p-4">{t('tokenDetail.community.snapshot.address')}</th>
                            <th className="p-4 text-right">{t('tokenDetail.community.snapshot.balance')}</th>
                            <th className="p-4 text-right">{t('tokenDetail.community.snapshot.percentage')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {holders.map((holder, index) => (
                            <tr key={holder.address} className="hover:bg-gray-700/30 transition-colors">
                                <td className="p-4">
                                    <input
                                        type="checkbox"
                                        checked={selected.has(holder.address)}
                                        onChange={() => toggleSelect(holder.address)}
                                        className="rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500"
                                    />
                                </td>
                                <td className="p-4 font-mono text-gray-500">#{index + 1}</td>
                                <td className="p-4 font-mono text-purple-400">
                                    {holder.address.slice(0, 6)}...{holder.address.slice(-4)}
                                </td>
                                <td className="p-4 text-right font-bold text-white">{holder.balance}</td>
                                <td className="p-4 text-right">{holder.percentage.toFixed(2)}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
