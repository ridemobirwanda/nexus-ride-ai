import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';
import { toast } from 'sonner';

/**
 * Banner component that prompts users to install the PWA
 * Shows only when app is installable and not yet installed
 */
export const InstallAppBanner = () => {
  const { t } = useTranslation();
  const { isInstallable, isInstalled, installApp } = usePWA();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user previously dismissed the banner
    const wasDismissed = localStorage.getItem('installBannerDismissed');
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      toast.success(t('pwa.installSuccess'));
    } else {
      toast.error(t('pwa.installError'));
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('installBannerDismissed', 'true');
  };

  // Don't show if: already installed, not installable, or dismissed
  if (isInstalled || !isInstallable || dismissed) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-fade-in"
      role="dialog"
      aria-labelledby="install-banner-title"
      aria-describedby="install-banner-description"
    >
      <div className="bg-card border border-border rounded-lg shadow-lg p-4 backdrop-blur-lg">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
          aria-label={t('accessibility.close')}
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>

        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Download className="w-5 h-5 text-primary" aria-hidden="true" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 
              id="install-banner-title"
              className="text-sm font-semibold text-foreground mb-1"
            >
              {t('pwa.installTitle')}
            </h3>
            <p 
              id="install-banner-description"
              className="text-xs text-muted-foreground mb-3"
            >
              {t('pwa.installDescription')}
            </p>
            
            <Button
              onClick={handleInstall}
              size="sm"
              className="w-full"
              aria-label={t('pwa.installButton')}
            >
              <Download className="w-4 h-4 mr-2" aria-hidden="true" />
              {t('pwa.installButton')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
