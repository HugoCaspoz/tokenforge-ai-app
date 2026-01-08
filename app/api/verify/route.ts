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
        const { contractAddress, name, symbol, initialSupply, initialOwner, apiKey } = body;

        if (!contractAddress || !name || !symbol || !initialSupply || !initialOwner || !apiKey) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // 1. Flatten Source Code
        const contractPath = path.resolve(process.cwd(), 'scripts/SimpleToken.sol');
        const sourceCode = flattenContract(contractPath);

        // 2. Encode Constructor Arguments
        const abiCoder = new ethers.AbiCoder();
        // Supply in WEI (18 decimals)
        const supplyWei = ethers.parseEther(initialSupply.toString());

        const encodedArgs = abiCoder.encode(
            ['string', 'string', 'uint256', 'address'],
            [name, symbol, supplyWei, initialOwner]
        );
        // Remove 0x prefix
        const constructorArguments = encodedArgs.slice(2);

        // 3. Submit to PolygonScan
        const params = new URLSearchParams();
        params.append('apikey', apiKey);
        params.append('module', 'contract');
        params.append('action', 'verifysourcecode');
        params.append('contractaddress', contractAddress);
        params.append('sourceCode', sourceCode);
        params.append('codeformat', 'solidity-single-file');
        params.append('contractname', 'SimpleToken');
        params.append('compilerversion', 'v0.8.33+commit.64118f21'); // Matches local solc
        params.append('optimizationUsed', '1'); // Standard
        params.append('runs', '200');
        params.append('evmversion', 'paris'); // Default for 0.8.20
        params.append('constructorArguements', constructorArguments); // Note typo in API "Arguements"

        console.log(`Submitting verification for ${contractAddress}...`);

        const response = await fetch('https://api.polygonscan.com/api', {
            method: 'POST',
            body: params
        });

        const data = await response.json();

        if (data.status === '1') {
            return NextResponse.json({ success: true, guid: data.result });
        } else {
            return NextResponse.json({ error: data.result }, { status: 400 });
        }

    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
    }
}
