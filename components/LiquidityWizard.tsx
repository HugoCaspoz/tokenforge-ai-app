import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useAccount, useWriteContract, usePublicClient, useReadContract } from 'wagmi';
import { parseUnits, maxUint256, formatEther } from 'viem';
import { TOKEN_ABI } from '../lib/tokenArtifacts';

// QuickSwap V3 (Algebra) Addresses on Polygon
const NPM_ADDRESS = '0x8eF88E4c7CfbbaC1C163f7eddd4B578792201de6';
const FACTORY_ADDRESS = '0x411b0fAcC3489691f28ad58c47006AF5E3Ab3A28';
const WMATIC = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270';

// ALGEBRA (QuickSwap V3) ABIs - NO FEE PARAM IN STRUCTS/FUNCTIONS
const CREATE_ABI = [
    {
        "inputs": [
            { "internalType": "address", "name": "token0", "type": "address" },
            { "internalType": "address", "name": "token1", "type": "address" },
            { "internalType": "uint160", "name": "sqrtPriceX96", "type": "uint160" }
        ],
        "name": "createAndInitializePoolIfNecessary",
        "outputs": [{ "internalType": "address", "name": "pool", "type": "address" }],
        "stateMutability": "payable",
        "type": "function"
    }
] as const;

const MINT_ABI = [
    {
        "inputs": [
            {
                "components": [
                    { "internalType": "address", "name": "token0", "type": "address" },
                    { "internalType": "address", "name": "token1", "type": "address" },
                    // NO FEE HERE for Algebra
                    { "internalType": "int24", "name": "tickLower", "type": "int24" },
                    { "internalType": "int24", "name": "tickUpper", "type": "int24" },
                    { "internalType": "uint256", "name": "amount0Desired", "type": "uint256" },
                    { "internalType": "uint256", "name": "amount1Desired", "type": "uint256" },
                    { "internalType": "uint256", "name": "amount0Min", "type": "uint256" },
                    { "internalType": "uint256", "name": "amount1Min", "type": "uint256" },
                    { "internalType": "address", "name": "recipient", "type": "address" },
                    { "internalType": "uint256", "name": "deadline", "type": "uint256" }
                ],
                "internalType": "struct INonfungiblePositionManager.MintParams",
                "name": "params",
                "type": "tuple"
            }
        ],
        "name": "mint",
        "outputs": [
            { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
            { "internalType": "uint128", "name": "liquidity", "type": "uint128" },
            { "internalType": "uint256", "name": "amount0", "type": "uint256" },
            { "internalType": "uint256", "name": "amount1", "type": "uint256" }
        ],
        "stateMutability": "payable",
        "type": "function"
    }
] as const;

const FACTORY_ABI = [{
    "inputs": [
        { "internalType": "address", "name": "", "type": "address" },
        { "internalType": "address", "name": "", "type": "address" }
    ],
    "name": "poolByPair", // Algebra uses poolByPair, not getPool
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
}] as const;

function getSqrtPriceX96(amount0: bigint, amount1: bigint): bigint {
    if (amount0 === BigInt(0)) return BigInt(0);
    const numerator = amount1 * (BigInt(1) << BigInt(192));
    const ratio = numerator / amount0;

    let z = (ratio + BigInt(1)) / BigInt(2);
    let y = ratio;
    while (z < y) {
        y = z;
        z = (ratio / z + z) / BigInt(2);
    }
    return y;
}

export default function LiquidityWizard({ tokenAddress, tokenSymbol, decoupled, onPoolFound }: { tokenAddress: `0x${string}`, tokenSymbol: string, decoupled?: boolean, onPoolFound?: (addr: string) => void }) {
    const { address, chainId } = useAccount();
    const publicClient = usePublicClient();
    const { t } = useTranslation();

    const [amountToken, setAmountToken] = useState('');
    const [amountPOL, setAmountPOL] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const isToken0 = tokenAddress.toLowerCase() < WMATIC.toLowerCase();
    const token0 = isToken0 ? tokenAddress : WMATIC;
    const token1 = isToken0 ? WMATIC : tokenAddress;

    // Check if Pool Exists (Algebra)
    const { data: poolAddress, refetch: refetchPool } = useReadContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: 'poolByPair',
        args: [token0, token1],
    });

    const poolExists = poolAddress && poolAddress !== '0x0000000000000000000000000000000000000000';

    useEffect(() => {
        if (poolExists && onPoolFound) {
            onPoolFound(poolAddress);
        }
    }, [poolExists, poolAddress, onPoolFound]);

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

    // STEP 1: APPROVE
    const handleApprove = async () => {
        if (!amountToken) return;
        setIsProcessing(true);
        try {
            const hash = await writeContractAsync({
                address: tokenAddress,
                abi: TOKEN_ABI,
                functionName: 'approve',
                args: [NPM_ADDRESS, maxUint256],
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

    // STEP 2: CREATE POOL (Algebra)
    const handleCreatePool = async () => {
        if (!amountToken || !amountPOL) return;
        if (poolExists) {
            alert(t('tokenDetail.growth.liquidityWizard.marketExistsAlert'));
            return;
        }

        setIsProcessing(true);
        try {
            const amount0 = isToken0 ? parseUnits(amountToken, 18) : parseUnits(amountPOL, 18);
            const amount1 = isToken0 ? parseUnits(amountPOL, 18) : parseUnits(amountToken, 18);
            const sqrtPriceX96 = getSqrtPriceX96(amount0, amount1);

            const hash = await writeContractAsync({
                address: NPM_ADDRESS,
                abi: CREATE_ABI,
                functionName: 'createAndInitializePoolIfNecessary',
                args: [token0, token1, sqrtPriceX96], // NO FEE
            });

            await waitTx(hash, t('tokenDetail.growth.liquidityWizard.initializing'));
            await refetchPool();
            alert(t('tokenDetail.growth.liquidityWizard.successInit'));
        } catch (e) {
            console.error(e);
            alert(t('tokenDetail.growth.liquidityWizard.errorInit') + ((e as any).shortMessage || (e as any).message));
        } finally {
            setIsProcessing(false);
        }
    };

    // STEP 3: MINT (Algebra)
    const handleMint = async () => {
        if (!amountToken || !amountPOL || !address) return;
        setIsProcessing(true);
        try {
            const amount0 = isToken0 ? parseUnits(amountToken, 18) : parseUnits(amountPOL, 18);
            const amount1 = isToken0 ? parseUnits(amountPOL, 18) : parseUnits(amountToken, 18);

            const tickLower = -887220; // Max Range
            const tickUpper = 887220;

            const hash = await writeContractAsync({
                address: NPM_ADDRESS,
                abi: MINT_ABI,
                functionName: 'mint',
                args: [{
                    token0,
                    token1,
                    // fee: 3000, // REMOVED
                    tickLower,
                    tickUpper,
                    amount0Desired: amount0,
                    amount1Desired: amount1,
                    amount0Min: BigInt(0),
                    amount1Min: BigInt(0),
                    recipient: address,
                    deadline: BigInt(Math.floor(Date.now() / 1000) + 1200)
                }],
                value: parseUnits(amountPOL, 18),
            });

            await waitTx(hash, t('tokenDetail.growth.liquidityWizard.adding'));
            alert(t('tokenDetail.growth.liquidityWizard.successAdd'));
        } catch (e) {
            console.error(e);
            alert(t('tokenDetail.growth.liquidityWizard.errorAdd') + ((e as any).shortMessage || (e as any).message));
        } finally {
            setIsProcessing(false);
        }
    };

    const qsLink = `https://quickswap.exchange/#/add-liquidity?currency0=${tokenAddress}&currency1=ETH`;

    return (
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 shadow-xl">
            <h3 className="text-xl font-bold text-purple-400 mb-2">{t('tokenDetail.growth.liquidityWizard.title')}</h3>
            <p className="text-sm text-gray-400 mb-6 border-b border-gray-800 pb-4">{t('tokenDetail.growth.liquidityWizard.subtitle')}</p>

            <div className="space-y-6">
                {/* Safety Check UI */}
                {chainId && chainId !== 137 && (
                    <div className="bg-red-900/20 border border-red-800 p-3 rounded text-center text-xs text-red-300 font-bold">
                        {t('tokenDetail.growth.liquidityWizard.wrongNetwork')}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2 block">{t('tokenDetail.growth.liquidityWizard.tokensLabel').replace('{symbol}', tokenSymbol)}</label>
                        <input
                            type="number"
                            value={amountToken}
                            onChange={e => setAmountToken(e.target.value)}
                            className="w-full bg-black/40 border border-gray-700 rounded p-3 text-white focus:border-purple-500 outline-none transition-colors"
                            placeholder="0.0"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2 block">{t('tokenDetail.growth.liquidityWizard.polLabel')}</label>
                        <input
                            type="number"
                            value={amountPOL}
                            onChange={e => setAmountPOL(e.target.value)}
                            className="w-full bg-black/40 border border-gray-700 rounded p-3 text-white focus:border-purple-500 outline-none transition-colors"
                            placeholder="0.0"
                        />
                    </div>
                </div>

                <div className="space-y-3 pt-2">
                    <button
                        onClick={handleApprove}
                        disabled={isProcessing}
                        className="w-full bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 rounded border border-gray-600 flex justify-between px-4 transition-all"
                    >
                        <span>{t('tokenDetail.growth.liquidityWizard.approve').replace('{symbol}', tokenSymbol)}</span>
                        <span className="text-gray-500">Step 1</span>
                    </button>

                    <button
                        onClick={handleCreatePool}
                        disabled={isProcessing || !!poolExists}
                        className={`w-full font-medium py-3 rounded flex justify-between px-4 border transition-all ${poolExists
                            ? 'bg-green-900/20 border-green-900/50 text-green-400 cursor-default'
                            : 'bg-gray-800 hover:bg-gray-700 border-gray-600 text-white'}`}
                    >
                        <span>{poolExists ? t('tokenDetail.growth.liquidityWizard.marketExists') : t('tokenDetail.growth.liquidityWizard.initialize')}</span>
                        <span className={poolExists ? "text-green-500" : "text-gray-500"}>{poolExists ? "✓" : "Step 2"}</span>
                    </button>

                    <button
                        onClick={handleMint}
                        disabled={isProcessing}
                        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded shadow-lg shadow-purple-900/20 flex justify-between px-4 transition-all"
                    >
                        <span>{t('tokenDetail.growth.liquidityWizard.addLiquidity')}</span>
                        <span className="text-purple-200">Step 3</span>
                    </button>
                </div>

                <div className="text-center pt-4">
                    <a href={qsLink} target="_blank" className="text-xs text-blue-300 underline hover:text-blue-100">
                        {t('tokenDetail.growth.liquidityWizard.manualLink')}
                    </a>
                </div>
            </div>
        </div>
    );
}
