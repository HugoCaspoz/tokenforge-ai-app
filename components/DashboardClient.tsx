// En: frontend/components/DashboardClient.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { loadStripe } from '@stripe/stripe-js';

// Cargamos la clave publicable de Stripe desde las variables de entorno
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Definimos los tipos de datos que este componente recibe
interface Project {
  id: number;
  name: string;
  ticker: string;
  logo_url: string | null;
  is_paid: boolean;
}

interface DashboardClientProps {
  projects: Project[] | null;
  paymentSuccess: boolean;
}

export function DashboardClient({ projects, paymentSuccess }: DashboardClientProps) {
  const [loadingProjectId, setLoadingProjectId] = useState<number | null>(null);
  const [error, setError] = useState('');

  // --- NUEVA FUNCIÓN PARA MANEJAR EL PAGO ---
  const handlePayment = async (projectId: number) => {
    setLoadingProjectId(projectId);
    setError('');
    try {
      // Llamamos a nuestra API para crear la sesión de pago
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });

      const { sessionId, error: apiError } = await response.json();
      if (apiError) throw new Error(apiError);

      // Redirigimos al usuario a la página de pago de Stripe
      const stripe = await stripePromise;
      if (!stripe) throw new Error("Stripe.js no se ha cargado.");

      await stripe.redirectToCheckout({ sessionId });

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ha ocurrido un error desconocido al procesar el pago.');
      }
    }
    setLoadingProjectId(null);
  };
  // -----------------------------------------

  return (
    <div className="min-h-screen bg-gray-900 text-white pt-32">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {paymentSuccess && (
          <div className="bg-green-500/20 border border-green-500 text-green-300 px-4 py-3 rounded-lg relative mb-8" role="alert">
            <strong className="font-bold">¡Pago completado! </strong>
            <span className="block sm:inline">Tu proyecto ha sido activado. Ahora puedes desplegarlo en Mainnet.</span>
          </div>
        )}

        {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg relative mb-8" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
            </div>
        )}

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Mis Proyectos</h1>
          <Link href="/create" className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-transform hover:scale-105">
            + Crear Nuevo Token
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {projects && projects.length > 0 ? (
            projects.map((project) => (
              <div key={project.id} className={`bg-gray-800 rounded-lg p-4 flex flex-col ring-1 ${project.is_paid ? 'ring-green-500' : 'ring-white/10'}`}>
                <div className="relative w-full text-center">
                  {project.is_paid && (
                    <span className="absolute -top-6 -right-6 text-xs bg-green-500 text-white font-bold px-2 py-1 rounded-full z-10">PAGADO</span>
                  )}
                  <div className="w-24 h-24 mb-4 rounded-full bg-gray-700 flex items-center justify-center mx-auto overflow-hidden">
                    {project.logo_url ? (
                      <Image
                        src={project.logo_url}
                        alt={`Logo de ${project.name}`}
                        width={96}
                        height={96}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="text-4xl">🪙</span>
                    )}
                  </div>
                </div>
                <div className="text-center flex-grow">
                  <h2 className="text-lg font-bold">{project.name}</h2>
                  <p className="text-sm text-gray-400 bg-gray-700 px-2 py-1 rounded-full mt-1 inline-block">${project.ticker.toUpperCase()}</p>
                </div>
                
                <div className="mt-4 w-full">
                  {project.is_paid ? (
                    <Link href={`/deploy/${project.id}`} className="block w-full text-center bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 rounded-md transition-colors">
                      Desplegar en Mainnet
                    </Link>
                  ) : (
                    // --- BOTÓN DE PAGO ACTUALIZADO ---
                    <button
                      onClick={() => handlePayment(project.id)}
                      disabled={loadingProjectId === project.id}
                      className="w-full text-center bg-green-600 hover:bg-green-500 text-white font-semibold py-2 rounded-md transition-colors disabled:bg-gray-500"
                    >
                      {loadingProjectId === project.id ? 'Procesando...' : 'Activar con Pago'}
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 bg-gray-800 rounded-lg">
              <h2 className="text-xl font-semibold">No tienes proyectos todavía</h2>
              <p className="text-gray-400 mt-2">¡Empieza a crear tu primer token ahora!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
