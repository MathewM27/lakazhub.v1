'use client';

import Head from 'next/head'
import { HeroSection } from "./components/sections/hero-section";
import { PageWrapper } from "./components/layout/PageWrapper";
import InstallPrompt from "../../components/pwa/InstallPrompt";
import RegisterSW from "./components/pwa/RegisterSW";
import dynamic from 'next/dynamic';

const WhyUsSection = dynamic(() => import('./components/sections/why-us').then(mod => mod.WhyUsSection), { ssr: false });
const PropertySlider = dynamic(() => import('./components/sections/property-slider').then(mod => mod.PropertySlider), { ssr: false });
const SignupSection = dynamic(() => import('./components/sections/signup-section').then(mod => mod.SignupSection), { ssr: false });
const Footer = dynamic(() => import('./components/navigation/footer').then(mod => mod.Footer), { ssr: false });

export default function Home() {
  return (
    <>
      <Head>
        <title>Rent Property in Mauritius - LakazHub</title>
        <meta name="description" content="Find and rent houses, apartments, and properties in Mauritius easily with LakazHub." />
        <meta name="keywords" content="rent property Mauritius, houses for rent, apartments Mauritius, LakazHub, Mauritius real estate, property rental Mauritius, landlord, tenant, rental listings Mauritius" />
        <meta name="author" content="LakazHub" />
        <meta property="og:title" content="LakazHub - Rent Properties in Mauritius" />
        <meta property="og:description" content="Easily rent and find properties across Mauritius." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://lakazhub.com/" />
        <meta property="og:image" content="/lakaz-hub.png" />
        <meta name="robots" content="index, follow" />
      </Head>
      <PageWrapper>
        <RegisterSW />
        <InstallPrompt />
        <HeroSection />
        <WhyUsSection />
        <PropertySlider />
        <SignupSection />
        <Footer />
      </PageWrapper>
    </>
  );
}
