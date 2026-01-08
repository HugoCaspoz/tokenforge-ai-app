import { useState } from 'react';
import { useAccount, useWriteContract, useSwitchChain } from 'wagmi';
import { parseUnits, encodeFunctionData, maxUint256 } from 'viem';
import { TOKEN_ABI } from '../lib/tokenArtifacts';

// QuickSwap V3 NonfungiblePositionManager on Polygon
const NPM_ADDRESS = '0x8eF88E4c7CfbbaC1C163f7eddd4B578792201de6';
const WMATIC = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270';

// Extended ABI for Multicall + Init
const NPM_ABI = [
    {
        "inputs": [{ "internalType": "bytes[]", "name": "data", "type": "bytes[]" }],
        "name": "multicall",
        "outputs": [{ "internalType": "bytes[]", "name": "results", "type": "bytes[]" }],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "components": [
                    { "internalType": "address", "name": "token0", "type": "address" },
                    { "internalType": "address", "name": "token1", "type": "address" },
                    { "internalType": "uint24", "name": "fee", "type": "uint24" },
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
    },
    {
        "inputs": [
            { "internalType": "address", "name": "token0", "type": "address" },
            { "internalType": "address", "name": "token1", "type": "address" },
            { "internalType": "uint24", "name": "fee", "type": "uint24" },
            { "internalType": "uint160", "name": "sqrtPriceX96", "type": "uint160" }
        ],
        "name": "createAndInitializePoolIfNecessary",
        "outputs": [{ "internalType": "address", "name": "pool", "type": "address" }],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "refundETH",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    }
] as const;

// Helper to calculate sqrtPriceX96 = sqrt(amount1/amount0) * 2^96
function getSqrtPriceX96(amount0: bigint, amount1: bigint): bigint {
    if (amount0 === BigInt(0)) return BigInt(0);
    // price = amount1 / amount0
    // sqrtPrice = sqrt(price)
    // Q96 = 2^96
    // We do: sqrt( (amount1 * 2^192) / amount0 )
    // This maintains precision.
    const numerator = amount1 * (BigInt(1) << BigInt(192));
    const ratio = numerator / amount0;

    // Integer square root
    let z = (ratio + BigInt(1)) / BigInt(2);
    let y = ratio;
    while (z < y) {
        y = z;
        z = (ratio / z + z) / BigInt(2);
    }
    return y;
}

export default function LiquidityWizard({ tokenAddress, tokenSymbol, decoupled }: { tokenAddress: `0x${string}`, tokenSymbol: string, decoupled?: boolean }) {
    const { address } = useAccount();
    const [amountToken, setAmountToken] = useState('');
    const [amountPOL, setAmountPOL] = useState('');
    const [isApproving, setIsApproving] = useState(false);

    const isToken0 = tokenAddress.toLowerCase() < WMATIC.toLowerCase();
    const token0 = isToken0 ? tokenAddress : WMATIC;
    const token1 = isToken0 ? WMATIC : tokenAddress;

    const { writeContractAsync } = useWriteContract();

    const handleApprove = async () => {
        if (!amountToken) return;
        setIsApproving(true);
        try {
            await writeContractAsync({
                address: tokenAddress,
                abi: TOKEN_ABI,
                functionName: 'approve',
                args: [NPM_ADDRESS, maxUint256],
            });
            alert("Aprobado! Ahora puedes crear la liquidez.");
        } catch (e) {
            console.error(e);
            alert("Error al aprobar.");
        } finally {
            setIsApproving(false);
        }
    };

    const handleAddLiquidity = async () => {
        if (!amountToken || !amountPOL || !address) return;

        try {
            const amount0 = isToken0 ? parseUnits(amountToken, 18) : parseUnits(amountPOL, 18);
            const amount1 = isToken0 ? parseUnits(amountPOL, 18) : parseUnits(amountToken, 18);

            // 1. Calculate Initial Price (SqrtPriceX96)
            const sqrtPriceX96 = getSqrtPriceX96(amount0, amount1);

            // 2. Prepare Calldatas for Multicall
            // Uses standard multicall pattern to chain Init -> Mint -> Refund
            const calldatas: `0x${string}`[] = [];

            // A. Create/Init Pool
            calldatas.push(
                encodeFunctionData({
                    abi: NPM_ABI,
                    functionName: 'createAndInitializePoolIfNecessary',
                    args: [token0, token1, 3000, sqrtPriceX96]
                })
            );

            // B. Mint Position
            const tickLower = -887220;
            const tickUpper = 887220;

            calldatas.push(
                encodeFunctionData({
                    abi: NPM_ABI,
                    functionName: 'mint',
                    args: [{
                        token0,
                        token1,
                        fee: 3000,
                        tickLower,
                        tickUpper,
                        amount0Desired: amount0,
                        amount1Desired: amount1,
                        amount0Min: BigInt(0),
                        amount1Min: BigInt(0),
                        recipient: address,
                        deadline: BigInt(Math.floor(Date.now() / 1000) + 1200)
                    }]
                })
            );

            // C. Refund ETH (If using native POL, essential to get back change)
            calldatas.push(
                encodeFunctionData({
                    abi: NPM_ABI,
                    functionName: 'refundETH'
                })
            );

            // 3. Execute Multicall
            // Send full users input value as msg.value. 
            // The router will wrap it to WMATIC for the pool, and refundETH will return the remaining dust.
            await writeContractAsync({
                address: NPM_ADDRESS,
                abi: NPM_ABI,
                functionName: 'multicall',
                args: [calldatas],
                value: parseUnits(amountPOL, 18)
            });

            alert("¡Mercado Creado con Éxito! 🦄🚀");
        } catch (e) {
            console.error(e);
            alert("Error: " + ((e as any).shortMessage || (e as any).message));
        }
    };

    return (
        <div className="bg-gradient-to-br from-blue-900 to-purple-900 p-6 rounded-xl border border-blue-500/30">
            <h3 className="text-xl font-bold text-white mb-2">🧙‍♂️ Mago de Liquidez Auto-Launch</h3>
            <p className="text-sm text-gray-300 mb-4">Crea tu mercado y establece el precio inicial automáticamente.</p>

            <div className="space-y-4">
                <div>
                    <label className="text-xs text-gray-400">Cantidad de {tokenSymbol} a poner</label>
                    <input
                        type="number"
                        value={amountToken}
                        onChange={e => setAmountToken(e.target.value)}
                        className="w-full bg-black/50 border border-gray-600 rounded p-2 text-white"
                        placeholder="Ej. 10000"
                    />
                </div>

                <div>
                    <label className="text-xs text-gray-400">Cantidad de POL (Matic) a poner</label>
                    <input
                        type="number"
                        value={amountPOL}
                        onChange={e => setAmountPOL(e.target.value)}
                        className="w-full bg-black/50 border border-gray-600 rounded p-2 text-white"
                        placeholder="Ej. 50"
                    />
                </div>

                <div className="flex gap-2 pt-2">
                    <button
                        onClick={handleApprove}
                        disabled={isApproving}
                        className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 rounded"
                    >
                        1. Aprobar {tokenSymbol}
                    </button>
                    <button
                        onClick={handleAddLiquidity}
                        className="flex-1 bg-pink-600 hover:bg-pink-500 text-white font-bold py-2 rounded"
                    >
                        2. Lanzar Mercado 🚀
                    </button>
                </div>
                <p className="text-xs text-gray-400 text-center">Fee: 0.3% | Rango: Full Range (Automático)</p>
            </div>
        </div>
    );
}
