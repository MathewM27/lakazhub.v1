'use client';

import { HeroSection } from "./components/sections/hero-section";
import { WhyUsSection } from "./components/sections/why-us";
import { SignupSection } from "./components/sections/signup-section";
import { PageWrapper } from "./components/common/PageWrapper";
import { Footer } from "./components/navigation/footer";
import { PropertySlider } from "./components/sections/property-slider";


export default function Home() {
  return (
    <PageWrapper>
      <HeroSection />
      <WhyUsSection />
      <PropertySlider />
      <SignupSection />
      <Footer />
    </PageWrapper>
  );
}
