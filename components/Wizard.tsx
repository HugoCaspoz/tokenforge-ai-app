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
  const [userId, setUserId] = useState<string | null>(null);

  // 1. Load State on Mount
  useEffect(() => {
    const initializeWizard = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id || null;
      setUserId(currentUserId);
      setIsLoaded(true);
    };

    initializeWizard();
  }, []);



  // 3. Reset state on Logout (prevent data leakage to guest)
  useEffect(() => {
    if (isLoaded && !userId) {
      // User logged out, clear internal state to avoid saving it to guest slot
      setStep(1);
      setTokenData({
        purpose: '',
        name: '',
        ticker: '',
        description: '',
      });
    }
  }, [userId, isLoaded]);

  const handleDeploySuccess = () => {
    // Reset wizard state on successful deployment
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
      {step === 3 && <Step3_Deploy tokenData={tokenData} onDeploySuccess={handleDeploySuccess} />}
    </div>
  );
}
