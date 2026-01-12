import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const supabase = createClient();

    // 1. Fetch all projects with contract addresses
    const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .not('contract_address', 'is', null);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 2. Identify stale projects (older than 5 minutes)
    const now = new Date();
    const staleProjects = projects.filter(p => {
        if (!p.last_market_update) return true;
        const lastUpdate = new Date(p.last_market_update);
        const diffMinutes = (now.getTime() - lastUpdate.getTime()) / 1000 / 60;
        return diffMinutes > 5;
    });

    // 3. Update stale projects if any
    if (staleProjects.length > 0) {
        // Dexscreener supports up to 30 addresses per call. We'll chunk them.
        const chunkSize = 30;
        const chunks = [];
        for (let i = 0; i < staleProjects.length; i += chunkSize) {
            chunks.push(staleProjects.slice(i, i + chunkSize));
        }

        for (const chunk of chunks) {
            const addresses = chunk.map(p => p.contract_address).join(',');
            // Determine chain. Assuming most are on Polygon for now based on previous context, 
            // but Dexscreener endpoint /latest/dex/tokens/ accepts addresses and finds them across chains.
            // https://api.dexscreener.com/latest/dex/tokens/:tokenAddreses

            try {
                const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${addresses}`);
                const data = await res.json();

                if (data.pairs) {
                    // Process each project in the chunk
                    for (const project of chunk) {
                        // Find the best pair for this token (usually the one with highest liquidity)
                        const pairs = data.pairs.filter((pair: any) =>
                            pair.baseToken.address.toLowerCase() === project.contract_address.toLowerCase()
                        );

                        if (pairs.length > 0) {
                            // Sort by liquidity
                            pairs.sort((a: any, b: any) => b.liquidity.usd - a.liquidity.usd);
                            const bestPair = pairs[0];

                            await supabase.from('projects').update({
                                market_cap: bestPair.fdv || 0, // Fully Diluted Valuation as Market Cap proxy
                                volume_24h: bestPair.volume.h24 || 0,
                                price_change_24h: bestPair.priceChange.h24 || 0,
                                liquidity_usd: bestPair.liquidity.usd || 0,
                                last_market_update: new Date().toISOString()
                            }).eq('id', project.id);
                        }
                    }
                }
            } catch (err) {
                console.error("Error updating market data for chunk:", err);
            }
        }
    }

    // 4. Refetch updated data to return fresh UI
    const { data: updatedProjects } = await supabase
        .from('projects')
        .select('*')
        .not('contract_address', 'is', null)
        .order('created_at', { ascending: false });

    return NextResponse.json(updatedProjects);
}
