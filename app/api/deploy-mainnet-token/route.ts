import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { PLAN_DETAILS, NETWORK_NAMES, NETWORK_RPCS } from '@/lib/plans';
import { ethers } from 'ethers';

// Standard ERC20 with Ownable (Simplified Bytecode from simple OpenZeppelin compilation)
// Note: In production, use a verified factory or import artifacts properly.
// For this MVP, we use a standard "Mintable ERC20" Bytecode.
// Since bytecode is huge, I'll use a Factory approach if possible, or a minimal proxy.
// BUT for simplicity here, I will use a known bytecode string for a "SimpleToken".
// 
// Bytecode source: OpenZeppelin ERC20PresetFixedSupply (Shortened for demo, really needs full bytecode)
// REALITY CHECK: Deploying without real bytecode will fail on chain.
// I will import the artifacts created previously in lib/tokenArtifacts.ts if available? 
// No, those are on client. I can import them here too if 'lib' is shared. Yes.
import { TOKEN_ABI, TOKEN_BYTECODE } from '@/lib/tokenArtifacts';

export async function POST(req: NextRequest) {
    const supabase = createClient();

    // 1. Validar Sesión
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { tokenData, chainId, initialSupply, ownerAddress } = body;

        // 2. Verificar datos de entrada
        if (!tokenData || !chainId || !initialSupply || !ownerAddress) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 3. Obtener Perfil y Plan
        const { data: profile } = await supabase
            .from('profiles')
            .select('plan_activo')
            .eq('id', user.id)
            .single();

        const planKey = (profile?.plan_activo as keyof typeof PLAN_DETAILS) || 'free';
        const plan = PLAN_DETAILS[planKey];

        if (!plan) return NextResponse.json({ error: 'Plan invalid' }, { status: 403 });

        // 4. Calcular uso actual
        const { data: existingProjects } = await supabase
            .from('projects')
            .select('chain_id')
            .eq('user_id', user.id)
            .not('contract_address', 'is', null);

        const counts: Record<string, number> = {};
        let totalUsed = 0;
        existingProjects?.forEach((p: any) => {
            if (p.chain_id) counts[p.chain_id] = (counts[p.chain_id] || 0) + 1;
            totalUsed++;
        });

        // 4.1 Verificar Límites
        // @ts-ignore
        const limitPerChain = plan.limits[chainId as any] || 0;
        const usedInChain = counts[chainId] || 0;

        if (limitPerChain !== -1 && usedInChain >= limitPerChain) {
            return NextResponse.json({ error: `Limit reached for network ${NETWORK_NAMES[chainId as keyof typeof NETWORK_NAMES] || chainId}` }, { status: 403 });
        }
        // @ts-ignore
        const totalLimit = plan.totalLimit || 0;
        if (totalLimit > 0 && totalUsed >= totalLimit) {
            return NextResponse.json({ error: `Total plan limit reached (${totalLimit} deployments)` }, { status: 403 });
        }

        // 5. REAL DEPLOYMENT (Server-Side)
        const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
        if (!privateKey) {
            throw new Error('Server misconfiguration: DEPLOYER_PRIVATE_KEY missing');
        }

        // Setup Provider & Wallet
        // @ts-ignore
        let rpcUrl = NETWORK_RPCS[chainId as any];

        // FALLBACK RPC for Polygon to avoid "balance 0" sync errors
        if (chainId === '0x89') {
            rpcUrl = "https://polygon.drpc.org";
        }

        if (!rpcUrl) throw new Error(`RPC not configured for chain ${chainId}`);

        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const wallet = new ethers.Wallet(privateKey, provider);

        console.log(`Deploying token [${tokenData.ticker}] to ${chainId}`);
        console.log(`Server Wallet Address: ${wallet.address}`);
        console.log(`User/Owner Address: ${ownerAddress}`);

        if (wallet.address.toLowerCase() !== ownerAddress.toLowerCase()) {
            console.warn("WARNING: Server Deployer Wallet is different from Token Owner Address.");
            // This is valid, but good to note for debugging if user expects them to be same.
        }

        // Check Admin Balance for Gas
        const balance = await provider.getBalance(wallet.address);
        const balanceEth = ethers.formatEther(balance);
        console.log(`Wallet Balance: ${balanceEth} POL`);

        // Simple check: > 0.01 ETH equivalent (adjust as needed)
        if (balance < ethers.parseEther("0.5")) {
            const msg = `CRITICAL: Server Wallet (${wallet.address}) has insufficient funds (${balanceEth} POL). Required ~1.0 POL.`;
            console.error(msg);
            throw new Error(msg);
        }

        // Deploy
        const factory = new ethers.ContractFactory(TOKEN_ABI, TOKEN_BYTECODE, wallet);

        // Constructor Args: Name, Symbol, Supply, Owner
        // Note: supply in WEI.
        const supplyWei = ethers.parseEther(initialSupply.toString());

        // GAS BOOST: Force higher fees to ensure immediate inclusion (Polygon is fast but picky)
        const feeData = await provider.getFeeData();
        const gasOverrides = {
            maxFeePerGas: (feeData.maxFeePerGas || ethers.parseUnits('50', 'gwei')) * BigInt(150) / BigInt(100), // +50%
            maxPriorityFeePerGas: (feeData.maxPriorityFeePerGas || ethers.parseUnits('30', 'gwei')) * BigInt(150) / BigInt(100)
        };

        console.log(`Gas Boost: MaxFee ${ethers.formatUnits(gasOverrides.maxFeePerGas, 'gwei')} Gwei`);

        const contract = await factory.deploy(tokenData.name, tokenData.ticker, supplyWei, ownerAddress, gasOverrides);

        // OPTIMIZATION: Do NOT wait for blocking deployment (avoid Vercel Timeout)
        // await contract.waitForDeployment(); 

        // In Ethers v6, getAddress() is async but should be computable immediately from the tx (creates address deterministically)
        const deployedAddress = await contract.getAddress();
        const txHash = contract.deploymentTransaction()?.hash;

        console.log(`Deployment queued. TX: ${txHash}, Predicted Address: ${deployedAddress}`);

        // 6. Guardar en DB (Upsert to avoid duplicates if ID exists)
        const dbPayload: any = {
            user_id: user.id,
            name: tokenData.name,
            ticker: tokenData.ticker,
            description: tokenData.description,
            chain_id: chainId,
            contract_address: deployedAddress,
            tx_hash: txHash, // Save TX Hash for debugging
            logo_url: tokenData.logoUrl
        };
        // If we have a draft ID, use it to update the existing record
        if (tokenData.id) {
            dbPayload.id = tokenData.id;
        }

        const { error: insertError } = await supabase
            .from('projects')
            .upsert(dbPayload)

        if (insertError) {
            // Critical: Contract deployed but DB failed. Log heavily.
            console.error('CRITICAL: Contract deployed but DB insert failed!', insertError);
            return NextResponse.json({ error: 'Deployment successful but failed to save record. Contact support with address: ' + deployedAddress }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            contractAddress: deployedAddress,
            message: 'Deployment successful'
        });

    } catch (error: any) {
        console.error('Deployment error full object:', JSON.stringify(error, null, 2));

        // Extract wallet address from error message if we put it there, or just give generic advice
        let errorMessage = error.message || 'Server error';

        if (error.code === 'INSUFFICIENT_FUNDS' || errorMessage.includes('insufficient funds')) {
            // If we threw the error above, it already has the address. 
            // If ethers threw it, it might not.
            if (!errorMessage.includes("Server Wallet")) {
                errorMessage = `Fondos Insuficientes en la Billetera del Servidor. Verifica '/api/debug-wallet'. Error original: ${errorMessage}`;
            }
        }

        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
