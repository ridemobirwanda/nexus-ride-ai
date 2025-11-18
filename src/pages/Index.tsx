import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import AppPreviewSection from '@/components/AppPreviewSection';
import Footer from '@/components/Footer';
import { SkipToContent } from '@/components/SkipToContent';

const Index = () => {
  return (
    <div className="min-h-screen rider-bg">
      <SkipToContent />
      <Navigation />
      <main id="main-content" tabIndex={-1}>
        <HeroSection />
        <section id="features" aria-labelledby="features-heading">
          <FeaturesSection />
        </section>
        <AppPreviewSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
