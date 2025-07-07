// app/api/create-customer-portal-session/route.ts
import { NextRequest, NextResponse } from 'next/server'; // Usa NextRequest y NextResponse para el App Router
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil', // Asegúrate de usar la versión de API que estés utilizando
});

export async function POST(req: NextRequest) { // Usa la función POST para manejar solicitudes POST
  try {
    const { customerId } = await req.json();

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required.' }, { status: 400 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${req.nextUrl.origin}/subscription`, // URL a la que el usuario vuelve después de gestionar la suscripción
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err: any) {
    console.error('Error al crear la sesión del portal de clientes:', err);
    return NextResponse.json({ error: err.message || 'Error desconocido al crear la sesión del portal de clientes.' }, { status: 500 });
  }
}

// Puedes añadir otros métodos HTTP si es necesario, por ejemplo, GET no se usa aquí.
export async function GET() {
  return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
}