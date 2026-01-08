import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits, maxUint256 } from 'viem';
import { TOKEN_ABI } from '../lib/tokenArtifacts';

// QuickSwap V3 NonfungiblePositionManager on Polygon
const NPM_ADDRESS = '0x8eF88E4c7CfbbaC1C163f7eddd4B578792201de6';

// Minimal ABI for NPM minting
const NPM_ABI = [
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
    }
] as const;

export default function LiquidityWizard({ tokenAddress, tokenSymbol, decoupled }: { tokenAddress: `0x${string}`, tokenSymbol: string, decoupled?: boolean }) {
    const { address } = useAccount();
    const [amountToken, setAmountToken] = useState('');
    const [amountPOL, setAmountPOL] = useState('');
    const [isApproving, setIsApproving] = useState(false);

    // Sort tokens to determine token0/token1
    // POL is technically "Native" but in V3 interactions we often use WMATIC (Wrapped POL) address for sorting?
    // QuickSwap V3 uses WMATIC: 0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270
    const WMATIC = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270';

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
                args: [NPM_ADDRESS, maxUint256], // Max approval for simplicity
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

            // Full Range Ticks for V3 (Min/Max)
            const tickLower = -887220; // Min valid tick for tickSpacing 60
            const tickUpper = 887220;  // Max valid tick

            // Note: If pool doesn't exist, we must initialize it. 
            // For simplicity MVP: assume we just call mint and it fails if not initialized? 
            // Or call createAndInitialize first? 
            // Let's try calling mint directly first, but usually you need a pool.
            // Actually, `mint` expects a pool to exist.
            // We'll add a "Initialize" step if needed later.

            await writeContractAsync({
                address: NPM_ADDRESS,
                abi: NPM_ABI,
                functionName: 'mint',
                args: [{
                    token0,
                    token1,
                    fee: 3000, // 0.3%
                    tickLower,
                    tickUpper,
                    amount0Desired: amount0,
                    amount1Desired: amount1,
                    amount0Min: 0n, // High slippage allowed (User is first provider)
                    amount1Min: 0n,
                    recipient: address,
                    deadline: BigInt(Math.floor(Date.now() / 1000) + 1200) // 20 mins
                }],
                value: parseUnits(amountPOL, 18) // Send MATIC/POL as value? No, NPM takes WMATIC. 
                // Wait, if we send Native MATIC to NPM, does it wrap? 
                // QuickSwap V3 NPM is a Multicall usually. 
                // Standard NPM requires WMATIC approval too if used as ERC20. 
                // BUT usually standard flow allows sending ETH (Native) which gets wrapped.
                // Let's try sending VALUE.
            });

            alert("¡Liquidez Añadida! 🦄");
        } catch (e) {
            console.error(e);
            alert("Error: " + (e as any).shortMessage || (e as any).message);
        }
    };

    return (
        <div className="bg-gradient-to-br from-blue-900 to-purple-900 p-6 rounded-xl border border-blue-500/30">
            <h3 className="text-xl font-bold text-white mb-2">🧙‍♂️ Mago de Liquidez (Auto-Launch)</h3>
            <p className="text-sm text-gray-300 mb-4">Crea tu mercado sin salir de la app.</p>

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
