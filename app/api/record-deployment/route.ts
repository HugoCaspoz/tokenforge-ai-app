import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { PLAN_DETAILS, NETWORK_NAMES } from '@/lib/plans';

export async function POST(req: NextRequest) {
    const supabase = createClient();

    // 1. Validar Sesión
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { tokenData, chainId, contractAddress, transactionHash } = body;

        // 2. Verificar datos de entrada
        if (!tokenData || !chainId || !contractAddress) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 3. Obtener Perfil y Plan (Double Check Limits)
        const { data: profile } = await supabase
            .from('profiles')
            .select('plan_activo')
            .eq('id', user.id)
            .single();

        const planKey = (profile?.plan_activo as keyof typeof PLAN_DETAILS) || 'free';
        const plan = PLAN_DETAILS[planKey];

        // 4. Calcular uso actual
        const { data: existingProjects } = await supabase
            .from('projects')
            .select('chain_id')
            .eq('user_id', user.id)
            .not('contract_address', 'is', null);

        let totalUsed = existingProjects?.length || 0;
        const usedInChain = existingProjects?.filter((p: any) => p.chain_id === chainId).length || 0;

        // 4.1 Verificar Límite por Cadena
        // @ts-ignore
        const limitPerChain = plan.limits[chainId as any] || 0;
        // Permitir si limit es -1 (Infinito) o si no se ha alcanzado
        // NOTE: Since deployment already happened on chain, blocking here creates a "Zombie" deployment 
        // (User paid gas but DB refuses). Ideally we warn properly in UI. 
        // We will strictly enforce here to maintain consistency.
        if (limitPerChain !== -1 && usedInChain >= limitPerChain) {
            console.warn(`User ${user.id} exceeded limit for ${chainId} but deployed anyway.`);
            // We can choose to ERROR or ALLOW with warning. Let's ERROR to enforce plan upgrades.
            return NextResponse.json({ error: 'Plan deployment limit reached. Upgrade needed to manage this token.' }, { status: 403 });
        }

        // 5. Guardar en DB
        const { error: insertError } = await supabase
            .from('projects')
            .insert({
                user_id: user.id,
                name: tokenData.name,
                ticker: tokenData.ticker,
                description: tokenData.description,
                chain_id: chainId,
                contract_address: contractAddress,
                logo_url: tokenData.logoUrl
            });

        if (insertError) throw insertError;

        return NextResponse.json({ success: true, message: 'Deployment recorded successfully' });

    } catch (error: any) {
        console.error('Record deployment error:', error);
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
    }
}
