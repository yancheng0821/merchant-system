import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zhCN from './locales/zh-CN.json';
import enUS from './locales/en-US.json';
import koKR from './locales/ko-KR.json';
import jaJP from './locales/ja-JP.json';
import esES from './locales/es-ES.json';
import frFR from './locales/fr-FR.json';

const resources = {
  'zh-CN': {
    translation: zhCN,
  },
  'en-US': {
    translation: enUS,
  },
  'ko-KR': {
    translation: koKR,
  },
  'ja-JP': {
    translation: jaJP,
  },
  'es-ES': {
    translation: esES,
  },
  'fr-FR': {
    translation: frFR,
  },
};

// 从 localStorage 获取保存的语言设置，如果没有则使用默认语言
const savedLanguage = localStorage.getItem('language') || 'en-US';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage, // 使用保存的语言或默认语言
    fallbackLng: 'en-US',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n; 