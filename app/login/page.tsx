// En: frontend/app/login/page.tsx
'use client';

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { SupabaseClient } from '@supabase/supabase-js';

export default function LoginPage() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const router = useRouter();
  const [redirectUrl, setRedirectUrl] = useState('');

  useEffect(() => {
    // Set the redirect URL safely on the client side
    setRedirectUrl(`${window.location.origin}/auth/callback`);

    let subscription: any = null;

    const initClient = async () => {
      const { createClient } = await import('@/utils/supabase/client');
      const supabaseInstance = createClient();
      setSupabase(supabaseInstance);

      const { data } = supabaseInstance.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_IN') {
          router.push('/dashboard');
          router.refresh();
        }
      });
      subscription = data.subscription;
    };

    initClient();

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [router]);

  if (!redirectUrl) {
    return null; // Or a loading spinner
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900">
      <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center text-white mb-6">
          Accede a Token<span className="text-purple-400">Crafter</span>
        </h1>
        {supabase && (
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            theme="dark"
            providers={['github', 'google']}
            socialLayout="horizontal"
            redirectTo={redirectUrl}
          />
        )}
      </div>
    </div>
  );
}