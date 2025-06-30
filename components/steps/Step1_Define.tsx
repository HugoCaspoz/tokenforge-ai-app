// En: frontend/components/steps/Step1_Define.tsx
'use client';

import { useState } from 'react';
import type { TokenData } from '../Wizard';

interface Step1Props {
  onDataChange: (data: Partial<TokenData>) => void;
  onComplete: () => void;
}

export default function Step1_Define({ onDataChange, onComplete }: Step1Props) {
  const [purpose, setPurpose] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedData, setGeneratedData] = useState<{ name: string; ticker: string; description: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose) {
      setError('Por favor, describe el propósito de tu token.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setGeneratedData(null);

    try {
      const response = await fetch('/api/generate/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purpose }),
      });

      if (!response.ok) {
        throw new Error('La IA no pudo generar una respuesta. Inténtalo de nuevo.');
      }

      const data = await response.json();
      setGeneratedData(data);
      // Actualizamos el estado global del Wizard con los datos nuevos
      onDataChange({ purpose, ...data });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-4">Paso 1: Define tu Idea</h2>
      <p className="text-gray-400 mb-6">Describe en una frase el objetivo de tu criptomoneda. La IA se encargará del resto.</p>
      
      <form onSubmit={handleSubmit}>
        <textarea
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder="Ej: Un token para recompensar a los miembros de mi comunidad de Discord por participar en eventos."
          className="w-full p-3 bg-gray-700 text-white rounded-md border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
          rows={3}
          disabled={isLoading}
        />
        
        <button 
          type="submit"
          className="w-full mt-4 px-6 py-3 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? 'Generando con IA...' : 'Generar Ideas'}
        </button>
      </form>

      {error && <p className="mt-4 text-red-400">{error}</p>}

      {generatedData && (
        <div className="mt-6 p-4 bg-green-900/50 border border-green-700 rounded-md">
          <h3 className="font-bold text-lg text-green-300">¡Ideas generadas!</h3>
          <p><strong>Nombre:</strong> {generatedData.name}</p>
          <p><strong>Ticker:</strong> ${generatedData.ticker.toUpperCase()}</p>
          <p><strong>Descripción:</strong> {generatedData.description}</p>

          <button 
            onClick={onComplete}
            className="w-full mt-4 px-6 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors"
          >
            ¡Me gusta! Siguiente Paso &rarr;
          </button>
        </div>
      )}
    </div>
  );
}