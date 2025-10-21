import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslations from './locales/en/common.json';
import esTranslations from './locales/es/common.json';
import frTranslations from './locales/fr/common.json';
import deTranslations from './locales/de/common.json';
import zhTranslations from './locales/zh/common.json';
import jaTranslations from './locales/ja/common.json';
import arTranslations from './locales/ar/common.json';
import ptTranslations from './locales/pt/common.json';
import ruTranslations from './locales/ru/common.json';
import koTranslations from './locales/ko/common.json';
import orTranslations from './locales/or/common.json';

export const supportedLanguages = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
];

export const rtlLanguages = ['ar', 'he', 'fa', 'ur'];

const resources = {
  en: { common: enTranslations },
  or: { common: orTranslations },
  es: { common: esTranslations },
  fr: { common: frTranslations },
  de: { common: deTranslations },
  zh: { common: zhTranslations },
  ja: { common: jaTranslations },
  ar: { common: arTranslations },
  pt: { common: ptTranslations },
  ru: { common: ruTranslations },
  ko: { common: koTranslations },
};

// Cultural formatting utilities
export const getCultureConfig = (language: string) => {
  const configs: { [key: string]: any } = {
    en: {
      dateFormat: 'MM/DD/YYYY',
      timeFormat: 'h:mm A',
      currency: 'USD',
      numberFormat: '1,234.56',
      firstDayOfWeek: 0, // Sunday
      direction: 'ltr',
    },
    es: {
      dateFormat: 'DD/MM/YYYY',
      timeFormat: 'HH:mm',
      currency: 'EUR',
      numberFormat: '1.234,56',
      firstDayOfWeek: 1, // Monday
      direction: 'ltr',
    },
    fr: {
      dateFormat: 'DD/MM/YYYY',
      timeFormat: 'HH:mm',
      currency: 'EUR',
      numberFormat: '1 234,56',
      firstDayOfWeek: 1, // Monday
      direction: 'ltr',
    },
    de: {
      dateFormat: 'DD.MM.YYYY',
      timeFormat: 'HH:mm',
      currency: 'EUR',
      numberFormat: '1.234,56',
      firstDayOfWeek: 1, // Monday
      direction: 'ltr',
    },
    zh: {
      dateFormat: 'YYYY/MM/DD',
      timeFormat: 'HH:mm',
      currency: 'CNY',
      numberFormat: '1,234.56',
      firstDayOfWeek: 1, // Monday
      direction: 'ltr',
    },
    ja: {
      dateFormat: 'YYYY/MM/DD',
      timeFormat: 'HH:mm',
      currency: 'JPY',
      numberFormat: '1,234',
      firstDayOfWeek: 0, // Sunday
      direction: 'ltr',
    },
    ar: {
      dateFormat: 'DD/MM/YYYY',
      timeFormat: 'HH:mm',
      currency: 'SAR',
      numberFormat: '1,234.56',
      firstDayOfWeek: 6, // Saturday
      direction: 'rtl',
    },
    pt: {
      dateFormat: 'DD/MM/YYYY',
      timeFormat: 'HH:mm',
      currency: 'BRL',
      numberFormat: '1.234,56',
      firstDayOfWeek: 0, // Sunday
      direction: 'ltr',
    },
    ru: {
      dateFormat: 'DD.MM.YYYY',
      timeFormat: 'HH:mm',
      currency: 'RUB',
      numberFormat: '1 234,56',
      firstDayOfWeek: 1, // Monday
      direction: 'ltr',
    },
    ko: {
      dateFormat: 'YYYY.MM.DD',
      timeFormat: 'HH:mm',
      currency: 'KRW',
      numberFormat: '1,234',
      firstDayOfWeek: 0, // Sunday
      direction: 'ltr',
    },
    or: {
      dateFormat: 'DD/MM/YYYY',
      timeFormat: 'HH:mm',
      currency: 'INR',
      numberFormat: '1,23,456.78', // Indian number format
      firstDayOfWeek: 0, // Sunday
      direction: 'ltr',
    },
  };

  return configs[language] || configs.en;
};

