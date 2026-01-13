import { ethers } from 'ethers';

const RPC_URL = "https://polygon.drpc.org";
const ADDRESSES = [
    "0x1950BBEBA9429d6086d9cf3edA5EF4D9D208a281", // Latest attempt
    "0x5b45988222Ac2e72b1dba6B316cb5e7B77b60680",
    "0xEFa8eE26F692Ae620488bD369285923E6Ea41d3B"
];
const DEPLOYER = "0xF787344514Ce9542C894405e181d0476129eE1E3";

async function checkMultiple() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);

    console.log("Checking deployer nonce...");
    const nonce = await provider.getTransactionCount(DEPLOYER);
    console.log(`Deployer Nonce: ${nonce}\n`);

    for (const addr of ADDRESSES) {
        console.log(`\n=== Checking ${addr} ===`);
        try {
            const code = await provider.getCode(addr);
            if (code === '0x' || code === '0x0') {
                console.log("❌ NO CODE - Contract NOT deployed");
            } else {
                console.log(`✅ CODE FOUND - ${code.length} bytes`);
            }
        } catch (err) {
            console.error("Error:", err.message);
        }
    }
}

checkMultiple();
