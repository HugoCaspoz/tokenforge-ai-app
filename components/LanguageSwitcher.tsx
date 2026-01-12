'use client';

import { useTranslation } from '@/lib/i18n';

export default function LanguageSwitcher() {
    const { locale, setLocale } = useTranslation();

    const languages = [
        { code: 'en', name: 'English', flag: '🇺🇸' },
        { code: 'es', name: 'Español', flag: '🇪🇸' }
    ] as const;

    const currentLanguage = languages.find(lang => lang.code === locale) || languages[0];
    const otherLanguage = languages.find(lang => lang.code !== locale) || languages[1];

    return (
        <button
            onClick={() => setLocale(otherLanguage.code)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors border border-gray-700"
            title={`Switch to ${otherLanguage.name}`}
        >
            <span className="text-xl">{currentLanguage.flag}</span>
            <span className="text-sm font-medium text-white hidden sm:inline">
                {currentLanguage.code.toUpperCase()}
            </span>
        </button>
    );
}
