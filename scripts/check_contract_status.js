
import { ethers } from 'ethers';

const RPC_URL = "https://polygon.drpc.org";
const CONTRACT_ADDRESS = "0x7c8f46406CC4688899012873DF6AB6922EC436e8";
const DEPLOYER_ADDRESS = "0xF787344514Ce9542C894405e181d0476129eE1E3";

async function checkDeployment() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);

    console.log(`Checking code at: ${CONTRACT_ADDRESS}`);
    const code = await provider.getCode(CONTRACT_ADDRESS);

    if (code === '0x') {
        console.log("❌ NO CODE found at address. Contract NOT deployed yet.");

        // Check deployer nonce
        const nonce = await provider.getTransactionCount(DEPLOYER_ADDRESS);
        console.log(`Deployer Nonce: ${nonce}`);

        const balance = await provider.getBalance(DEPLOYER_ADDRESS);
        console.log(`Deployer Balance: ${ethers.formatEther(balance)} POL`);

    } else {
        console.log("✅ Code found! Contract IS deployed.");
        console.log(`Code length: ${code.length} bytes`);
    }
}

checkDeployment();
