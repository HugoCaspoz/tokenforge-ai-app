// En: frontend/components/Wizard.tsx
'use client';

import { useState, useEffect } from 'react';
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
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [tokenData, setTokenData] = useState<TokenData>({
    purpose: '',
    name: '',
    ticker: '',
    description: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('wizard_tokenData');
    const savedStep = localStorage.getItem('wizard_step');

    if (savedData) {
      try {
        setTokenData(JSON.parse(savedData));
      } catch (e) {
        console.error('Error parsing saved token data', e);
      }
    }

    if (savedStep) {
      setStep(parseInt(savedStep, 10));
    }
    setIsLoaded(true);
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('wizard_tokenData', JSON.stringify(tokenData));
      localStorage.setItem('wizard_step', step.toString());
    }
  }, [tokenData, step, isLoaded]);

  const clearWizardState = () => {
    localStorage.removeItem('wizard_tokenData');
    localStorage.removeItem('wizard_step');
    // Reset state to defaults
    setStep(1);
    setTokenData({
      purpose: '',
      name: '',
      ticker: '',
      description: '',
    });
  };

  const handleDataChange = async (newData: Partial<TokenData>) => {
    const updatedData = { ...tokenData, ...newData };
    setTokenData(updatedData);
    setSaveError('');
  };

  const nextStep = () => setStep(prev => prev + 1);

  if (!isLoaded) return null; // Prevent hydration mismatch or flash of default state

  return (
    <div className="w-full max-w-2xl bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-700 transition-all duration-500">
      {step === 1 && <Step1_Define onDataChange={handleDataChange} onComplete={nextStep} />}
      {step === 2 && <Step2_Design tokenData={tokenData} onDataChange={handleDataChange} onComplete={nextStep} />}
      {step === 3 && <Step3_Deploy tokenData={tokenData} onDeploySuccess={clearWizardState} />}
    </div>
  );
}
