import { createClient } from '@supabase/supabase-js';

// Need to find env vars or assume them if in .env.local
// I'll try to read .env.local first or just rely on process.env if loaded, 
// but run_command environment might not have them loaded.
// I will try to read them from the file system for this script.

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv'; // This might not be installed, so I'll parse manually if needed or assume standard nextjs env loading if I run with next? No, just manual read.

const envPath = path.resolve(process.cwd(), '.env.local');
let env = {};
try {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, val] = line.split('=');
        if (key && val) env[key.trim()] = val.trim();
    });
} catch (e) {
    console.log('.env.local not found, relying on process.env');
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("Checking tokens table...");
    const { data, error } = await supabase.from('tokens').select('*');
    if (error) {
        console.error("Error fetching tokens:", error);
    } else {
        console.log(`Found ${data.length} tokens.`);
        console.log(data);
    }
}

main();
