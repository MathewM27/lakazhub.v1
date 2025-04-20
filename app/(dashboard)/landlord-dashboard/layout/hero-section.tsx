'use client'

import { useState, useEffect } from "react";
import Link from "next/link";
import { FiArrowRight, FiCheck, FiHeart, FiMapPin } from "react-icons/fi";
import Image from "next/image";

const HeroSection = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  // Handle loading state with simple sequential transitions
  useEffect(() => {
    const loadTimer = setTimeout(() => {
      setIsLoading(false);
      // Add a slight delay before triggering visibility animations
      const visibilityTimer = setTimeout(() => {
        setIsVisible(true);
      }, 100);
      return () => clearTimeout(visibilityTimer);
    }, 500);
    
    return () => clearTimeout(loadTimer);
  }, []);

  const quickFeatures = [
    { text: 'Manage multiple properties', icon: FiCheck },
    { text: 'Control your listings', icon: FiCheck },
    { text: 'Screen potential tenants', icon: FiCheck }
  ];

  return (
    <section className="relative min-h-[90vh] py-12 flex items-center justify-center bg-black overflow-hidden text-white pt-6">
      {/* Simple subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/95 via-black to-black/90 pointer-events-none"></div>
      
      {/* Subtle decorative elements */}
      <div 
        className={`absolute top-[20%] right-[10%] w-64 h-64 rounded-full bg-white/3 transition-all duration-1000 ease-out ${
          isVisible ? 'opacity-15 scale-100' : 'opacity-0 scale-90'
        }`}
      />
      
      <div 
        className={`absolute bottom-[10%] left-[5%] w-96 h-96 rounded-full bg-white/2 transition-all duration-1000 delay-300 ease-out ${
          isVisible ? 'opacity-10 scale-100' : 'opacity-0 scale-90'
        }`}
      />

      <div className="container mx-auto px-6 relative z-10">
        {isLoading ? (
          <div className="text-center max-w-4xl mx-auto">
            {/* Loading skeleton */}
            <div className="h-8 bg-white/20 w-1/2 mx-auto mb-4 rounded animate-pulse"></div>
            <div className="h-4 bg-white/10 w-3/4 mx-auto mb-6 rounded animate-pulse"></div>
            <div className="w-full h-16 bg-white/5 border border-white/10 rounded-xl animate-pulse mb-10" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="h-6 bg-white/10 rounded-lg w-3/4 animate-pulse" />
                <div className="h-6 bg-white/10 rounded-lg w-1/2 animate-pulse" />
                <div className="h-12 bg-white/10 rounded-lg w-full animate-pulse mt-6" />
              </div>
              <div className="relative h-60 bg-white/5 rounded-xl animate-pulse" />
            </div>
          </div>
        ) : (
          <div className="w-full max-w-6xl mx-auto">
            {/* Main content - two columns with main heading on left */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start pt-16">
              {/* Left column - Main heading moved here */}
              <div 
                className={`space-y-6 transition-all duration-700 delay-300 ease-out ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
              >
                <div>
                  <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight leading-tight">
                    Manage Your Properties
                  </h1>
                  <p className="mt-4 text-lg text-white/70 max-w-2xl">
                    List, manage and connect with qualified tenants in one seamless platform.
                  </p>
                </div>

                {/* Quick features - with consistent style */}
                <div className="flex flex-wrap gap-6 mt-6">
                  {quickFeatures.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 transition-all duration-500 ease-out"
                      style={{ 
                        transitionDelay: `${400 + (index * 100)}ms`,
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? 'translateX(0)' : 'translateX(-10px)'
                      }}
                    >
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                        <feature.icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-white/80">{feature.text}</span>
                    </div>
                  ))}
                </div>
                
                {/* CTA Button - using amber for landlord theme */}
                <div 
                  className={`pt-4 transition-all duration-500 delay-700 ease-out ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}
                >
                  <Link 
                    href="/add-property"
                    className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-lg hover:bg-amber-400 transition-all font-medium group"
                  >
                    <span>Add Property</span>
                    <FiArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
              
              {/* Right column - Property management card */}
              <div 
                className={`relative rounded-2xl overflow-hidden border border-white/10 shadow-lg transition-all duration-700 delay-500 ease-out mt-6 md:mt-0 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                <div className="aspect-[4/3] relative w-full max-w-md mx-auto md:mx-0">
                  <div className="absolute inset-0 z-10">
                    <Image 
                      src="https://qqqes0fuio.ufs.sh/f/7I9AgfULkX7r2wDOOlgxMUVO4urzl6ogWXn2Iw7tGeQHA1dF" 
                      alt="Featured Property"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 z-20 bg-gradient-to-b from-transparent via-transparent to-black/90"></div>
                  
                  {/* Available indicator with green dot - replacing New Listing badge */}
                  <div className="absolute top-4 left-4 z-30">
                    <div className="bg-black/70 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full border border-white/20 flex items-center">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2"></span>
                      <span>Available</span>
                    </div>
                  </div>
                  
                  {/* Heart icon - replacing search icon */}
                  <div className="absolute top-4 right-4 p-2 bg-black/60 backdrop-blur-sm rounded-full z-30">
                    <FiHeart className="h-4 w-4 text-amber-400" />
                  </div>
                  
                  {/* Small decorative elements at corners - consistent with landlord dashboard */}
                  <div className="absolute top-4 right-16 w-2 h-2 rounded-full bg-white/40"></div>
                  <div className="absolute top-4 right-20 w-1 h-1 rounded-full bg-white/30"></div>
                  <div className="absolute bottom-20 left-4 w-2 h-2 rounded-full bg-white/40"></div>
                  <div className="absolute bottom-16 left-8 w-1 h-1 rounded-full bg-white/30"></div>
                  
                  {/* Property info */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 z-30">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-white">Modern Lakeside Apartment</h3>
                        <div className="flex items-center gap-1 text-white/70 text-sm mt-1">
                          <FiMapPin className="w-3 h-3" />
                          <span>Flic en Flac, Mauritius</span>
                        </div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1">
                        <span className="text-white font-bold">Rs 28,000</span>
                        <span className="text-white/70 text-xs">/month</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Property features - maintaining the same layout as landlord dashboard */}
                <div className="bg-white/5 backdrop-blur-md p-4 flex justify-between">
                  <div className="text-center">
                    <span className="text-white/70 text-xs">Bedrooms</span>
                    <p className="text-white font-medium">2</p>
                  </div>
                  <div className="text-center">
                    <span className="text-white/70 text-xs">Bathrooms</span>
                    <p className="text-white font-medium">1</p>
                  </div>
                  <div className="text-center">
                    <span className="text-white/70 text-xs">Area</span>
                    <p className="text-white font-medium">95m²</p>
                  </div>
                  <div className="text-center">
                    <span className="text-white/70 text-xs">Type</span>
                    <p className="text-white font-medium">Apartment</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default HeroSection;