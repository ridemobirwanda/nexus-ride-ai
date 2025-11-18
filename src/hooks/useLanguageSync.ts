import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export function useLanguageSync() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'language' && e.newValue && e.newValue !== i18n.language) {
        i18n.changeLanguage(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [i18n]);
}
