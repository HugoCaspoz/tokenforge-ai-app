import { createPublicClient, http, encodeAbiParameters, parseAbiParameters } from 'viem';
import { polygon } from 'viem/chains';
import fs from 'fs';

const USER_TOKEN = '0x03cD6D7bd50f1B5376FD122A975CbbDacC300095';

const ERC20_ABI = [
    { name: 'name', type: 'function', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view' },
    { name: 'symbol', type: 'function', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view' },
    { name: 'totalSupply', type: 'function', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
    { name: 'owner', type: 'function', inputs: [], outputs: [{ type: 'address' }], stateMutability: 'view' }
];

async function main() {
    const client = createPublicClient({
        chain: polygon,
        transport: http()
    });

    try {
        console.log(`fetching details for: ${USER_TOKEN}`);

        const name = await client.readContract({ address: USER_TOKEN, abi: ERC20_ABI, functionName: 'name' });
        const symbol = await client.readContract({ address: USER_TOKEN, abi: ERC20_ABI, functionName: 'symbol' });
        const totalSupply = await client.readContract({ address: USER_TOKEN, abi: ERC20_ABI, functionName: 'totalSupply' });
        const owner = await client.readContract({ address: USER_TOKEN, abi: ERC20_ABI, functionName: 'owner' });

        console.log(`Name: ${name}`);
        console.log(`Symbol: ${symbol}`);
        console.log(`Total Supply: ${totalSupply}`);
        console.log(`Owner: ${owner}`);

        // Constructor: constructor(string memory name, string memory symbol, uint256 initialSupply, address initialOwner)
        const encoded = encodeAbiParameters(
            parseAbiParameters('string, string, uint256, address'),
            [name, symbol, totalSupply, owner]
        );

        console.log("\nConstructor Arguments (ABI Encoded):");
        console.log(encoded);

        fs.writeFileSync('verification_args.txt', encoded);
        console.log("Written to verification_args.txt");

    } catch (error) {
        console.error("Error:", error);
    }
}

main();
