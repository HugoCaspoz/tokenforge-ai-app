// En: frontend/app/test/page.tsx
'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function TestSupabasePage() {
  const supabase = createClient(); // <-- ESTA ES LA LÍNEA QUE FALTABA
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setLoading(true);
    setResult(null);
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });
    setResult({ data, error });
    setLoading(false);
  };

  const handleGetUser = async () => {
    setLoading(true);
    setResult(null);
    const { data, error } = await supabase.auth.getUser();
    setResult({ data, error });
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-8">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-3xl font-bold text-center">Página de Prueba de Supabase</h1>
        
        <div className="space-y-4 bg-gray-800 p-6 rounded-lg">
          <input
            type="email"
            placeholder="Email de prueba"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 bg-gray-700 text-white rounded-md border border-gray-600"
          />
          <input
            type="password"
            placeholder="Contraseña de prueba"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 bg-gray-700 text-white rounded-md border border-gray-600"
          />
          <button onClick={handleSignUp} disabled={loading} className="w-full py-2 bg-blue-600 rounded-md hover:bg-blue-500 disabled:bg-gray-500">
            {loading ? 'Probando...' : '1. Crear Usuario de Prueba'}
          </button>
           <button onClick={handleGetUser} disabled={loading} className="w-full py-2 bg-green-600 rounded-md hover:bg-green-500 disabled:bg-gray-500">
            {loading ? 'Probando...' : '2. Ver Usuario Actual'}
           </button>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="font-bold">Resultado:</h2>
          <pre className="mt-2 text-xs text-left overflow-auto whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
