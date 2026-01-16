import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useAccount, useWriteContract, usePublicClient, useReadContract } from 'wagmi';
import { parseUnits, maxUint256, formatEther } from 'viem';
import { TOKEN_ABI } from '../lib/tokenArtifacts';

// QuickSwap V2 Addresses on Polygon
const ROUTER_ADDRESS = '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff';
const FACTORY_ADDRESS = '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32';
const WMATIC = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270';

// QuickSwap V2 ABIs
const ROUTER_ABI = [
    {
        "inputs": [
            { "internalType": "address", "name": "token", "type": "address" },
            { "internalType": "uint256", "name": "amountTokenDesired", "type": "uint256" },
            { "internalType": "uint256", "name": "amountTokenMin", "type": "uint256" },
            { "internalType": "uint256", "name": "amountETHMin", "type": "uint256" },
            { "internalType": "address", "name": "to", "type": "address" },
            { "internalType": "uint256", "name": "deadline", "type": "uint256" }
        ],
        "name": "addLiquidityETH",
        "outputs": [
            { "internalType": "uint256", "name": "amountToken", "type": "uint256" },
            { "internalType": "uint256", "name": "amountETH", "type": "uint256" },
            { "internalType": "uint256", "name": "liquidity", "type": "uint256" }
        ],
        "stateMutability": "payable",
        "type": "function"
    }
] as const;

