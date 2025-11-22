import QRCode from 'react-qr-code';
import { Smartphone, Scan } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';

const QRCodeSection = () => {
  const { t } = useTranslation();
  const appUrl = 'https://91da82cd-5ab8-4a25-acdd-70666464e11a.lovable.app';

  return (
    <section className="py-20 bg-muted/30" aria-labelledby="qr-section-heading">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Scan className="w-8 h-8 text-primary" aria-hidden="true" />
            </div>
            <h2 
              id="qr-section-heading"
              className="text-3xl md:text-4xl font-bold mb-4"
            >
              {t('qr.title', 'Scan & Go')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('qr.description', 'Scan this QR code with your phone to instantly open Nexus Ride and start booking rides')}
            </p>
          </div>

          <Card className="p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* QR Code */}
              <div className="flex justify-center">
                <div className="p-6 bg-white rounded-2xl shadow-lg">
                  <QRCode
                    value={appUrl}
                    size={200}
                    level="H"
                    className="w-full h-auto"
                    aria-label={t('qr.ariaLabel', 'QR code to open Nexus Ride app')}
                  />
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Smartphone className="w-6 h-6 text-primary" aria-hidden="true" />
                  {t('qr.howTo', 'How to scan')}
                </h3>
                
                <ol className="space-y-4 text-muted-foreground" role="list">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-semibold">
                      1
                    </span>
                    <span>{t('qr.step1', 'Open your phone camera or QR scanner app')}</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-semibold">
                      2
                    </span>
                    <span>{t('qr.step2', 'Point your camera at the QR code')}</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-semibold">
                      3
                    </span>
                    <span>{t('qr.step3', 'Tap the notification to open Nexus Ride')}</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-semibold">
                      4
                    </span>
                    <span>{t('qr.step4', 'Add to home screen for quick access anytime')}</span>
                  </li>
                </ol>

                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    {t('qr.compatible', 'Works on all modern smartphones with camera')}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default QRCodeSection;
