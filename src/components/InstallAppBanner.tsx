import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, X, Share, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';
import { toast } from 'sonner';

/**
 * Banner component that prompts users to install the PWA
 * Shows only when app is installable and not yet installed
 * Handles iOS and Android separately with platform-specific instructions
 */
export const InstallAppBanner = () => {
  const { t } = useTranslation();
  const { isInstallable, isInstalled, installApp } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent || navigator.vendor;
    if (/iPad|iPhone|iPod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/android/i.test(userAgent)) {
      setPlatform('android');
    } else {
      setPlatform('other');
    }

    // Check if user previously dismissed the banner (session only)
    const wasDismissed = sessionStorage.getItem('installBannerDismissed');
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleInstall = async () => {
    if (platform === 'ios') {
      // iOS doesn't support beforeinstallprompt, show manual instructions
      setShowIOSInstructions(true);
    } else if (isInstallable) {
      const success = await installApp();
      if (success) {
        toast.success(t('pwa.installSuccess', 'App installed successfully!'));
        setDismissed(true);
      }
    } else {
      // Show manual install instructions for desktop/other browsers
      toast.info(
        t('pwa.manualInstall', 'Use your browser menu to "Add to Home Screen" or "Install App"'),
        { duration: 8000 }
      );
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowIOSInstructions(false);
    sessionStorage.setItem('installBannerDismissed', 'true');
  };

  // Don't show if already installed or dismissed
  if (isInstalled || dismissed) {
    return null;
  }

  // Only show for iOS or when installable on other platforms
  if (platform !== 'ios' && !isInstallable) {
    return null;
  }

  // iOS Instructions View
  if (showIOSInstructions) {
    return (
      <div 
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-in slide-in-from-bottom-4"
        role="dialog"
        aria-labelledby="install-banner-title"
      >
        <div className="bg-card border border-primary/20 rounded-lg shadow-xl p-4">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Share className="w-5 h-5 text-primary" />
            </div>
            
            <div className="flex-1 min-w-0 pr-4">
              <h3 id="install-banner-title" className="text-sm font-semibold mb-2">
                Install Nexus Ride on iOS
              </h3>
              <ol className="text-xs text-muted-foreground space-y-2 mb-3">
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-primary">1.</span>
                  <span>Tap the Share button <Share className="inline h-3 w-3" /> at the bottom of Safari</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-primary">2.</span>
                  <span>Scroll down and tap "Add to Home Screen"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-primary">3.</span>
                  <span>Tap "Add" in the top right corner</span>
                </li>
              </ol>
              <Button size="sm" variant="outline" className="w-full" onClick={handleDismiss}>
                Got it
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-in slide-in-from-bottom-4"
      role="dialog"
      aria-labelledby="install-banner-title"
      aria-describedby="install-banner-description"
    >
      <div className="bg-card border border-primary/20 rounded-lg shadow-xl p-4">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0 pr-4">
            <h3 
              id="install-banner-title"
              className="text-sm font-semibold text-foreground mb-1"
            >
              {t('pwa.installTitle', 'Install Nexus Ride')}
            </h3>
            <p 
              id="install-banner-description"
              className="text-xs text-muted-foreground mb-3"
            >
              {t('pwa.installDescription', 'Add to home screen for the best experience')}
            </p>
            
            <div className="flex gap-2">
              <Button
                onClick={handleDismiss}
                size="sm"
                variant="ghost"
                className="flex-1"
              >
                Later
              </Button>
              <Button
                onClick={handleInstall}
                size="sm"
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-1" />
                Install
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
