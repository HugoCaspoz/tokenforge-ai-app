import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { TOKEN_ABI } from '@/lib/tokenArtifacts';

export interface Holder {
    address: string;
    balance: string; // Formatted string
    balanceWei: bigint;
    percentage: number;
}

export function useHolders(tokenAddress: string, rpcUrl: string) {
    const [holders, setHolders] = useState<Holder[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!tokenAddress || !rpcUrl) return;

        const fetchHolders = async () => {
            setLoading(true);
            setError(null);
            try {
                const provider = new ethers.JsonRpcProvider(rpcUrl);
                const contract = new ethers.Contract(tokenAddress, TOKEN_ABI, provider);

                // 1. Get Total Supply
                const totalSupply = await contract.totalSupply();

                // 2. Get All Transfer Events (Restricted Range to avoid RPC overload)
                // Polygon block time ~2s. 
                // Reduced to 3,000 blocks (~1.5 hours) to satisfy strict RPC limits on free tier.
                const currentBlock = await provider.getBlockNumber();
                const fromBlock = Math.max(0, currentBlock - 100);

                const filter = contract.filters.Transfer();
                const logs = await contract.queryFilter(filter, fromBlock, 'latest');

                // 3. Aggregate Balances
                const balances = new Map<string, bigint>();

                logs.forEach((log: any) => {
                    const { from, to, value } = log.args;

                    if (from !== ethers.ZeroAddress) {
                        const current = balances.get(from) || BigInt(0);
                        balances.set(from, current - value);
                    }

                    if (to !== ethers.ZeroAddress) {
                        const current = balances.get(to) || BigInt(0);
                        balances.set(to, current + value);
                    }
                });

                // 4. Convert to Array and Sort
                const holdersList: Holder[] = [];
                const totalSupplyFloat = parseFloat(ethers.formatEther(totalSupply));

                balances.forEach((balance, address) => {
                    if (balance > BigInt(0)) {
                        const balanceFormatted = ethers.formatEther(balance);
                        const percentage = (parseFloat(balanceFormatted) / totalSupplyFloat) * 100;

                        holdersList.push({
                            address,
                            balance: parseFloat(balanceFormatted).toLocaleString(undefined, { maximumFractionDigits: 2 }),
                            balanceWei: balance,
                            percentage
                        });
                    }
                });

                // Sort by balance descending
                holdersList.sort((a, b) => {
                    if (a.balanceWei > b.balanceWei) return -1;
                    if (a.balanceWei < b.balanceWei) return 1;
                    return 0;
                });

                setHolders(holdersList);

            } catch (err: any) {
                console.error("Error fetching holders:", err);
                setError(err.message || "Failed to fetch holders");
            } finally {
                setLoading(false);
            }
        };

        fetchHolders();
    }, [tokenAddress, rpcUrl]);

    return { holders, loading, error };
}
