import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
// import * as RNLocalize from 'react-native-localize';

// 导入 Intl polyfill 以支持 PluralRules
import 'intl-pluralrules';

// 导入语言资源
import zh from './zh.json';
import en from './en.json';

// 获取设备默认语言
const getDefaultLanguage = () => {
  // const locales = RNLocalize.getLocales();
  // if (locales.length > 0) {
  //   const deviceLanguage = locales[0].languageCode;
  //   // 支持的语言列表
  //   const supportedLanguages = ['zh', 'en'];
  //   return supportedLanguages.includes(deviceLanguage) ? deviceLanguage : 'zh';
  // }
  return 'zh'; // 默认中文
};

// 初始化 i18n
i18n.use(initReactI18next).init({
  // 默认语言
  lng: getDefaultLanguage(),
  // 备用语言
  fallbackLng: 'zh',
  // 调试模式（生产环境建议关闭）
  debug: __DEV__,
  
  // 语言资源
  resources: {
    zh: {
      translation: zh,
    },
    en: {
      translation: en,
    },
  },

  // 插值选项
  interpolation: {
    escapeValue: false, // React 已经处理了 XSS 防护
  },

  // 复数规则配置
  pluralSeparator: '_',
  contextSeparator: '_',
  
  // 检测语言变化
  detection: {
    // 检测顺序
    order: ['localStorage', 'navigator'],
    // 缓存用户语言
    caches: ['localStorage'],
  },

  // React 选项
  react: {
    // 等待组件准备好再渲染
    useSuspense: false,
  },
  
  // 简化配置，减少对 Intl API 的依赖
  compatibilityJSON: 'v3',
});

export default i18n;

// 导出切换语言函数
export const changeLanguage = (language: 'zh' | 'en') => {
  i18n.changeLanguage(language);
};

// 导出获取当前语言函数
export const getCurrentLanguage = (): 'zh' | 'en' => {
  return i18n.language as 'zh' | 'en';
};