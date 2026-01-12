// En: frontend/app/create/page.tsx
'use client';

import Wizard from "@/components/Wizard";
import RequireWallet from "@/components/RequireWallet";
import { useTranslation } from '@/lib/i18n';

export default function CreatePage() {
  const { t } = useTranslation();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-900 text-white">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
          <span className="text-purple-400">Token</span>{t('create.title').replace('Token', '')}
        </h1>
        <p className="mt-4 text-xl text-gray-400">
          {t('create.subtitle')}
        </p>
      </div>

      <RequireWallet>
        <Wizard />
      </RequireWallet>

    </main>
  );
}