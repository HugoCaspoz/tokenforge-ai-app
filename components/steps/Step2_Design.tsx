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
        <button 
          onClick={handleGenerateAndStoreLogo}
          className="w-full px-6 py-3 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 transition-colors disabled:bg-gray-500"
          disabled={isLoading}
        >
          {isLoading ? loadingMessage : '✨ Generar y Guardar Logo con IA'}
        </button>
      )}

      {error && <p className="mt-4 text-red-400">{error}</p>}
    </div>
  );
}
