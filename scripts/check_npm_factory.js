import { createPublicClient, http } from 'viem';
import { polygon } from 'viem/chains';

const NPM_ADDRESS = '0x8eF88E4c7CfbbaC1C163f7eddd4B578792201de6';
const CURRENT_FACTORY_ADDRESS = '0x411b0fAcC3489691f28ad58c47006AF5E3Ab3A28'; // The one in the code (UPDATED)

const ABI = [
    {
        inputs: [],
        name: "factory",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "view",
        type: "function",
    }
];

async function main() {
    const client = createPublicClient({
        chain: polygon,
        transport: http()
    });

    try {
        console.log(`Checking NPM: ${NPM_ADDRESS}`);
        const factory = await client.readContract({
            address: NPM_ADDRESS,
            abi: ABI,
            functionName: 'factory',
        });
        console.log(`Factory returned by NPM: ${factory}`);
        console.log(`Factory in code: ${CURRENT_FACTORY_ADDRESS}`);

        if (factory.toLowerCase() !== CURRENT_FACTORY_ADDRESS.toLowerCase()) {
            console.log("!!! MISMATCH DETECTED !!!");
            console.log(`Correct factory should be: ${factory}`);
        } else {
            console.log("Factory matches.");
        }

    } catch (error) {
        console.error("Error fetching factory:", error);
    }
}

main();
