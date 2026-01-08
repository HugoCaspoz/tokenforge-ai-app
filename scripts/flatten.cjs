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

function processFile(filePath) {
    if (processedFiles.has(filePath)) return "";
    processedFiles.add(filePath);

    console.log(`Processing ${filePath}...`);
    let content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let output = "";

    for (let line of lines) {
        if (line.trim().startsWith('import')) {
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
                // Handle named imports by simplistic regex or just ignoring (assuming standard OZ structure)
                // OZ usually uses `import { X } from "Y";` or `import "Y";`
                // Let's handle generic `from "path"`
                const matchFrom = line.match(/from\s+["']([^"']+)["'];/);
                if (matchFrom) {
                    const importPath = matchFrom[1];
                    const resolvedPath = resolveImport(importPath, path.dirname(filePath));
                    if (resolvedPath && fs.existsSync(resolvedPath)) {
                        output += processFile(resolvedPath) + "\n";
                    }
                }
            }
        } else if (line.trim().startsWith('pragma solidity')) {
            // Only keep the pragma from the main file or highest version?
            // For flattening, we usually strip pragmas except base one, or keep all.
            // PolygonScan handles multiple pragmas usually, but best to comment out duplicates.
            if (filePath !== ENTRY_FILE) {
                output += `// ${line}`;
            } else {
                output += line + "\n";
            }
        } else if (line.trim().startsWith('// SPDX-License-Identifier')) {
            if (filePath !== ENTRY_FILE) {
                output += `// ${line}`;
            } else {
                output += line + "\n";
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
