import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { 
  Brain, 
  Mic, 
  Shield, 
  Leaf, 
  Gift, 
  MessageCircle,
  CreditCard,
  Star,
  MapPin,
  Clock
} from 'lucide-react';

const FeaturesSection = () => {
  const { t } = useTranslation();
  
  const coreFeatures = [
    {
      icon: MapPin,
      title: t('features.realTimeTracking'),
      description: t('features.realTimeTrackingDesc')
    },
    {
      icon: Clock,
      title: t('features.instantBooking'),
      description: t('features.instantBookingDesc')
    },
    {
      icon: Shield,
      title: t('features.safetyFirst'),
      description: t('features.safetyFirstDesc')
    },
    {
      icon: CreditCard,
      title: t('features.multiplePayments'),
      description: t('features.multiplePaymentsDesc')
    },
    {
      icon: MessageCircle,
      title: t('features.inAppChat'),
      description: t('features.inAppChatDesc')
    },
    {
      icon: Star,
      title: t('features.driverRatings'),
      description: t('features.driverRatingsDesc')
    }
  ];

  const futuristicFeatures = [
    {
      icon: Brain,
      title: t('features.aiFarePrediction'),
      description: t('features.aiFarePredictionDesc'),
      gradient: "gradient-primary"
    },
    {
      icon: Mic,
      title: t('features.voiceAssistant'),
      description: t('features.voiceAssistantDesc'),
      gradient: "gradient-accent"
    },
    {
      icon: Leaf,
      title: t('features.ecoFriendly'),
      description: t('features.ecoFriendlyDesc'),
      gradient: "gradient-primary"
    },
    {
      icon: Gift,
      title: t('features.loyaltyRewards'),
      description: t('features.loyaltyRewardsDesc'),
      gradient: "gradient-accent"
    }
  ];

  return (
    <section id="features" className="py-12 sm:py-16 lg:py-20 bg-muted/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
            {t('features.title')}
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            {t('features.subtitle')}
          </p>
        </div>

        {/* Core Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-16">
          {coreFeatures.map((feature, index) => (
            <Card key={index} className="p-4 sm:p-6 gradient-card card-shadow border-border/50 hover:border-primary/50 transition-smooth group">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 rounded-lg bg-primary/20 glow-primary flex-shrink-0 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm">{feature.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Futuristic Features */}
        <div className="text-center mb-8 sm:mb-10 lg:mb-12">
          <h3 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
            <span className="gradient-accent bg-clip-text text-transparent">
              {t('features.aiPowered')}
            </span>
          </h3>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground px-4">
            {t('features.aiPoweredSubtitle')}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {futuristicFeatures.map((feature, index) => (
            <Card key={index} className="p-6 sm:p-8 gradient-card card-shadow border-border/50 hover:border-accent/50 transition-smooth group">
              <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4">
                <div className={`p-3 sm:p-4 rounded-xl ${feature.gradient} glow-accent group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold">{feature.title}</h3>
                <p className="text-sm sm:text-base text-muted-foreground">{feature.description}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12 sm:mt-16">
          <Button variant="hero" size="lg" className="text-base sm:text-lg px-6 py-5 sm:px-8 sm:py-6 w-full sm:w-auto touch-manipulation">
            Experience the Future
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;