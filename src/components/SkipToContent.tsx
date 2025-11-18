import { useTranslation } from 'react-i18next';

export function SkipToContent() {
  const { t } = useTranslation();
  
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
      aria-label={t('accessibility.skipToMainContent')}
    >
      {t('accessibility.skipToMainContent')}
    </a>
  );
}
