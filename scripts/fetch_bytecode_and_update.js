import fs from 'fs';
import path from 'path';

const ARTIFACT_URL = 'https://unpkg.com/@openzeppelin/contracts@4.8.0/build/contracts/ERC20PresetFixedSupply.json';
const TARGET_FILE = path.join('lib', 'tokenArtifacts.ts');

async function main() {
    console.log(`Fetching artifact from ${ARTIFACT_URL}...`);
    const res = await fetch(ARTIFACT_URL);
    if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);

    const artifact = await res.json();
    const bytecode = artifact.bytecode;

    if (!bytecode || bytecode === '0x') {
        throw new Error('Bytecode is empty in artifact!');
    }

    console.log(`Bytecode fetched! Length: ${bytecode.length} chars.`);

    // Read target file
    // Note: Resolving path relative to CWD
    const resolvedPath = path.resolve(process.cwd(), TARGET_FILE);
    console.log(`Updating ${resolvedPath}...`);

    let content = fs.readFileSync(resolvedPath, 'utf8');

    // Replace
    // We look for 'export const TOKEN_BYTECODE = "";' or similar
    const placeholder = 'export const TOKEN_BYTECODE = "";';
    const replacement = `export const TOKEN_BYTECODE = "${bytecode}";`;

    if (content.includes(placeholder)) {
        content = content.replace(placeholder, replacement);
        console.log('Replaced empty placeholder.');
    } else {
        console.log('Placeholder not strictly found. Trying Regex replace...');
        // Regex to replace ANY existing string assignment to TOKEN_BYTECODE
        // export const TOKEN_BYTECODE = ".*";
        const regex = /export const TOKEN_BYTECODE = ".*";/;
        if (regex.test(content)) {
            content = content.replace(regex, replacement);
            console.log('Replaced using Regex.');
        } else {
            console.error('ERROR: Could not find TOKEN_BYTECODE export to replace!');
            process.exit(1);
        }
    }

    fs.writeFileSync(resolvedPath, content);
    console.log(`SUCCESS: Updated ${TARGET_FILE} with real bytecode.`);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
