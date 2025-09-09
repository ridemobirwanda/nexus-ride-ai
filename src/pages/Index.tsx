import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import AppPreviewSection from '@/components/AppPreviewSection';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen rider-bg">
      <Navigation />
      <main>
        <HeroSection />
        <section id="features">
          <FeaturesSection />
        </section>
        <AppPreviewSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