// Date formatting with cultural awareness
export const formatDate = (date: Date | string, language?: string) => {
  const lang = language || i18n.language;
  const config = getCultureConfig(lang);
  
  if (typeof date === 'string') {
    date = new Date(date);
  }

  return new Intl.DateTimeFormat(lang, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

export const formatTime = (date: Date | string, language?: string) => {
  const lang = language || i18n.language;
  
  if (typeof date === 'string') {
    date = new Date(date);
  }

  return new Intl.DateTimeFormat(lang, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const formatDateTime = (date: Date | string, language?: string) => {
  const lang = language || i18n.language;
  
  if (typeof date === 'string') {
    date = new Date(date);
  }

  return new Intl.DateTimeFormat(lang, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// Number formatting with cultural awareness
export const formatNumber = (number: number, language?: string) => {
  const lang = language || i18n.language;
  return new Intl.NumberFormat(lang).format(number);
};

export const formatCurrency = (amount: number, language?: string) => {
  const lang = language || i18n.language;
  const config = getCultureConfig(lang);
  
  return new Intl.NumberFormat(lang, {
    style: 'currency',
    currency: config.currency,
  }).format(amount);
};

export const formatPercentage = (value: number, language?: string) => {
  const lang = language || i18n.language;
  
  return new Intl.NumberFormat(lang, {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
};

// Relative time formatting
export const formatRelativeTime = (date: Date | string, language?: string) => {
  const lang = language || i18n.language;
  
  if (typeof date === 'string') {
    date = new Date(date);
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });

  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, 'second');
  } else if (diffInSeconds < 3600) {
    return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
  } else if (diffInSeconds < 86400) {
    return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
  } else if (diffInSeconds < 2592000) {
    return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
  } else if (diffInSeconds < 31536000) {
    return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
  } else {
    return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
  }
};

// Pluralization helpers
export const getPlural = (count: number, singular: string, plural?: string, language?: string) => {
  const lang = language || i18n.language;
  const pr = new Intl.PluralRules(lang);
  const rule = pr.select(count);
  
  if (rule === 'one') {
    return singular;
  }
  
  return plural || `${singular}s`;
};

// Educational terms localization
export const getEducationalTerms = (language?: string) => {
  const lang = language || i18n.language;
  
  const terms: { [key: string]: { [key: string]: string } } = {
    en: {
      grade: 'Grade',
      assessment: 'Assessment',
      metacognition: 'Metacognition',
      reflection: 'Reflection',
      collaboration: 'Collaboration',
      tutor: 'Tutor',
      classroom: 'Classroom',
      student: 'Student',
      teacher: 'Teacher',
      progress: 'Progress',
      learning: 'Learning',
      knowledge: 'Knowledge',
      understanding: 'Understanding',
      thinking: 'Thinking',
      strategy: 'Strategy',
      skill: 'Skill',
      competency: 'Competency',
      objective: 'Objective',
      outcome: 'Outcome',
      feedback: 'Feedback',
    },
    es: {
      grade: 'Calificación',
      assessment: 'Evaluación',
      metacognition: 'Metacognición',
      reflection: 'Reflexión',
      collaboration: 'Colaboración',
      tutor: 'Tutor',
      classroom: 'Aula',
      student: 'Estudiante',
      teacher: 'Profesor',
      progress: 'Progreso',
      learning: 'Aprendizaje',
      knowledge: 'Conocimiento',
      understanding: 'Comprensión',
      thinking: 'Pensamiento',
      strategy: 'Estrategia',
      skill: 'Habilidad',
      competency: 'Competencia',
      objective: 'Objetivo',
      outcome: 'Resultado',
      feedback: 'Retroalimentación',
    },
    fr: {
      grade: 'Note',
      assessment: 'Évaluation',
      metacognition: 'Métacognition',
      reflection: 'Réflexion',
      collaboration: 'Collaboration',
      tutor: 'Tuteur',
      classroom: 'Classe',
      student: 'Étudiant',
      teacher: 'Enseignant',
      progress: 'Progrès',
      learning: 'Apprentissage',
      knowledge: 'Connaissance',
      understanding: 'Compréhension',
      thinking: 'Réflexion',
      strategy: 'Stratégie',
      skill: 'Compétence',
      competency: 'Compétence',
      objective: 'Objectif',
      outcome: 'Résultat',
      feedback: 'Retour',
    },
    de: {
      grade: 'Note',
      assessment: 'Bewertung',
      metacognition: 'Metakognition',
      reflection: 'Reflexion',
      collaboration: 'Zusammenarbeit',
      tutor: 'Tutor',
      classroom: 'Klassenzimmer',
      student: 'Student',
      teacher: 'Lehrer',
      progress: 'Fortschritt',
      learning: 'Lernen',
      knowledge: 'Wissen',
      understanding: 'Verständnis',
      thinking: 'Denken',
      strategy: 'Strategie',
      skill: 'Fähigkeit',
      competency: 'Kompetenz',
      objective: 'Ziel',
      outcome: 'Ergebnis',
      feedback: 'Rückmeldung',
    },
    zh: {
      grade: '成绩',
      assessment: '评估',
      metacognition: '元认知',
      reflection: '反思',
      collaboration: '协作',
      tutor: '导师',
      classroom: '教室',
      student: '学生',
      teacher: '教师',
      progress: '进步',
      learning: '学习',
      knowledge: '知识',
      understanding: '理解',
      thinking: '思考',
      strategy: '策略',
      skill: '技能',
      competency: '能力',
      objective: '目标',
      outcome: '结果',
      feedback: '反馈',
    },
    ja: {
      grade: '成績',
      assessment: '評価',
      metacognition: 'メタ認知',
      reflection: '振り返り',
      collaboration: '協働',
      tutor: 'チューター',
      classroom: '教室',
      student: '学生',
      teacher: '教師',
      progress: '進歩',
      learning: '学習',
      knowledge: '知識',
      understanding: '理解',
      thinking: '思考',
      strategy: '戦略',
      skill: 'スキル',
      competency: '能力',
      objective: '目標',
      outcome: '成果',
      feedback: 'フィードバック',
    },
    ar: {
      grade: 'الدرجة',
      assessment: 'التقييم',
      metacognition: 'ما وراء المعرفة',
      reflection: 'التأمل',
      collaboration: 'التعاون',
      tutor: 'المعلم الخصوصي',
      classroom: 'الفصل الدراسي',
      student: 'الطالب',
      teacher: 'المعلم',
      progress: 'التقدم',
      learning: 'التعلم',
      knowledge: 'المعرفة',
      understanding: 'الفهم',
      thinking: 'التفكير',
      strategy: 'الاستراتيجية',
      skill: 'المهارة',
      competency: 'الكفاءة',
      objective: 'الهدف',
      outcome: 'النتيجة',
      feedback: 'التغذية الراجعة',
    },
  };

  return terms[lang] || terms.en;
};

// Initialize i18n
i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false, // React already escapes
    },

    detection: {
      order: ['localStorage', 'cookie', 'navigator', 'htmlTag'],
      caches: ['localStorage', 'cookie'],
    },

    react: {
      useSuspense: false,
    },

    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
  });

// Set document direction based on language
i18n.on('languageChanged', (language) => {
  const config = getCultureConfig(language);
  document.documentElement.setAttribute('dir', config.direction);
  document.documentElement.setAttribute('lang', language);
});

export default i18n;