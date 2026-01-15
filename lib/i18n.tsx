'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import en from '@/messages/en.json';
import es from '@/messages/es.json';

type Locale = 'en' | 'es';
type Messages = typeof en;

interface I18nContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const messages: Record<Locale, Messages> = { en, es };

export function I18nProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>('es'); // Spanish by default
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Load saved locale from localStorage
        const saved = localStorage.getItem('locale') as Locale;
        if (saved && (saved === 'en' || saved === 'es')) {
            setLocaleState(saved);
        }
    }, []);

    const setLocale = (newLocale: Locale) => {
        setLocaleState(newLocale);
        if (typeof window !== 'undefined') {
            localStorage.setItem('locale', newLocale);
        }
    };

    const t = (key: string): string => {
        const keys = key.split('.');
        let value: any = messages[locale];

        for (const k of keys) {
            value = value?.[k];
        }

        return value || key;
    };

    // We render children immediately to allow SSR (Server Side Rendering).
    // The language will default to 'es' on the server and initial client render,
    // then switch to the user's preference in useEffect to avoid hydration mismatch failures
    // caused by rendering nothing on the server.

    return (
        <I18nContext.Provider value={{ locale, setLocale, t }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useTranslation() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useTranslation must be used within I18nProvider');
    }
    return context;
}
