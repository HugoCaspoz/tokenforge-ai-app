const fetch = require('node-fetch'); // Using node-fetch for script environment if needed, or global fetch in Node 18+

const API_KEY = "9255W2QMD1D6PJJN28UE6UEDZEX77KWBHM";
const CONTRACT_ADDRESS = "0x7Bd01478072814338603bb75bebD6Bb23e171DED";
const ENDPOINT = "https://api.etherscan.io/v2/api";

// Mock Source code (normally flattened)
const SOURCE_CODE = "// Pragma \n contract SimpleToken {}";

async function testVerification(useQueryParams = false) {
    console.log(`\n--- Testing with useQueryParams = ${useQueryParams} ---`);

    const params = new URLSearchParams();
    params.append('apikey', API_KEY);
    params.append('module', 'contract');
    params.append('action', 'verifysourcecode');
    params.append('contractaddress', CONTRACT_ADDRESS);
    params.append('sourceCode', SOURCE_CODE);
    params.append('codeformat', 'solidity-single-file');
    params.append('contractname', 'SimpleToken');
    params.append('compilerversion', 'v0.8.33+commit.64118f21');
    params.append('optimizationUsed', '1');
    params.append('runs', '200');
    params.append('evmversion', 'paris');
    params.append('constructorArguements', "");

    // THE CRITICAL PARAM
    params.append('chainid', '137');

    let url = ENDPOINT;
    let body = params;

    if (useQueryParams) {
        // Move chainid to URL? Or all params?
        // Etherscan V2 implies only chainid needs to be there, or acts as a gateway
        // Let's try appending chainid to URL and keeping rest in body
        url += "?chainid=137";
        // Remove chainid from body to see if it matters (or keep it)
        // body = params; 
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: useQueryParams ? params : body,
            // Header for form-urlencoded is usually automatic with URLSearchParams but good to be explicit just in case
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        const data = await response.json();
        console.log("Response:", data);
    } catch (e) {
        console.error("Error:", e);
    }
}

// Case 1: All in Body (Current Failed Implementation)
testVerification(false).then(() => {
    // Case 2: chainid in URL
    return testVerification(true);
});
