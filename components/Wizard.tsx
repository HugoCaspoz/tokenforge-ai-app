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

  // 1. Load User and State on Mount
  useEffect(() => {
    const initializeWizard = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id || null;
      setUserId(currentUserId);

      // Define keys
      const guestDataKey = 'wizard_tokenData_guest';
      const guestStepKey = 'wizard_step_guest';
      const userDataKey = currentUserId ? `wizard_tokenData_${currentUserId}` : null;
      const userStepKey = currentUserId ? `wizard_step_${currentUserId}` : null;

      let dataToLoad: string | null = null;
      let stepToLoad: string | null = null;

      // Migration Logic: Guest -> User
      if (currentUserId && userDataKey && userStepKey) {
        const hasUserData = localStorage.getItem(userDataKey);
        const hasGuestData = localStorage.getItem(guestDataKey);

        if (!hasUserData && hasGuestData) {
          // Migrate!
          dataToLoad = hasGuestData;
          stepToLoad = localStorage.getItem(guestStepKey);

          // Save to user slot immediately (optional, but good for consistency)
          // The save effect will handle it, but we can clean up guest data here
          localStorage.removeItem(guestDataKey);
          localStorage.removeItem(guestStepKey);
        } else {
          // Load User Data
          dataToLoad = localStorage.getItem(userDataKey);
          stepToLoad = localStorage.getItem(userStepKey);
        }
      } else {
        // Guest Mode
        dataToLoad = localStorage.getItem(guestDataKey);
        stepToLoad = localStorage.getItem(guestStepKey);
      }

      // Apply Data
      if (dataToLoad) {
        try {
          setTokenData(JSON.parse(dataToLoad));
        } catch (e) {
          console.error('Error parsing saved token data', e);
        }
      }
      if (stepToLoad) {
        setStep(parseInt(stepToLoad, 10));
      }

      setIsLoaded(true);
    };

    initializeWizard();
  }, []);

  // 2. Save State whenever it changes
  useEffect(() => {
    if (isLoaded) {
      const storageKeyData = userId ? `wizard_tokenData_${userId}` : 'wizard_tokenData_guest';
      const storageKeyStep = userId ? `wizard_step_${userId}` : 'wizard_step_guest';

      localStorage.setItem(storageKeyData, JSON.stringify(tokenData));
      localStorage.setItem(storageKeyStep, step.toString());
    }
  }, [tokenData, step, isLoaded, userId]);

  const clearWizardState = () => {
    const storageKeyData = userId ? `wizard_tokenData_${userId}` : 'wizard_tokenData_guest';
    const storageKeyStep = userId ? `wizard_step_${userId}` : 'wizard_step_guest';

    localStorage.removeItem(storageKeyData);
    localStorage.removeItem(storageKeyStep);

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
