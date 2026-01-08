const fs = require('fs');
const path = require('path');

const ENTRY_FILE = path.join(__dirname, 'SimpleToken.sol');
const OUTPUT_FILE = path.join(__dirname, '../public', 'SimpleToken_flat.sol');

const processedFiles = new Set();

function resolveImport(importPath, currentDir) {
    if (importPath.startsWith('@openzeppelin')) {
        return path.join(__dirname, '../node_modules', importPath);
    }
    if (importPath.startsWith('.')) {
        return path.join(currentDir, importPath);
    }
    return null;
}

let emittedSPDX = false;
let emittedPragma = false;

function processFile(filePath) {
    // Normalize path for consistent checking (though we use Set for dedup)
    filePath = path.resolve(filePath);

    if (processedFiles.has(filePath)) return "";
    processedFiles.add(filePath);

    console.log(`Processing ${filePath}...`);
    let content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let output = "";

    for (let line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('import')) {
            const match = line.match(/import\s+["']([^"']+)["'];/);
            if (match) {
                const importPath = match[1];
                const resolvedPath = resolveImport(importPath, path.dirname(filePath));
                if (resolvedPath && fs.existsSync(resolvedPath)) {
                    output += processFile(resolvedPath) + "\n";
                } else {
                    console.error(`Could not resolve import: ${importPath}`);
                    output += `// MISSING IMPORT: ${importPath}\n`;
                }
            } else {
                const matchFrom = line.match(/from\s+["']([^"']+)["'];/);
                if (matchFrom) {
                    const importPath = matchFrom[1];
                    const resolvedPath = resolveImport(importPath, path.dirname(filePath));
                    if (resolvedPath && fs.existsSync(resolvedPath)) {
                        output += processFile(resolvedPath) + "\n";
                    }
                }
            }
        } else if (trimmed.startsWith('pragma solidity')) {
            if (!emittedPragma) {
                output += line + "\n";
                emittedPragma = true;
            } else {
                output += `// ${line}\n`;
            }
        } else if (trimmed.startsWith('// SPDX-License-Identifier')) {
            if (!emittedSPDX) {
                output += line + "\n";
                emittedSPDX = true;
            } else {
                output += `// ${line}\n`;
            }
        } else {
            output += line + "\n";
        }
    }
    return output;
}

const flat = processFile(ENTRY_FILE);
fs.writeFileSync(OUTPUT_FILE, flat);
console.log(`Flattened contract saved to ${OUTPUT_FILE}`);
