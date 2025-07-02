// En: frontend/app/login/page.tsx
'use client';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const supabase = createClient(); // <-- ESTA ES LA LÍNEA QUE FALTABA
  const router = useRouter();

  // Usamos useEffect para registrar el listener cuando el componente se monta
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        // Redirige al usuario al dashboard después de iniciar sesión.
        router.push('/dashboard');
        router.refresh(); // Refresca la página para asegurar que el estado del servidor se actualiza
      }
    });

    // Limpiamos el listener cuando el componente se desmonta
    return () => {
      subscription.unsubscribe();
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
          // Opcional: redirige al usuario si ya ha iniciado sesión
          redirectTo={`${window.location.origin}/dashboard`}
        />
      </div>
    </div>
  );
}