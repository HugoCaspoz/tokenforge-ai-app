// En: frontend/components/steps/Step2_Design.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { TokenData } from '../Wizard';

interface Step2Props {
  tokenData: TokenData;
  onDataChange: (data: Partial<TokenData>) => void;
  onComplete: () => void;
}

export default function Step2_Design({ tokenData, onDataChange, onComplete }: Step2Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const handleGenerateAndStoreLogo = async () => {
    setIsLoading(true);
    setError('');

    try {
      // --- PASO A: Generar el logo con DALL-E ---
      setLoadingMessage('Generando logo con IA...');
      const dallEResponse = await fetch('/api/generate/logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tokenData.name, description: tokenData.description }),
      });

      const dallEData = await dallEResponse.json();
      if (dallEData.error) throw new Error(dallEData.error);
      const tempLogoUrl = dallEData.logoUrl;

      // --- PASO B: Subir el logo a nuestro almacenamiento ---
      setLoadingMessage('Guardando logo permanentemente...');
      const storageResponse = await fetch('/api/storage/upload-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: tempLogoUrl, projectId: tokenData.id }),
      });

      const storageData = await storageResponse.json();
      if (storageData.error) throw new Error(storageData.error);

      const permanentLogoUrl = storageData.permanentUrl;

      // Actualizamos el estado para mostrar el logo y guardamos en el estado global
      setLogoUrl(permanentLogoUrl);
      onDataChange({ logoUrl: permanentLogoUrl });

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ha ocurrido un error desconocido.');
      }
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Paso 2: Diseño Automático</h2>
      <p className="text-gray-400 mb-6">Basado en tu idea, hemos definido lo siguiente. Ahora, ¡vamos a crearle un logo!</p>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-700">
        <button
          onClick={() => { }} // Simple visual tab for now, logic switches automatically based on action
          className="pb-2 px-4 transition-colors border-b-2 border-purple-500 text-purple-400"
        >
          🎨 Diseño del Token
        </button>
      </div>

      <div className="mb-6 p-4 bg-gray-900 rounded-md border border-gray-700">
        <p><strong>Nombre:</strong> {tokenData.name}</p>
        <p><strong>Ticker:</strong> ${tokenData.ticker.toUpperCase()}</p>
        <p><strong>Descripción:</strong> {tokenData.description}</p>
      </div>

      {logoUrl ? (
        <div className="text-center">
          <h3 className="text-lg font-semibold text-green-300 mb-4">¡Logo guardado!</h3>
          <Image
            src={logoUrl}
            alt={`Logo de ${tokenData.name}`}
            width={192}
            height={192}
            className="mx-auto rounded-full border-4 border-purple-500"
            priority
          />
          <button
            onClick={onComplete}
            className="w-full mt-6 px-6 py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors"
          >
            ¡Perfecto! Ir al último paso &rarr;
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Opcion IA */}
          <div className="bg-gray-800 p-6 rounded-lg text-center border border-gray-700 hover:border-purple-500 transition-all">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="font-bold mb-2">Generar con IA</h3>
            <p className="text-sm text-gray-400 mb-4">Deja que DALL-E cree un logo único basado en tu descripción.</p>
            <button
              onClick={handleGenerateAndStoreLogo}
              className="w-full px-4 py-2 bg-purple-600 text-white font-semibold rounded hover:bg-purple-700 disabled:bg-gray-600"
              disabled={isLoading}
            >
              {isLoading && loadingMessage.includes('IA') ? loadingMessage : 'Generar Logo'}
            </button>
          </div>

          {/* Opcion Subir */}
          <div className="bg-gray-800 p-6 rounded-lg text-center border border-gray-700 hover:border-blue-500 transition-all">
            <div className="text-4xl mb-4">📂</div>
            <h3 className="font-bold mb-2">Subir mi Propio Logo</h3>
            <p className="text-sm text-gray-400 mb-4">Sube una imagen (PNG, JPG) desde tu dispositivo.</p>
            <label className="block w-full cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  setIsLoading(true);
                  setLoadingMessage('Subiendo imagen...');
                  setError('');

                  try {
                    // 1. Convert to Base64 to reuse existing upload API (or formData if API supports it)
                    // Since current API requires JSON body with imageUrl (usually string), we need to adapt it.
                    // Actually, existing API seems to expect a URL to fetch? 
                    // Let's check api/storage/upload-logo/route.ts. 
                    // If it only accepts URL, we need to adapt it or use Supabase client directly here.
                    // Direct upload is better for files.

                    // Direct Supabase Upload (Best for files)
                    const { createClient } = await import('@/utils/supabase/client');
                    const supabase = createClient();
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${tokenData.id || Date.now()}-${Math.random()}.${fileExt}`;
                    const filePath = `${fileName}`;

                    const { error: uploadError, data } = await supabase.storage
                      .from('logos')
                      .upload(filePath, file);

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                      .from('logos')
                      .getPublicUrl(filePath);

                    setLogoUrl(publicUrl);
                    onDataChange({ logoUrl: publicUrl });

                  } catch (err: any) {
                    setError(err.message || 'Error subiendo imagen');
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading}
              />
              <span className="block w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 disabled:bg-gray-600">
                {isLoading && loadingMessage.includes('Subiendo') ? 'Subiendo...' : 'Seleccionar Archivo'}
              </span>
            </label>
          </div>
        </div>
      )}

      {error && <p className="mt-4 text-red-400">{error}</p>}
    </div>
  );
}
