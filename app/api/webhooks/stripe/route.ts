// En: frontend/app/api/webhooks/stripe/route.ts

import Stripe from 'stripe';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inicializamos el cliente de Stripe con la clave secreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
// La clave secreta para verificar la firma del webhook
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('Stripe-Signature') as string; 

  let event: Stripe.Event;

  try {
    // Verificamos que la petición viene realmente de Stripe
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.log(`❌ Error message: ${errorMessage}`);
    return NextResponse.json({ error: `Webhook Error: ${errorMessage}` }, { status: 400 });
  }

  // Si llegamos aquí, la firma es válida. Procesamos el evento.
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Aquí es donde actualizamos nuestra base de datos
    try {
      // Creamos un cliente de Supabase con permisos de admin para actualizar la tabla
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Extraemos el ID del proyecto que guardamos en los metadatos
      const projectId = session.metadata?.projectId;
      
      if (!projectId) {
        throw new Error("No se encontró el projectId en los metadatos de Stripe.");
      }

      // Actualizamos la fila en la tabla 'projects' para marcarla como pagada
      const { error } = await supabaseAdmin
        .from('projects')
        .update({ is_paid: true })
        .eq('id', projectId);
      
      if (error) {
        throw error;
      }
      
      console.log(`Proyecto ${projectId} marcado como pagado.`);

    } catch (dbError) {
      console.error('Error al actualizar la base de datos:', dbError);
      return NextResponse.json({ error: 'Error de base de datos' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}