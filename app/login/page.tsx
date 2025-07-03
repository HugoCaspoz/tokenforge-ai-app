// En: frontend/app/login/page.tsx
'use client';

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
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
          /**
           * ✅ CORRECCIÓN: Reemplazamos `location.origin` por una variable de entorno.
           * Esto funciona de forma segura tanto en el servidor como en el cliente.
           */
          redirectTo={`${process.env.NEXTAUTH_URL}/auth/callback`}
        />
      </div>
    </div>
  );
}