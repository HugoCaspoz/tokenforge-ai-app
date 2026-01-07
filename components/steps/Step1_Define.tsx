// En: frontend/components/steps/Step1_Define.tsx
'use client';

import { useState } from 'react';
import type { TokenData } from '../Wizard';

interface Step1Props {
  onDataChange: (data: Partial<TokenData>) => void;
  onComplete: () => void;
}

export default function Step1_Define({ onDataChange, onComplete }: Step1Props) {
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');

  // AI State
  const [purpose, setPurpose] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Manual/Shared State
  const [name, setName] = useState('');
  const [ticker, setTicker] = useState('');
  const [description, setDescription] = useState('');

  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose) {
      setError('Por favor, describe el propósito de tu token.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/generate/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purpose }),
      });

      if (!response.ok) throw new Error('Error generando respuesta IA');

      const data = await response.json();

      // Auto-fill manual fields with AI result
      setName(data.name);
      setTicker(data.ticker);
      setDescription(data.description);

      // Switch to manual view to let user edit
      setMode('manual');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSubmit = () => {
    if (!name || !ticker || !description) {
      setError('Por favor completa todos los campos.');
      return;
    }
    onDataChange({ name, ticker, description });
    onComplete();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-4">Paso 1: Define tu Token</h2>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-700">
        <button
          onClick={() => setMode('ai')}
          className={`pb-2 px-4 transition-colors ${mode === 'ai' ? 'border-b-2 border-purple-500 text-purple-400' : 'text-gray-400 hover:text-white'}`}
        >
          ✨ Generar con IA
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`pb-2 px-4 transition-colors ${mode === 'manual' ? 'border-b-2 border-purple-500 text-purple-400' : 'text-gray-400 hover:text-white'}`}
        >
          ✍️ Manual
        </button>
      </div>

      {mode === 'ai' ? (
        <div>
          <p className="text-gray-400 mb-4">Describe tu idea y deja que la IA cree el nombre, ticker y descripción por ti.</p>
          <form onSubmit={handleAiGenerate}>
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Ej: Un token para recompensar a los miembros de mi comunidad de Discord..."
              className="w-full p-3 bg-gray-700 text-white rounded-md border border-gray-600 focus:ring-2 focus:ring-purple-500 h-32"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="w-full mt-4 px-6 py-3 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 disabled:bg-gray-600"
              disabled={isLoading}
            >
              {isLoading ? 'Generando...' : 'Generar Ideas'}
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nombre del Token</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
              placeholder="Ej: Bitcoin"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Ticker (Símbolo)</label>
            <input
              type="text"
              value={ticker}
              onChange={e => setTicker(e.target.value)}
              className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white uppercase"
              placeholder="Ej: BTC"
              maxLength={6}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Descripción</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white h-24"
              placeholder="Descripción del proyecto..."
            />
          </div>

          <button
            onClick={handleManualSubmit}
            className="w-full mt-4 px-6 py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700"
          >
            Continuar al Diseño &rarr;
          </button>
        </div>
      )}

      {error && <p className="mt-4 text-red-400 bg-red-900/20 p-2 rounded">{error}</p>}
    </div>
  );
}