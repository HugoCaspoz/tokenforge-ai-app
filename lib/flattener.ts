import fs from 'fs';
import path from 'path';

// Helper to resolve imports (especially OpenZeppelin)
function resolveImport(importPath: string, currentDir: string): string | null {
    if (importPath.startsWith('@openzeppelin')) {
        // Assume node_modules is at project root
        return path.resolve(process.cwd(), 'node_modules', importPath);
    }
    if (importPath.startsWith('.')) {
        return path.resolve(currentDir, importPath);
    }
    return null;
}

// Global state for deduplication (must be reset per run ideally, but for single request it works if scoped)
// Better to pass state around.

export function flattenContract(entryFilePath: string): string {
    const processedFiles = new Set<string>();
    let emittedSPDX = false;
    let emittedPragma = false;

    function processFile(filePath: string): string {
        // Normalize
        filePath = path.resolve(filePath);
        if (processedFiles.has(filePath)) return "";
        processedFiles.add(filePath);

        // console.log(`Processing ${filePath}...`);

        if (!fs.existsSync(filePath)) {
            return `// ERROR: File not found: ${filePath}\n`;
        }

        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        let output = "";

        for (let line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('import')) {
                // Regex handles import "foo"; and import {bar} from "foo";
                // Match simple import "path";
                const matchSimple = line.match(/import\s+["']([^"']+)["'];/);
                // Match import val from "path";
                const matchFrom = line.match(/from\s+["']([^"']+)["'];/);

                const importPath = matchSimple ? matchSimple[1] : (matchFrom ? matchFrom[1] : null);

                if (importPath) {
                    const resolvedPath = resolveImport(importPath, path.dirname(filePath));
                    if (resolvedPath && fs.existsSync(resolvedPath)) {
                        output += processFile(resolvedPath) + "\n";
                    } else {
                        output += `// MISSING IMPORT: ${importPath}\n`;
                    }
                } else {
                    // Could be complex multiline import, ignore for MVP or log warning
                    // output += `// IGNORED COMPLEX IMPORT: ${line}\n`;
                }

            } else if (trimmed.startsWith('pragma solidity')) {
                if (!emittedPragma) {
                    output += line + "\n";
                    emittedPragma = true;
                }
            } else if (trimmed.startsWith('// SPDX-License-Identifier')) {
                if (!emittedSPDX) {
                    output += line + "\n";
                    emittedSPDX = true;
                }
            } else {
                output += line + "\n";
            }
        }
        return output;
    }

    return processFile(entryFilePath);
}
