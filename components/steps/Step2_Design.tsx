// En: frontend/components/steps/Step2_Design.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image'; // <--- CAMBIO AQUÍ
import type { TokenData } from '../Wizard';

interface Step2Props {
  tokenData: TokenData;
  onDataChange: (data: Partial<TokenData>) => void;
  onComplete: () => void;
}

export default function Step2_Design({ tokenData, onDataChange, onComplete }: Step2Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const handleGenerateLogo = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/generate/logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tokenData.name, description: tokenData.description }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al conectar con la API de generación de logos.');
      }
      
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      setLogoUrl(data.logoUrl);
      onDataChange({ logoUrl: data.logoUrl });

    } catch (err) { // <--- CAMBIO AQUÍ
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ha ocurrido un error desconocido.');
      }
    } finally {
      setIsLoading(false);
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
            <h3 className="text-lg font-semibold text-green-300 mb-4">¡Logo generado!</h3>
            {/* CAMBIO AQUÍ */}
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
          onClick={handleGenerateLogo}
          className="w-full px-6 py-3 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 transition-colors disabled:bg-gray-500"
          disabled={isLoading}
        >
          {isLoading ? 'Creando logo con DALL·E...' : '✨ Generar Logo con IA'}
        </button>
      )}

      {error && <p className="mt-4 text-red-400">{error}</p>}
    </div>
  );
}