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
        const { tokenData, chainId, initialSupply } = body;

        // 2. Verificar datos de entrada
        if (!tokenData || !chainId || !initialSupply) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 3. Obtener Perfil y Plan
        const { data: profile } = await supabase
            .from('profiles')
            .select('plan_activo')
            .eq('id', user.id)
            .single();

        const planKey = (profile?.plan_activo as keyof typeof PLAN_DETAILS) || 'free';
        const plan = PLAN_DETAILS[planKey];

        if (!plan) {
            return NextResponse.json({ error: 'Plan invalid' }, { status: 403 });
        }

        // 4. Calcular uso actual (Lógica de servidor para seguridad)
        const { data: existingProjects } = await supabase
            .from('projects')
            .select('chain_id')
            .eq('user_id', user.id)
            .not('contract_address', 'is', null);

        const counts: Record<string, number> = {};
        let totalUsed = 0;
        existingProjects?.forEach((p: any) => {
            if (p.chain_id) counts[p.chain_id] = (counts[p.chain_id] || 0) + 1;
            totalUsed++;
        });

        // 4.1 Verificar Límite por Cadena
        // @ts-ignore
        const limitPerChain = plan.limits[chainId as any] || 0;
        const usedInChain = counts[chainId] || 0;

        if (limitPerChain !== -1 && usedInChain >= limitPerChain) {
            return NextResponse.json({ error: `Limit reached for network ${NETWORK_NAMES[chainId as keyof typeof NETWORK_NAMES] || chainId}` }, { status: 403 });
        }

        // 4.2 Verificar Límite Total
        // @ts-ignore
        const totalLimit = plan.totalLimit || 0;
        if (totalLimit > 0 && totalUsed >= totalLimit) {
            return NextResponse.json({ error: `Total plan limit reached (${totalLimit} deployments)` }, { status: 403 });
        }

        // 5. MOCK DEPLOYMENT (Simulación)
        // Como no tenemos private keys ni lógica de ethers aquí, simulamos éxito.
        // Insertamos el registro en la base de datos para "consumir" el token.

        // Generar dirección falsa determinista o aleatoria
        const mockAddress = `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;

        // Guardar en DB
        const { error: insertError } = await supabase
            .from('projects')
            .insert({
                user_id: user.id,
                name: tokenData.name,
                ticker: tokenData.ticker,
                description: tokenData.description,
                chain_id: chainId,
                contract_address: mockAddress,
                logo_url: tokenData.logoUrl,
                status: 'deployed', // O el estado que uses
                supply: initialSupply
            });

        if (insertError) {
            console.error('Error inserting project:', insertError);
            return NextResponse.json({ error: 'Failed to record deployment' }, { status: 500 });
        }

        // Responder con éxito
        return NextResponse.json({
            success: true,
            contractAddress: mockAddress,
            message: 'Deployment simulated successfully (Mock Backend)'
        });

    } catch (error: any) {
        console.error('Deployment error:', error);
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
    }
}
