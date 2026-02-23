import React, { createContext, useContext, useState } from 'react';

type Language = 'en' | 'hi';

interface LanguageContextType {
    lang: Language;
    setLang: (lang: Language) => void;
    t: (en: string, hi: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [lang, setLangState] = useState<Language>(() => {
        const saved = localStorage.getItem('sehat_safe_language');
        return (saved === 'hi' || saved === 'en') ? saved : 'en';
    });

    const setLang = (newLang: Language) => {
        setLangState(newLang);
        localStorage.setItem('sehat_safe_language', newLang);
    };

    const t = (en: string, hi: string) => lang === 'hi' ? hi : en;

    return (
        <LanguageContext.Provider value={{ lang, setLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
