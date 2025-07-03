// En: frontend/app/login/page.tsx
'use client';

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared'; // Cambio aquí, usa la versión de React
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        // Este listener es la forma más fiable de redirigir tras el login.
        router.push('/dashboard');
        router.refresh(); 
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [router, supabase]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900">
      <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center text-white mb-6">
          Accede a Token<span className="text-purple-400">Crafter</span>
        </h1>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          theme="dark"
          providers={['github']}
          socialLayout="horizontal"
          // Apuntamos a la ruta de callback para el flujo de OAuth (GitHub)
          // El listener de arriba se encargará de la redirección final.
          redirectTo={`${location.origin}/auth/callback`}
        />
      </div>
    </div>
  );
}