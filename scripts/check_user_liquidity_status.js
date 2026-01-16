import { createPublicClient, http, parseAbi } from 'viem';
import { polygon } from 'viem/chains';

const USER_TOKEN = '0x03cD6D7bd50f1B5376FD122A975CbbDacC300095';
const WMATIC = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270';
const FACTORY_ADDRESS = '0x411b0fAcC3489691f28ad58c47006AF5E3Ab3A28'; // The CORRECT factory

const FACTORY_ABI = parseAbi([
    'function poolByPair(address tokenA, address tokenB) view returns (address pool)'
]);

const ERC20_ABI = parseAbi([
    'function balanceOf(address account) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)'
]);

async function main() {
    const client = createPublicClient({
        chain: polygon,
        transport: http()
    });

    try {
        console.log(`Checking Pool for Token: ${USER_TOKEN} <-> WMATIC`);

        // 1. Check Pool Address
        const poolAddress = await client.readContract({
            address: FACTORY_ADDRESS,
            abi: FACTORY_ABI,
            functionName: 'poolByPair',
            args: [USER_TOKEN, WMATIC]
        });

        console.log(`Pool Address from Factory: ${poolAddress}`);

        if (poolAddress === '0x0000000000000000000000000000000000000000') {
            console.log("RESULT: Pool does NOT exist. User stopped at Step 1 (Approve) or Step 2 failed.");
            return;
        }

        // 2. Check Balances in Pool
        const tokenSymbol = await client.readContract({ address: USER_TOKEN, abi: ERC20_ABI, functionName: 'symbol' });
        const tokenDecimals = await client.readContract({ address: USER_TOKEN, abi: ERC20_ABI, functionName: 'decimals' });

        // Check Token Balance
        const tokenBalance = await client.readContract({
            address: USER_TOKEN,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [poolAddress]
        });

        // Check WMATIC Balance
        const wmaticBalance = await client.readContract({
            address: WMATIC,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [poolAddress]
        });

        console.log(`Pool ${tokenSymbol} Balance: ${tokenBalance.toString()} (Raw)`);
        console.log(`Pool WMATIC Balance: ${wmaticBalance.toString()} (Raw)`);

        if (tokenBalance === 0n && wmaticBalance === 0n) {
            console.log("RESULT: Pool exists but has NO liquidity. User completed Step 2 (Init) but not Step 3 (Mint/Add).");
        } else {
            console.log("RESULT: Pool exists AND has liquidity. DexScreener might just be slow.");
        }

    } catch (error) {
        console.error("Error checking liquidity:", error);
    }
}

main();