const FACTORY_ABI = [{
    "inputs": [
        { "internalType": "address", "name": "tokenA", "type": "address" },
        { "internalType": "address", "name": "tokenB", "type": "address" }
    ],
    "name": "getPair",
    "outputs": [{ "internalType": "address", "name": "pair", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
}] as const;

export default function LiquidityWizard({ tokenAddress, tokenSymbol, decoupled, onPoolFound }: { tokenAddress: `0x${string}`, tokenSymbol: string, decoupled?: boolean, onPoolFound?: (addr: string) => void }) {
    const { address, chainId } = useAccount();
    const publicClient = usePublicClient();
    const { t } = useTranslation();

    const [amountToken, setAmountToken] = useState('');
    const [amountPOL, setAmountPOL] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Check if Pool (Pair) Exists - V2
    const { data: pairAddress, refetch: refetchPair } = useReadContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: 'getPair',
        args: [tokenAddress, WMATIC],
    });

    const poolExists = pairAddress && pairAddress !== '0x0000000000000000000000000000000000000000';

    useEffect(() => {
        if (poolExists && onPoolFound) {
            onPoolFound(pairAddress as string);
        }
    }, [poolExists, pairAddress, onPoolFound]);

    const { writeContractAsync } = useWriteContract();

    // Helper to wait for tx
    const waitTx = async (hash: `0x${string}`, loadingMsg: string) => {
        setIsProcessing(true);
        try {
            console.log("Waiting for tx:", hash);
            const receipt = await publicClient?.waitForTransactionReceipt({ hash });
            if (receipt?.status !== 'success') throw new Error("Transaction Refunded/Failed on chain.");
            return receipt;
        } catch (e) {
            throw e;
        }
    };

    // STEP 1: APPROVE ROUTER
    const handleApprove = async () => {
        if (!amountToken) return;
        setIsProcessing(true);
        try {
            const hash = await writeContractAsync({
                address: tokenAddress,
                abi: TOKEN_ABI,
                functionName: 'approve',
                args: [ROUTER_ADDRESS, maxUint256],
            });
            await waitTx(hash, t('tokenDetail.growth.liquidityWizard.approving'));
            alert(t('tokenDetail.growth.liquidityWizard.successApprove'));
        } catch (e) {
            console.error(e);
            alert(t('tokenDetail.growth.liquidityWizard.errorApprove') + ((e as any).shortMessage || (e as any).message));
        } finally {
            setIsProcessing(false);
        }
    };

    // STEP 2: ADD LIQUIDITY V2
    const handleAddLiquidity = async () => {
        if (!amountToken || !amountPOL || !address) return;
        setIsProcessing(true);
        try {
            const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 mins

            // Slippage 5% for simplicity in V2
            // We use 0 for min amounts to avoid reverts on first add, but in production should be calculated.
            // For simple token launch, 0 is often acceptable risk if user is first provider.
            const amountTokenMin = 0n;
            const amountETHMin = 0n;

            const hash = await writeContractAsync({
                address: ROUTER_ADDRESS,
                abi: ROUTER_ABI,
                functionName: 'addLiquidityETH',
                args: [
                    tokenAddress,
                    parseUnits(amountToken, 18), // desired token
                    amountTokenMin,              // min token
                    amountETHMin,                // min eth
                    address,                     // to
                    BigInt(deadline)
                ],
                value: parseUnits(amountPOL, 18), // native token amount
            });

            await waitTx(hash, t('tokenDetail.growth.liquidityWizard.adding'));
            await refetchPair();
            alert(t('tokenDetail.growth.liquidityWizard.successAdd'));
        } catch (e) {
            console.error(e);
            alert(t('tokenDetail.growth.liquidityWizard.errorAdd') + ((e as any).shortMessage || (e as any).message));
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 w-full">
            <h2 className="text-2xl font-bold mb-6 text-purple-400">
                {t('tokenDetail.growth.liquidityWizard.title')} (QuickSwap V2)
            </h2>

            {chainId !== 137 && (
                <div className="bg-yellow-900/50 text-yellow-200 p-3 rounded mb-4 text-sm">
                    {t('tokenDetail.growth.liquidityWizard.wrongNetwork')}
                </div>
            )}

            <div className="space-y-6">
                <div>
                    <label className="block text-sm text-gray-400 mb-1">
                        {t('tokenDetail.growth.liquidityWizard.tokensLabel').replace('{symbol}', tokenSymbol)}
                    </label>
                    <input
                        type="number"
                        value={amountToken}
                        onChange={(e) => setAmountToken(e.target.value)}
                        placeholder="0.0"
                        className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-white focus:border-purple-500 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm text-gray-400 mb-1">
                        {t('tokenDetail.growth.liquidityWizard.polLabel')}
                    </label>
                    <input
                        type="number"
                        value={amountPOL}
                        onChange={(e) => setAmountPOL(e.target.value)}
                        placeholder="0.0"
                        className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-white focus:border-purple-500 outline-none"
                    />
                </div>

                {poolExists ? (
                    <div className="bg-blue-900/30 text-blue-200 p-4 rounded text-center">
                        <h3 className="font-bold text-lg mb-2">✅ {t('tokenDetail.growth.liquidityWizard.marketExists') || "Pool Activa"}</h3>
                        <p className="text-sm break-all font-mono">{pairAddress}</p>
                        <p className="text-xs text-blue-300 mt-2">
                            La piscina de liquidez ya existe. Usa el "Liquidity Locker" abajo para bloquear tus LPs.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={handleApprove}
                            disabled={isProcessing || !amountToken}
                            className={`py-3 px-4 rounded font-bold transition-all ${isProcessing || !amountToken ? 'bg-gray-700 text-gray-500' : 'bg-gray-700 hover:bg-gray-600 text-white'
                                }`}
                        >
                            {isProcessing ? t('tokenDetail.growth.liquidityWizard.approving') : t('tokenDetail.growth.liquidityWizard.approve').replace('{symbol}', tokenSymbol)}
                        </button>

                        <button
                            onClick={handleAddLiquidity}
                            disabled={isProcessing || !amountToken || !amountPOL}
                            className={`py-3 px-4 rounded font-bold transition-all ${isProcessing || !amountToken || !amountPOL ? 'bg-gray-700 text-gray-500' : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white'
                                }`}
                        >
                            {isProcessing ? t('tokenDetail.growth.liquidityWizard.adding') : t('tokenDetail.growth.liquidityWizard.addLiquidity')}
                        </button>
                    </div>
                )}

                <div className="text-center pt-2">
                    <a
                        href={`https://quickswap.exchange/#/add/${tokenAddress}/ETH`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gray-500 hover:text-purple-400 underline"
                    >
                        {t('tokenDetail.growth.liquidityWizard.manualLink')}
                    </a>
                </div>
            </div>
        </div>
    );
}
