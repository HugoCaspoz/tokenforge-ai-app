// En: frontend/components/Wizard.tsx
'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Step1_Define from './steps/Step1_Define';
import Step2_Design from './steps/Step2_Design';
import Step3_Deploy from './steps/Step3_Deploy';

export interface TokenData {
  id?: number;
  purpose: string;
  name: string;
  ticker: string;
  description: string;
  logoUrl?: string;
}

export default function Wizard() {
  const supabase = createClient(); // <-- ESTA ES LA LÍNEA QUE FALTABA
  const [step, setStep] = useState(1);
  const [tokenData, setTokenData] = useState<TokenData>({
    purpose: '',
    name: '',
    ticker: '',
    description: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleDataChange = async (newData: Partial<TokenData>) => {
    const updatedData = { ...tokenData, ...newData };
    setTokenData(updatedData);
    setSaveError('');

    // Si tenemos los datos mínimos para guardar, procedemos
    /* 
       DISABLED: User requested NO draft creation. Saved only on deployment.
    if (updatedData.name && updatedData.ticker) {
      setIsSaving(true);
       ... logic removed ...
    }
    */
  };

  const nextStep = () => setStep(prev => prev + 1);

  return (
    <div className="w-full max-w-2xl bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-700 transition-all duration-500">
      {step === 1 && <Step1_Define onDataChange={handleDataChange} onComplete={nextStep} />}
      {step === 2 && <Step2_Design tokenData={tokenData} onDataChange={handleDataChange} onComplete={nextStep} />}
      {step === 3 && <Step3_Deploy tokenData={tokenData} />}

      {/* <div className="mt-6 p-4 bg-gray-900 rounded-md text-xs text-gray-300 overflow-auto">
        <div className='flex justify-between items-center'>
          <h3 className="font-bold text-gray-500">Estado Actual de Datos:</h3>
          {isSaving && <span className="text-blue-400 animate-pulse">Guardando...</span>}
          {saveError && <span className="text-red-400">{saveError}</span>}
        </div>
        <pre>{JSON.stringify(tokenData, null, 2)}</pre>
      </div> */}
    </div>
  );
}
