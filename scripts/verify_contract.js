const RPC_URL = 'https://polygon-rpc.com';
const CONTRACT_ADDRESS = '0x1aFB0b83074f661248af48739b61A063571B32f3';

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

        // Try name() -> 0x06fdde03
        console.log('Reading name()...');
        const nameRes = await fetch(RPC_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 3,
                method: 'eth_call',
                params: [{ to: CONTRACT_ADDRESS, data: '0x06fdde03' }, 'latest']
            })
        });
        const nameData = await nameRes.json();
        console.log('Name Result:', nameData.result || nameData.error);

        // Try owner() -> 0x8da5cb5b
        console.log('Reading owner()...');
        const readRes = await fetch(RPC_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 2,
                method: 'eth_call',
                params: [{ to: CONTRACT_ADDRESS, data: '0x8da5cb5b' }, 'latest']
            })
        });
        const readText = await readRes.text();
        console.log("Raw Owner Response:", readText);
        try {
            const readData = JSON.parse(readText);
            if (readData.error) {
                console.error('Owner Read Error:', readData.error);
            } else {
                console.log('Owner Read Result:', readData.result);
            }
        } catch (e) {
            console.error("JSON Parse Error:", e);
        }

        // Read Raw Storage Slot 0 (Owner usually)
        console.log('Reading Storage Slot 0...');
        const storageRes = await fetch(RPC_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 4,
                method: 'eth_getStorageAt',
                params: [CONTRACT_ADDRESS, '0x0', 'latest']
            })
        });
        const storageData = await storageRes.json();
        console.log('Slot 0 Result:', storageData.result);

    } catch (err) {
        console.error('Fetch error:', err);
    }
}

main();
