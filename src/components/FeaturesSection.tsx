import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
  const coreFeatures = [
    {
      icon: MapPin,
      title: "Real-Time Tracking",
      description: "Track your driver's location in real-time with precision GPS technology"
    },
    {
      icon: Clock,
      title: "Instant Booking",
      description: "Book rides in seconds with our lightning-fast matching algorithm"
    },
    {
      icon: Shield,
      title: "Safety First",
      description: "SOS button, ride sharing, and driver verification for your peace of mind"
    },
    {
      icon: CreditCard,
      title: "Multiple Payments",
      description: "Cash, mobile money (MTN, Airtel), and card payments supported"
    },
    {
      icon: MessageCircle,
      title: "In-App Chat",
      description: "Communicate with your driver without sharing personal numbers"
    },
    {
      icon: Star,
      title: "Driver Ratings",
      description: "Rate and review drivers to maintain high service quality"
    }
  ];

  const futuristicFeatures = [
    {
      icon: Brain,
      title: "AI Fare Prediction",
      description: "Smart pricing that adapts to traffic, weather, and demand patterns",
      gradient: "gradient-primary"
    },
    {
      icon: Mic,
      title: "Voice Assistant",
      description: "Book rides hands-free with our intelligent voice booking system",
      gradient: "gradient-accent"
    },
    {
      icon: Leaf,
      title: "Eco-Friendly Routes",
      description: "Get suggestions for shared rides and eco-friendly vehicle options",
      gradient: "gradient-primary"
    },
    {
      icon: Gift,
      title: "Loyalty Rewards",
      description: "Earn points for every ride and unlock exclusive benefits",
      gradient: "gradient-accent"
    }
  ];

  return (
    <section id="features" className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">
            <span className="gradient-hero bg-clip-text text-transparent">
              Revolutionary
            </span>{" "}
            Features
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Experience the future of transportation with cutting-edge technology 
            and user-centric design
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
              AI-Powered
            </span>{" "}
            Innovations
          </h3>
          <p className="text-lg text-muted-foreground">
            Next-generation features that set us apart
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