// src/hooks/useI18n.js
import { useState, useEffect, useCallback } from "react";

const useI18n = (initialLang = "en") => {
  const [lang, setLang] = useState(initialLang);
  const [translations, setTranslations] = useState({});

  const loadTranslations = useCallback(async (language) => {
    try {
      const translationModule = await import(`../locales/${language}.json`);
      setTranslations(translationModule.default);
    } catch (error) {
      console.error(
        `Could not load translation for language: ${language}`,
        error
      );

      // Fallback to English if language not found
      try {
        const fallbackModule = await import(`../locales/en.json`);
        setTranslations(fallbackModule.default);
      } catch (fallbackError) {
        console.error(
          "Failed to load fallback English translations",
          fallbackError
        );
      }
    }
  }, []);

  useEffect(() => {
    loadTranslations(lang);
  }, [lang, loadTranslations]);

  // Translation function
  const t = useCallback(
    (key) => {
      return translations[key] || key;
    },
    [translations]
  );

  // Change language function
  const changeLanguage = (newLang) => {
    setLang(newLang);
  };

  return { t, changeLanguage, currentLang: lang };
};

export default useI18n;
