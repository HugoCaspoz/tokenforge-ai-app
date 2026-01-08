import { useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { parseUnits, maxUint256 } from 'viem';
import { TOKEN_ABI } from '../lib/tokenArtifacts';

// QuickSwap V3 NonfungiblePositionManager on Polygon
const NPM_ADDRESS = '0x8eF88E4c7CfbbaC1C163f7eddd4B578792201de6';
const WMATIC = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270';

// Separate ABIs for clearer usage
const CREATE_ABI = [
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

const MINT_ABI = [
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
    }
] as const;

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

export default function LiquidityWizard({ tokenAddress, tokenSymbol, decoupled }: { tokenAddress: `0x${string}`, tokenSymbol: string, decoupled?: boolean }) {
    const { address, chainId } = useAccount();
    
    const [amountToken, setAmountToken] = useState('');
    const [amountPOL, setAmountPOL] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    
    const isToken0 = tokenAddress.toLowerCase() < WMATIC.toLowerCase();
    const token0 = isToken0 ? tokenAddress : WMATIC;
    const token1 = isToken0 ? WMATIC : tokenAddress;

    const { writeContractAsync } = useWriteContract();

    // STEP 1: APPROVE
    const handleApprove = async () => {
        if (!amountToken) return;
        setIsProcessing(true);
        try {
            await writeContractAsync({
                address: tokenAddress,
                abi: TOKEN_ABI,
                functionName: 'approve',
                args: [NPM_ADDRESS, maxUint256],
                // chainId removed to avoid connector crash
            });
            alert("✅ Aprobado. Ahora dale a 'Inicializar' (Paso 2).");
        } catch (e) {
            console.error(e);
            alert("❌ Error al aprobar: " + ((e as any).shortMessage || (e as any).message));
        } finally {
            setIsProcessing(false);
        }
    };

    // STEP 2: CREATE POOL
    const handleCreatePool = async () => {
        if (!amountToken || !amountPOL) return;
        setIsProcessing(true);
        try {
            const amount0 = isToken0 ? parseUnits(amountToken, 18) : parseUnits(amountPOL, 18);
            const amount1 = isToken0 ? parseUnits(amountPOL, 18) : parseUnits(amountToken, 18);
            const sqrtPriceX96 = getSqrtPriceX96(amount0, amount1);

            await writeContractAsync({
                address: NPM_ADDRESS,
                abi: CREATE_ABI,
                functionName: 'createAndInitializePoolIfNecessary',
                args: [token0, token1, 3000, sqrtPriceX96],
                 // chainId removed to avoid connector crash
            });
            alert("✅ Mercado Inicializado. Ahora dale a 'Añadir Liquidez' (Paso 3).");
        } catch (e) {
            console.error(e);
            alert("⚠️ Info: Si el mercado ya existe, esto puede fallar o no hacer nada. Continúa al Paso 3.");
        } finally {
            setIsProcessing(false);
        }
    };

    // STEP 3: MINT (ADD LIQUIDITY)
    const handleMint = async () => {
        if (!amountToken || !amountPOL || !address) return;
        setIsProcessing(true);
        try {
            const amount0 = isToken0 ? parseUnits(amountToken, 18) : parseUnits(amountPOL, 18);
            const amount1 = isToken0 ? parseUnits(amountPOL, 18) : parseUnits(amountToken, 18);

            const tickLower = -887220;
            const tickUpper = 887220;

            await writeContractAsync({
                address: NPM_ADDRESS,
                abi: MINT_ABI,
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
                }],
                value: parseUnits(amountPOL, 18),
                 // chainId removed to avoid connector crash
            });
            
            alert("🎉 ¡ÉXITO! Liquidez Añadida. Refresca QuickSwap en unos minutos.");
        } catch (e) {
            console.error(e);
            alert("❌ Error al añadir liquidez: " + ((e as any).shortMessage || (e as any).message));
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-blue-900 to-purple-900 p-6 rounded-xl border border-blue-500/30">
            <h3 className="text-xl font-bold text-white mb-2">🧙‍♂️ Mago de Liquidez (Modo Seguro 🛡️)</h3>
            <p className="text-sm text-gray-300 mb-4">Sigue los pasos en orden para evitar errores.</p>

            <div className="space-y-4">
                 {/* Safety Check UI */}
                {chainId && chainId !== 137 && (
                     <div className="bg-red-500/20 border border-red-500 p-2 rounded text-center text-xs text-red-200 font-bold animate-pulse">
                        ⚠️ Estás en la red incorrecta. Cambia a Polygon Mainnet en tu Wallet.
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-xs text-gray-400">Tokens ({tokenSymbol})</label>
                        <input 
                            type="number" 
                            value={amountToken}
                            onChange={e => setAmountToken(e.target.value)}
                            className="w-full bg-black/50 border border-gray-600 rounded p-2 text-white"
                            placeholder="Ej. 900000"
                        />
                    </div>
                     <div>
                        <label className="text-xs text-gray-400">POL (Matic)</label>
                        <input 
                            type="number" 
                            value={amountPOL}
                            onChange={e => setAmountPOL(e.target.value)}
                            className="w-full bg-black/50 border border-gray-600 rounded p-2 text-white"
                            placeholder="Ej. 1"
                        />
                    </div>
                </div>

                <div className="space-y-2 pt-2">
                    <button
                        onClick={handleApprove}
                        disabled={isProcessing}
                        className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 rounded flex justify-between px-4"
                    >
                        <span>1. Aprobar {tokenSymbol}</span>
                        <span>🔓</span>
                    </button>
                    
                    <button
                        onClick={handleCreatePool}
                        disabled={isProcessing}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded flex justify-between px-4"
                    >
                        <span>2. Inicializar Mercado</span>
                        <span>🏗️</span>
                    </button>

                    <button
                        onClick={handleMint}
                        disabled={isProcessing}
                        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded flex justify-between px-4"
                    >
                        <span>3. Añadir Liquidez</span>
                        <span>🦄</span>
                    </button>
                </div>
                <p className="text-xs text-gray-400 text-center">Si el paso 2 falla o no hace nada, es que ya está creado. Pasa al 3.</p>
            </div>
        </div>
    );
}
