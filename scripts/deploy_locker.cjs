const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Actually, lib/lockerArtifacts.ts is TS. Node cannot require it directly without ts-node or compilation.
// I should read the artifacts from the compilation output directly or make the artifacts JS.
// But I already made them TS.
// I'll just read the bytecode from the compilation script output if I can, or re-compile here, or just put the bytecode in a json file.

// Let's change strategy: I'll make a script that uses the JSON output from solc if possible, or just re-compiles.
// Or I can just put the bytecode in this script since I have it? No, that's messy.

// Better: I'll create a simple deploy script that expects the user to provide the private key and RPC.
// And I'll use the same compilation logic to get the bytecode.

const solc = require('solc');

async function main() {
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
        console.error("Please set PRIVATE_KEY environment variable");
        process.exit(1);
    }

    const rpcUrl = process.env.RPC_URL || "https://polygon-bor.publicnode.com";
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log(`Deploying from: ${wallet.address}`);

    // Compile
    const contractPath = path.resolve(__dirname, '../contracts/LiquidityLocker.sol');
    const source = fs.readFileSync(contractPath, 'utf8');

    const input = {
        language: 'Solidity',
        sources: {
            'LiquidityLocker.sol': {
                content: source,
            },
        },
        settings: {
            outputSelection: {
                '*': {
                    '*': ['abi', 'evm.bytecode'],
                },
            },
        },
    };

    function findImports(importPath) {
        if (importPath.startsWith('@openzeppelin')) {
            const nodeModulesPath = path.resolve(__dirname, '../node_modules', importPath);
            if (fs.existsSync(nodeModulesPath)) {
                return { contents: fs.readFileSync(nodeModulesPath, 'utf8') };
            }
        }
        return { error: 'File not found' };
    }

    const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
    const contract = output.contracts['LiquidityLocker.sol']['LiquidityLocker'];
    const abi = contract.abi;
    const bytecode = contract.evm.bytecode.object;

    // Deploy
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    const deployTx = await factory.deploy();
    await deployTx.waitForDeployment();

    const address = await deployTx.getAddress();
    console.log(`LiquidityLocker deployed to: ${address}`);
    console.log(`Please update components/LiquidityLocker.tsx with this address.`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
