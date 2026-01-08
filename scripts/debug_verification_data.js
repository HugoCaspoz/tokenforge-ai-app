import solc from 'solc';
import { JsonRpcProvider, Contract, AbiCoder } from 'ethers';
import fs from 'fs';
import path from 'path';

const RPC = 'https://polygon-rpc.com';
const ADDR = '0x958D5B877bFfbc44A4c76CB55FD0e0864Dc7aC8f';

const ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function totalSupply() view returns (uint256)",
    "function owner() view returns (address)"
];

(async () => {
    try {
        console.log("--- SOLC VERSION ---");
        console.log(solc.version());
        console.log("--------------------");

        const provider = new JsonRpcProvider(RPC);
        const contract = new Contract(ADDR, ABI, provider);

        console.log("Fetching details...");
        const n = await contract.name();
        const s = await contract.symbol();
        const sup = await contract.totalSupply();
        const o = await contract.owner();

        console.log(`Name: ${n}, Symbol: ${s}, Supply: ${sup}, Owner: ${o}`);

        const coder = new AbiCoder();
        const encoded = coder.encode(
            ['string', 'string', 'uint256', 'address'],
            [n, s, sup, o]
        );

        const encodedParams = encoded.slice(2); // Remove 0x

        fs.writeFileSync('public/args.txt', encodedParams);
        console.log("Saved args to public/args.txt");

    } catch (e) {
        console.error("Error:", e);
    }
})();
