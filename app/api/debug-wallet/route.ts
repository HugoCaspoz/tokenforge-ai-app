
import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
        if (!privateKey) {
            return NextResponse.json({ error: 'DEPLOYER_PRIVATE_KEY is not set' }, { status: 500 });
        }

        const provider = new ethers.JsonRpcProvider("https://polygon-rpc.com");
        const wallet = new ethers.Wallet(privateKey, provider);

        const balance = await provider.getBalance(wallet.address);
        const balanceEth = ethers.formatEther(balance);

        const network = await provider.getNetwork();

        return NextResponse.json({
            address: wallet.address,
            balance: balanceEth + " POL/MATIC",
            balanceRaw: balance.toString(),
            network: {
                name: network.name,
                chainId: network.chainId.toString()
            },
            rpc: "https://polygon-rpc.com"
        }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
