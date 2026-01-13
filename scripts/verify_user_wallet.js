
import { ethers } from 'ethers';

const USER_ADDRESS = "0xf787344514ce9542c894405e181d0476129ee1e3";
const RPC_URL = "https://polygon-rpc.com";

async function checkBalance() {
    console.log(`Checking balance for: ${USER_ADDRESS}`);
    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const network = await provider.getNetwork();
        console.log(`Connected to Network: ${network.name} (Chain ID: ${network.chainId})`);

        const balance = await provider.getBalance(USER_ADDRESS);
        const balanceEth = ethers.formatEther(balance);

        console.log(`\nBalance: ${balanceEth} POL/MATIC`);

        if (balance == 0n) {
            console.log("❌ The User's wallet is EMPTY on this node.");
        } else {
            console.log("✅ The User's wallet HAS funds.");
        }

    } catch (error) {
        console.error("RPC Error:", error.message);
    }
}

checkBalance();
