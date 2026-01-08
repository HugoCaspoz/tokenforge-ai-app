import { TOKEN_BYTECODE } from '../lib/tokenArtifacts';

const ARTIFACT_URL = 'https://unpkg.com/@openzeppelin/contracts@4.9.3/build/contracts/ERC20PresetFixedSupply.json';

async function main() {
    console.log('Fetching artifact...');
    const res = await fetch(ARTIFACT_URL);
    const json = await res.json();

    console.log('Artifact fetched.');

    const creation = json.bytecode;
    const runtime = json.deployedBytecode;

    console.log(`Creation Length: ${creation.length}`);
    console.log(`Runtime Length: ${runtime.length}`);
    console.log(`Current TOKEN_BYTECODE Length: ${TOKEN_BYTECODE.length}`);

    if (TOKEN_BYTECODE === creation) {
        console.log('MATCH: TOKEN_BYTECODE is CREATION bytecode. (Correct)');
    } else if (TOKEN_BYTECODE === runtime) {
        console.log('MISMATCH: TOKEN_BYTECODE is RUNTIME bytecode! (Incorrect)');
    } else {
        console.log('MISMATCH: TOKEN_BYTECODE matches NEITHER!');
        // Check start
        console.log(`Current Start: ${TOKEN_BYTECODE.substring(0, 50)}...`);
        console.log(`Creation Start: ${creation.substring(0, 50)}...`);
        console.log(`Runtime Start: ${runtime.substring(0, 50)}...`);
    }
}

main().catch(console.error);
