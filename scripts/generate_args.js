import { JsonRpcProvider, Contract, AbiCoder } from 'ethers';

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
        const provider = new JsonRpcProvider(RPC);
        const contract = new Contract(ADDR, ABI, provider);

        console.log("Fetching contract details...");
        const n = await contract.name();
        const s = await contract.symbol();
        const sup = await contract.totalSupply();
        const o = await contract.owner();

        console.log(`Name: ${n}`);
        console.log(`Symbol: ${s}`);
        console.log(`Supply: ${sup.toString()}`);
        console.log(`Owner: ${o}`);

        const coder = new AbiCoder();
        // SimpleToken constructor: (string name, string symbol, uint256 initialSupply, address initialOwner)
        const encoded = coder.encode(
            ['string', 'string', 'uint256', 'address'],
            [n, s, sup, o]
        );

        console.log("\nConstructor Arguments (ABI-encoded):");
        console.log(encoded.slice(2)); // Remove 0x

    } catch (e) {
        console.error("Error:", e);
    }
})();
