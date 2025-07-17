import { useState, useEffect } from 'react';
import esTranslations from '../locales/es.json';
import enTranslations from '../locales/en.json';

const translations = {
  es: esTranslations,
  en: enTranslations
};

const useTranslation = () => {
  // Obtener idioma inicial del localStorage o usar español por defecto
  const getInitialLanguage = () => {
    const savedLanguage = localStorage.getItem('language');
    return savedLanguage && translations[savedLanguage] ? savedLanguage : 'es';
  };

  const [currentLanguage, setCurrentLanguage] = useState(getInitialLanguage);

  // Función para obtener traducción por clave usando notación de punto
  const t = (key, defaultValue = key) => {
    const keys = key.split('.');
    let value = translations[currentLanguage];

    for (const k of keys) {
      if (value && typeof value === 'object' && value[k] !== undefined) {
        value = value[k];
      } else {
        // Si no se encuentra la traducción, intentar en español como fallback
        if (currentLanguage !== 'es') {
          let fallback = translations['es'];
          for (const fallbackKey of keys) {
            if (fallback && typeof fallback === 'object' && fallback[fallbackKey] !== undefined) {
              fallback = fallback[fallbackKey];
            } else {
              return defaultValue;
            }
          }
          return fallback;
        }
        return defaultValue;
      }
    }

    return value || defaultValue;
  };

  // Función para cambiar idioma
  const changeLanguage = (language) => {
    if (translations[language]) {
      setCurrentLanguage(language);
      localStorage.setItem('language', language);
    }
  };

  // Efecto para detectar cambios en localStorage desde otras pestañas
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'language' && e.newValue && translations[e.newValue]) {
        setCurrentLanguage(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return {
    t,
    currentLanguage,
    changeLanguage,
    availableLanguages: Object.keys(translations)
  };
};

export default useTranslation;