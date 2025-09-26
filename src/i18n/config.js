import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import esCommon from '../locales/es/common.json';
import esAuth from '../locales/es/auth.json';
import esDashboard from '../locales/es/dashboard.json';
import esKyc from '../locales/es/kyc.json';
import esWallet from '../locales/es/wallet.json';
import esTrading from '../locales/es/trading.json';
import esSettings from '../locales/es/settings.json';
import esNotifications from '../locales/es/notifications.json';
import esErrors from '../locales/es/errors.json';
import esForms from '../locales/es/forms.json';
import esTools from '../locales/es/tools.json';
import esAffiliates from '../locales/es/affiliates.json';
import esCopytrading from '../locales/es/copytrading.json';
import esPamm from '../locales/es/pamm.json';

import enCommon from '../locales/en/common.json';
import enAuth from '../locales/en/auth.json';
import enDashboard from '../locales/en/dashboard.json';
import enKyc from '../locales/en/kyc.json';
import enWallet from '../locales/en/wallet.json';
import enTrading from '../locales/en/trading.json';
import enSettings from '../locales/en/settings.json';
import enNotifications from '../locales/en/notifications.json';
import enErrors from '../locales/en/errors.json';
import enForms from '../locales/en/forms.json';
import enTools from '../locales/en/tools.json';
import enAffiliates from '../locales/en/affiliates.json';
import enCopytrading from '../locales/en/copytrading.json';
import enPamm from '../locales/en/pamm.json';

const resources = {
  es: {
    common: esCommon,
    auth: esAuth,
    dashboard: esDashboard,
    kyc: esKyc,
    wallet: esWallet,
    trading: esTrading,
    settings: esSettings,
    notifications: esNotifications,
    errors: esErrors,
    forms: esForms,
    tools: esTools,
    affiliates: esAffiliates,
    copytrading: esCopytrading,
    pamm: esPamm
  },
  en: {
    common: enCommon,
    auth: enAuth,
    dashboard: enDashboard,
    kyc: enKyc,
    wallet: enWallet,
    trading: enTrading,
    settings: enSettings,
    notifications: enNotifications,
    errors: enErrors,
    forms: enForms,
    tools: enTools,
    affiliates: enAffiliates,
    copytrading: enCopytrading,
    pamm: enPamm
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'es', // Default to Spanish
    fallbackLng: 'es',
    debug: false,
    
    ns: ['common', 'auth', 'dashboard', 'kyc', 'wallet', 'trading', 'settings', 'notifications', 'errors', 'forms', 'tools', 'affiliates', 'copytrading', 'pamm'],
    defaultNS: 'common',
    
    interpolation: {
      escapeValue: false // React already escapes values
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    }
  });

export default i18n;