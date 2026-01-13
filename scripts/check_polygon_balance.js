
import fs from 'fs';
import path from 'path';
import { ethers } from 'ethers';

// 1. Try to load env file
const envPath = path.resolve(process.cwd(), '.env.local');
// Manual parser to avoid 'dotenv' dependency issues in scripts if not installed
const findKey = (content, key) => {
    const regex = new RegExp(`^${key}=(.*)$`, 'm');
    const match = content.match(regex);
    if (match) {
        let val = match[1].trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
        }
        return val;
    }
    return null;
};

let privateKey = null;

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    privateKey = findKey(envContent, 'DEPLOYER_PRIVATE_KEY');
    console.log("Loaded key from .env.local");
}

if (!privateKey) {
    const envPath2 = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath2)) {
        const envContent = fs.readFileSync(envPath2, 'utf8');
        privateKey = findKey(envContent, 'DEPLOYER_PRIVATE_KEY');
        console.log("Loaded key from .env");
    }
}

if (!privateKey) {
    console.error("ERROR: DEPLOYER_PRIVATE_KEY not found in .env.local or .env");
    process.exit(1);
}

// 2. Check Wallet
try {
    const wallet = new ethers.Wallet(privateKey);
    console.log("\n---------------------------------------------------");
    console.log(" WALLET CHECKER");
    console.log("---------------------------------------------------");
    console.log(`Address:  ${wallet.address}`);
    console.log("---------------------------------------------------");

    // 3. Check Balance on Polygon
    console.log("Connecting to Polygon (https://polygon-rpc.com)...");
    const provider = new ethers.JsonRpcProvider("https://polygon-rpc.com");

    provider.getNetwork().then(net => {
        console.log(`Connected to network: ${net.name} (Chain ID: ${net.chainId})`);

        provider.getBalance(wallet.address).then((balance) => {
            const eth = ethers.formatEther(balance);
            console.log(`\nBalance:  ${eth} POL/MATIC`);
            console.log("---------------------------------------------------");

            if (balance === 0n) {
                console.error("\n❌ CRITICAL: The wallet is empty (0.0).");
                console.error("Please verify you sent funds to the EXACT address above on POLYGON NETWORK (Chain 137).");
            } else if (balance < ethers.parseEther("0.5")) {
                console.warn("\n⚠️ WARNING: Balance is low (< 0.5). Deployment might fail.");
                console.warn(`Estimated cost seen in error: ~0.9 POL`);
            } else {
                console.log("\n✅ Balance looks sufficient for a basic deployment.");
            }
        }).catch(err => console.error("Error fetching balance:", err));

    }).catch(err => console.error("Error connecting to network:", err));

} catch (error) {
    console.error("Invalid Private Key format:", error.message);
}
