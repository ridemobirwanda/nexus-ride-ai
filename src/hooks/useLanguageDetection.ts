import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const SUPPORTED_LANGUAGES = ['en', 'el', 'fr'];
const LANGUAGE_DETECTION_KEY = 'language-detection-shown';

export function useLanguageDetection() {
  const { i18n } = useTranslation();
  const [suggestedLanguage, setSuggestedLanguage] = useState<string | null>(null);
  const [showSuggestion, setShowSuggestion] = useState(false);

  useEffect(() => {
    // Check if we've already shown the suggestion
    const hasShownSuggestion = localStorage.getItem(LANGUAGE_DETECTION_KEY);
    const hasLanguagePreference = localStorage.getItem('language');

    if (hasShownSuggestion || hasLanguagePreference) {
      return;
    }

    // Get browser language
    const browserLang = navigator.language.split('-')[0]; // Get 'en' from 'en-US'
    
    // Check if browser language is supported and different from current
    if (SUPPORTED_LANGUAGES.includes(browserLang) && browserLang !== i18n.language) {
      setSuggestedLanguage(browserLang);
      setShowSuggestion(true);
    } else {
      // Mark as shown even if no suggestion needed
      localStorage.setItem(LANGUAGE_DETECTION_KEY, 'true');
    }
  }, [i18n.language]);

  const acceptSuggestion = () => {
    if (suggestedLanguage) {
      i18n.changeLanguage(suggestedLanguage);
      localStorage.setItem('language', suggestedLanguage);
    }
    localStorage.setItem(LANGUAGE_DETECTION_KEY, 'true');
    setShowSuggestion(false);
  };

  const dismissSuggestion = () => {
    localStorage.setItem(LANGUAGE_DETECTION_KEY, 'true');
    setShowSuggestion(false);
  };

  return {
    showSuggestion,
    suggestedLanguage,
    acceptSuggestion,
    dismissSuggestion,
  };
}
