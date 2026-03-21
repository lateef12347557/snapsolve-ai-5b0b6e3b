import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import InteractiveDemo from "@/components/InteractiveDemo";
import ArchitectureSection from "@/components/ArchitectureSection";
import { Navbar, Footer } from "@/components/NavFooter";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <div id="features">
        <FeaturesSection />
      </div>
      <div id="demo">
        <InteractiveDemo />
      </div>
      <ArchitectureSection />
      <Footer />
    </div>
  );
};

export default Index;