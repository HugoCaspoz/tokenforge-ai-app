import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env
const envPath = path.resolve(process.cwd(), '.env.local');
let env = {};
try {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, val] = line.split('=');
        if (key && val) env[key.trim()] = val.trim();
    });
} catch (e) { }

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('Checking projects table...');
    // Fetch all projects just to see if ANY exist
    const { data, error } = await supabase.from('projects').select('*');
    if (error) {
        console.error('Error:', error);
    } else {
        console.log(`Total projects found: ${data.length}`);
        if (data.length > 0) {
            console.log('Sample project:', data[0]);
        } else {
            console.log('No projects found in DB. This explains why Dashboard is empty.');
        }
    }
}

main().catch(console.error);
