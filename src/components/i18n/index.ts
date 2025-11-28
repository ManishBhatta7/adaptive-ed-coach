import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import your translation files
// If these files are empty, the app might crash. Ensure they have at least {}
import enCommon from './locales/en/common.json';
import esCommon from './locales/es/common.json';
import orCommon from './locales/or/common.json';

// === EXPORTED CONSTANTS (Fixes "Import Missing" Error) ===
export const supportedLanguages = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
];

export const getCultureConfig = (code: string) => {
  switch (code) {
    case 'es':
      return { currency: 'EUR', dateFormat: 'dd/MM/yyyy', timeFormat: 'HH:mm', direction: 'ltr' };
    case 'or':
      return { currency: 'INR', dateFormat: 'dd-MM-yyyy', timeFormat: 'h:mm tt', direction: 'ltr' };
    default:
      return { currency: 'USD', dateFormat: 'MM/dd/yyyy', timeFormat: 'h:mm tt', direction: 'ltr' };
  }
};

// === I18N INITIALIZATION ===
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: enCommon },
      es: { common: esCommon },
      or: { common: orCommon },
    },
    lng: localStorage.getItem('preferred-language') || 'en',
    fallbackLng: 'en',
    
    ns: ['common'],
    defaultNS: 'common',

    interpolation: {
      escapeValue: false, // React already safe from XSS
    },
    
    react: {
      useSuspense: false // Prevents loading issues
    }
  });

export default i18n;