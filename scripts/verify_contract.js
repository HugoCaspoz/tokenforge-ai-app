const RPC_URL = 'https://polygon-rpc.com';
const CONTRACT_ADDRESS = '0xE07DA9FfEaD9D7dA990D11309FD4E9076D8FF68f';

async function main() {
    console.log(`Checking code at ${CONTRACT_ADDRESS} via ${RPC_URL}...`);

    try {
        const response = await fetch(RPC_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'eth_getCode',
                params: [CONTRACT_ADDRESS, 'latest']
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error('RPC Error:', data.error);
            return;
        }

        const code = data.result;
        console.log(`Result Code Length: ${code.length}`);

        if (code === '0x' || code === '0x0') {
            console.log('STATUS: EMPTY (Contract does not exist)');
        } else {
            console.log('STATUS: EXISTS (Code found)');
        }

        // Also try to read owner() -> 0x8da5cb5b
        console.log('Reading owner()...');
        const readRes = await fetch(RPC_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 2,
                method: 'eth_call',
                params: [{
                    to: CONTRACT_ADDRESS,
                    data: '0x8da5cb5b' // owner() selector
                }, 'latest']
            })
        });
        const readData = await readRes.json();
        if (readData.error) {
            console.error('Owner Read Error:', readData.error);
        } else {
            console.log('Owner Read Result:', readData.result);
        }

    } catch (err) {
        console.error('Fetch error:', err);
    }
}

main();
