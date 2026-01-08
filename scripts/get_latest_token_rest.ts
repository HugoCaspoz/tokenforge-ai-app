import fs from 'fs';
import path from 'path';

// Manual Env Load
const envPath = path.resolve(process.cwd(), '.env.local');
let env: Record<string, string> = {};
try {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, val] = line.split('=');
        if (key && val) env[key.trim()] = val.trim();
    });
} catch (e) { }

const URL = env['NEXT_PUBLIC_SUPABASE_URL'];
const KEY = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

if (!URL || !KEY) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

async function main() {
    console.log('Fetching latest project via REST...');
    const endpoint = `${URL}/rest/v1/projects?select=*&order=created_at.desc&limit=1`;

    const res = await fetch(endpoint, {
        headers: {
            'apikey': KEY,
            'Authorization': `Bearer ${KEY}`
        }
    });

    if (!res.ok) {
        console.error(`Error: ${res.status} ${res.statusText}`);
        const txt = await res.text();
        console.error(txt);
        return;
    }

    const data = await res.json();
    if (data.length === 0) {
        console.log('No projects found.');
    } else {
        const latest = data[0];
        console.log(`LATEST_TOKEN_ADDRESS: ${latest.contract_address}`);
        console.log(`LATEST_TOKEN_NAME: ${latest.name}`);
        console.log(`LATEST_TOKEN_CHAIN: ${latest.chain_id}`);
    }
}

main();
