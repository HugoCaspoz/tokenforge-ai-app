import { ethers } from 'ethers';
import { TOKEN_ABI, TOKEN_BYTECODE } from '../lib/tokenArtifacts.js';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
const RPC_URL = "https://polygon.drpc.org";

async function testDeploy() {
    if (!PRIVATE_KEY) {
        console.error("❌ DEPLOYER_PRIVATE_KEY not found in .env.local");
        return;
    }

    console.log("🔧 Testing deployment logic...\n");

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log(`Wallet: ${wallet.address}`);

    const balance = await provider.getBalance(wallet.address);
    console.log(`Balance: ${ethers.formatEther(balance)} POL\n`);

    if (balance < ethers.parseEther("0.5")) {
        console.error("❌ Insufficient balance for test deployment");
        return;
    }

    // Test deployment
    const factory = new ethers.ContractFactory(TOKEN_ABI, TOKEN_BYTECODE, wallet);

    const tokenName = "TestToken";
    const tokenSymbol = "TEST";
    const supply = ethers.parseEther("1000000");
    const owner = wallet.address; // Self as owner for test

    console.log(`📝 Test deployment args:`);
    console.log(`  Name: ${tokenName}`);
    console.log(`  Symbol: ${tokenSymbol}`);
    console.log(`  Supply: ${ethers.formatEther(supply)}`);
    console.log(`  Owner: ${owner}\n`);

    try {
        console.log("🚀 Sending deployment transaction...");
        const contract = await factory.deploy(tokenName, tokenSymbol, supply, owner);

        const deployTx = contract.deploymentTransaction();
        if (!deployTx) {
            console.error("❌ No deployment transaction returned!");
            return;
        }

        console.log(`✅ Transaction sent!`);
        console.log(`  TX Hash: ${deployTx.hash}`);
        console.log(`  Predicted Address: ${await contract.getAddress()}\n`);

        console.log("⏳ Waiting for confirmation (this may take 30s)...");
        await contract.waitForDeployment();

        console.log("✅ CONTRACT DEPLOYED SUCCESSFULLY!");
        console.log(`  Address: ${await contract.getAddress()}`);
        console.log(`  View on PolygonScan: https://polygonscan.com/address/${await contract.getAddress()}`);

    } catch (error) {
        console.error("❌ Deployment failed:");
        console.error(error);
    }
}

testDeploy();
