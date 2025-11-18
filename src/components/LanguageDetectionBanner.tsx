import { useTranslation } from 'react-i18next';
import { useLanguageDetection } from '@/hooks/useLanguageDetection';
import { Button } from '@/components/ui/button';
import { X, Globe } from 'lucide-react';

const languageNames: Record<string, string> = {
  en: 'English',
  el: 'Ελληνικά',
  fr: 'Français',
};

export function LanguageDetectionBanner() {
  const { t } = useTranslation();
  const { showSuggestion, suggestedLanguage, acceptSuggestion, dismissSuggestion } = useLanguageDetection();

  if (!showSuggestion || !suggestedLanguage) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground mb-2">
              {t('languageDetection.title')}
            </p>
            <p className="text-sm text-muted-foreground mb-3">
              {t('languageDetection.message', { language: languageNames[suggestedLanguage] })}
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={acceptSuggestion}>
                {t('languageDetection.accept')}
              </Button>
              <Button size="sm" variant="ghost" onClick={dismissSuggestion}>
                {t('languageDetection.dismiss')}
              </Button>
            </div>
          </div>
          <button
            onClick={dismissSuggestion}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
