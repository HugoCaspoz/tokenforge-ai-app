import { ethers } from 'ethers';

const RPC_URL = 'https://polygon-rpc.com';
const CONTRACT_ADDRESS = '0x958D5B877bFfbc44A4c76CB55FD0e0864Dc7aC8f';

const ABI = [
    "function owner() view returns (address)",
    "function totalSupply() view returns (uint256)",
    "function name() view returns (string)",
    "function symbol() view returns (string)"
];

async function main() {
    console.log(`Checking code at ${CONTRACT_ADDRESS} via ${RPC_URL}...`);
    const provider = new ethers.JsonRpcProvider(RPC_URL);

    try {
        const code = await provider.getCode(CONTRACT_ADDRESS);
        console.log(`Result Code Length: ${code.length}`);

        if (code === '0x') {
            console.error("ERROR: No code found at this address!");
        } else {
            console.log("SUCCESS: Code exists!");

            // Try reading
            const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
            try {
                const owner = await contract.owner();
                console.log(`Owner: ${owner}`);
            } catch (e) {
                console.error("Owner Read Error:", e);
            }
        }
    } catch (e) {
        console.error("RPC Error:", e);
    }
}

main();
