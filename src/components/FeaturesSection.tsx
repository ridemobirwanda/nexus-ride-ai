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
    <section id="features" className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">
            {t('features.title')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('features.subtitle')}
          </p>
        </div>

        {/* Core Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {coreFeatures.map((feature, index) => (
            <Card key={index} className="p-6 gradient-card card-shadow border-border/50 hover:border-primary/50 transition-smooth">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/20 glow-primary">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Futuristic Features */}
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold mb-4">
            <span className="gradient-accent bg-clip-text text-transparent">
              {t('features.aiPowered')}
            </span>
          </h3>
          <p className="text-lg text-muted-foreground">
            {t('features.aiPoweredSubtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {futuristicFeatures.map((feature, index) => (
            <Card key={index} className="p-8 gradient-card card-shadow border-border/50 hover:border-accent/50 transition-smooth group">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={`p-4 rounded-xl ${feature.gradient} glow-accent`}>
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <Button variant="hero" size="lg" className="text-lg px-8 py-6">
            Experience the Future
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;