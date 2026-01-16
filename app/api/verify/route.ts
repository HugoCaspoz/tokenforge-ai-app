import { NextRequest, NextResponse } from 'next/server';
import { flattenContract } from '@/lib/flattener';
import path from 'path';
import { ethers } from 'ethers';

// SimpleToken ABI for encoding args
const CONSTRUCTOR_ABI = [
    "constructor(string name, string symbol, uint256 initialSupply, address initialOwner)"
];

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { contractAddress, name, symbol, initialSupply, initialSupplyRaw, initialOwner, apiKey } = body;

        if (!contractAddress || !name || !symbol || !apiKey) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // 1. Read Flattened Source Code directly from public (matches what user sees manually)
        // This ensures the API uses exactly what we offer for manual verification.
        const contractPath = path.resolve(process.cwd(), 'public/SimpleToken_flat.sol');
        let sourceCode = "";

        try {
            const fs = require('fs');
            sourceCode = fs.readFileSync(contractPath, 'utf8');
        } catch (e) {
            console.log("Flat file not found in public, flattening scripts/SimpleToken.sol...");
            const scriptPath = path.resolve(process.cwd(), 'scripts/SimpleToken.sol');
            sourceCode = flattenContract(scriptPath);
        }

        // 2. Encode Constructor Arguments
        const abiCoder = new ethers.AbiCoder();

        // Use Raw Supply if available (BigInt string) to avoid precision loss
        let supplyWei;
        if (initialSupplyRaw) {
            supplyWei = BigInt(initialSupplyRaw);
        } else {
            // Fallback to old method (risk of precision loss)
            supplyWei = ethers.parseEther(initialSupply.toString());
        }

        const encodedArgs = abiCoder.encode(
            ['string', 'string', 'uint256', 'address'],
            [name, symbol, supplyWei, initialOwner]
        );
        // Remove 0x prefix
        const constructorArguments = encodedArgs.slice(2);

        // 3. Submit to Etherscan V2 API (Unified Endpoint)
        // CRITICAL: chainid MUST be a Query Parameter, not just Body
        // See: https://docs.etherscan.io/v2/api-endpoints/contracts
        const params = new URLSearchParams();
        params.append('apikey', apiKey);
        params.append('module', 'contract');
        params.append('action', 'verifysourcecode');
        params.append('contractaddress', contractAddress);
        params.append('sourceCode', sourceCode);
        params.append('codeformat', 'solidity-single-file');
        params.append('contractname', 'SimpleToken');
        // Ensure this matches your local solc version exactly
        params.append('compilerversion', 'v0.8.33+commit.64118f21');
        params.append('optimizationUsed', '1'); // Standard
        params.append('runs', '200');
        params.append('evmversion', 'paris'); // Default for >=0.8.20
        params.append('constructorArguements', constructorArguments);

        console.log(`Submitting verification for ${contractAddress} to Etherscan V2 (Chain 137)...`);

        // V2 Endpoint with chainid in URL
        const response = await fetch('https://api.etherscan.io/v2/api?chainid=137', {
            method: 'POST',
            body: params
        });

        const data = await response.json();

        // Status '1' usually means submission accepted (result is GUID), but V2 might differ slightly in errors.
        if (data.status === '1') {
            return NextResponse.json({ success: true, guid: data.result });
        } else {
            console.error("Verification Error from Etherscan:", data);
            return NextResponse.json({ error: data.result || JSON.stringify(data) }, { status: 400 });
        }

    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
    }
}
