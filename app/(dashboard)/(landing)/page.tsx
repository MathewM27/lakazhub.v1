'use client';

import { HeroSection } from "./components/sections/hero-section";
import { PageWrapper } from "./components/layout/PageWrapper";
import dynamic from 'next/dynamic';

const WhyUsSection = dynamic(() => import('./components/sections/why-us').then(mod => mod.WhyUsSection), { ssr: false });
const PropertySlider = dynamic(() => import('./components/sections/property-slider').then(mod => mod.PropertySlider), { ssr: false });
const SignupSection = dynamic(() => import('./components/sections/signup-section').then(mod => mod.SignupSection), { ssr: false });
const Footer = dynamic(() => import('./components/navigation/footer').then(mod => mod.Footer), { ssr: false });

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
