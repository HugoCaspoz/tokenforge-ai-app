const fs = require('fs');
const path = require('path');
const solc = require('solc');

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

console.log('Compiling LiquidityLocker.sol...');
const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

if (output.errors) {
    let hasError = false;
    output.errors.forEach((err) => {
        console.error(err.formattedMessage);
        if (err.severity === 'error') hasError = true;
    });
    if (hasError) process.exit(1);
}

const contract = output.contracts['LiquidityLocker.sol']['LiquidityLocker'];
const abi = contract.abi;
const bytecode = contract.evm.bytecode.object;

console.log(`Compilation success!`);
console.log(`Bytecode length: ${bytecode.length}`);

// Update lib/lockerArtifacts.ts
const artifactPath = path.resolve(__dirname, '../lib/lockerArtifacts.ts');
const content = `
export const LOCKER_ABI = ${JSON.stringify(abi, null, 4)} as const;

export const LOCKER_BYTECODE = "0x${bytecode}";
`;

fs.writeFileSync(artifactPath, content);
console.log(`Updated ${artifactPath}`);
