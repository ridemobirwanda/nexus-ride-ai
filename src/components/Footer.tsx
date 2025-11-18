import { Car, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();
  
  return (
    <footer className="bg-muted/30 border-t border-border">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg gradient-primary">
                <Car className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold gradient-hero bg-clip-text text-transparent">
                RideNext
              </span>
            </div>
            <p className="text-muted-foreground">
              {t('footer.tagline')}
            </p>
            <div className="flex gap-4">
              <div className="p-2 rounded-lg bg-muted hover:bg-primary/20 transition-smooth cursor-pointer">
                <Facebook className="h-4 w-4" />
              </div>
              <div className="p-2 rounded-lg bg-muted hover:bg-primary/20 transition-smooth cursor-pointer">
                <Twitter className="h-4 w-4" />
              </div>
              <div className="p-2 rounded-lg bg-muted hover:bg-primary/20 transition-smooth cursor-pointer">
                <Instagram className="h-4 w-4" />
              </div>
              <div className="p-2 rounded-lg bg-muted hover:bg-primary/20 transition-smooth cursor-pointer">
                <Linkedin className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t('footer.quickLinks')}</h3>
            <div className="space-y-2">
              <a href="#" className="block text-muted-foreground hover:text-foreground transition-smooth">
                {t('footer.bookRide')}
              </a>
              <a href="#" className="block text-muted-foreground hover:text-foreground transition-smooth">
                {t('footer.becomeDriver')}
              </a>
              <a href="#" className="block text-muted-foreground hover:text-foreground transition-smooth">
                {t('footer.helpCenter')}
              </a>
              <a href="#" className="block text-muted-foreground hover:text-foreground transition-smooth">
                {t('footer.safety')}
              </a>
            </div>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t('footer.company')}</h3>
            <div className="space-y-2">
              <a href="#" className="block text-muted-foreground hover:text-foreground transition-smooth">
                {t('footer.aboutUs')}
              </a>
              <a href="#" className="block text-muted-foreground hover:text-foreground transition-smooth">
                {t('footer.careers')}
              </a>
              <a href="#" className="block text-muted-foreground hover:text-foreground transition-smooth">
                {t('footer.press')}
              </a>
              <a href="#" className="block text-muted-foreground hover:text-foreground transition-smooth">
                {t('footer.blog')}
              </a>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t('footer.contact')}</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t('footer.phone')}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t('footer.email')}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t('footer.location')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-muted-foreground text-sm">
            {t('footer.copyright')}
          </div>
          <div className="flex gap-6 text-sm">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-smooth">
              {t('footer.privacyPolicy')}
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-smooth">
              {t('footer.termsOfService')}
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-smooth">
              {t('footer.cookiePolicy')}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;