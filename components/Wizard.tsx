// En: frontend/components/Wizard.tsx
'use client'; 

import { useState } from 'react';
import Step1_Define from './steps/Step1_Define';
import Step2_Design from './steps/Step2_Design';
import Step3_Deploy from './steps/Step3_Deploy'; // <--- NUEVA IMPORTACIÓN

export interface TokenData {
  purpose: string;
  name: string;
  ticker: string;
  description: string;
  logoUrl?: string;
}

export default function Wizard() {
  const [step, setStep] = useState(1);
  const [tokenData, setTokenData] = useState<TokenData>({
    purpose: '',
    name: '',
    ticker: '',
    description: '',
  });

  const handleDataChange = (newData: Partial<TokenData>) => {
    setTokenData(prev => ({ ...prev, ...newData }));
  };

  const nextStep = () => setStep(prev => prev + 1);

  return (
    <div className="w-full max-w-2xl bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-700 transition-all duration-500">
      
      {step === 1 && (
        <Step1_Define onDataChange={handleDataChange} onComplete={nextStep} />
      )}

      {step === 2 && (
        <Step2_Design 
            tokenData={tokenData} 
            onDataChange={handleDataChange} 
            onComplete={nextStep} 
        />
      )}

      {/* ---- BLOQUE NUEVO ---- */}
      {step === 3 && (
        <Step3_Deploy tokenData={tokenData} />
      )}
      {/* -------------------- */}
      
      {/* DEBUG: Muestra los datos recopilados en tiempo real */}
      <div className="mt-6 p-4 bg-gray-900 rounded-md text-xs text-gray-300 overflow-auto">
        <h3 className="font-bold text-gray-500">Estado Actual de Datos:</h3>
        <pre>{JSON.stringify(tokenData, null, 2)}</pre>
      </div>
    </div>
  );
}