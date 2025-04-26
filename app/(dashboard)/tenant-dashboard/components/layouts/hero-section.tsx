'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { FiArrowRight, FiCheck, FiSearch, FiHome, FiFilter, FiMessageSquare, FiKey } from "react-icons/fi";

const HeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const quickFeatures = [
    { text: 'Find', icon: FiHome },
    { text: 'Message', icon: FiMessageSquare },
    { text: 'Rent', icon: FiKey }
  ];

  return (
    <section 
      className="relative flex items-center min-h-[80vh] lg:min-h-[85vh] xl:min-h-[80vh] py-16 md:py-24 bg-black text-white overflow-hidden"
      id="tenant-hero"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 grid grid-cols-12 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-full w-px bg-white/20 transform translate-x-[50%]"></div>
          ))}
        </div>
        <div className="absolute inset-0 grid grid-rows-12 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="w-full h-px bg-white/20 transform translate-y-[50%]"></div>
          ))}
        </div>
      </div>

      {/* Content wrapper - Using same structure as landlord dashboard */}
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 relative z-10 w-full py-0">
        {/* Using same grid layout as landlord dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6 lg:gap-12">
          
          {/* Left: Text Content - No changes needed here */}
          <div className={`flex flex-col justify-between h-full gap-y-8 py-4 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="space-y-4 md:space-y-4 mt-4">
              <div className="inline-block bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <span className="text-sm font-medium text-white">Tenant Dashboard</span>
              </div>
              
              {/* Heading structure matches landlord dashboard */}
              <h1 className="font-bold text-white leading-tight tracking-tight text-4xl md:text-5xl lg:text-6xl">
                <span className="block">
                  Find Your
                </span>
                <span className="block">
                  <span className="text-blue-400">Dream Home</span>
                </span>
              </h1>
              
              <p className="text-base sm:text-lg text-white/80 max-w-xl leading-relaxed">
                Search properties, connect with landlords, and discover your next perfect rental — all in one place.
              </p>
            </div>

            {/* Button area - Positioned with consistent spacing */}
            <div className="grid grid-cols-1 gap-4 pt-4 mt-auto">
              <Link
                href="/properties"
                className="group min-h-[50px] flex items-center justify-center px-8 py-3 bg-white hover:bg-blue-400 text-black rounded-lg shadow-lg font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
              >
                <span>Browse Properties</span>
                <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </div>

            {/* Quick Features - Using same structure as landlord dashboard */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {quickFeatures.map((feature, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 transition-all duration-700 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
                  style={{ transitionDelay: `${index * 150}ms` }}
                >
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm text-white/80">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Geometric Design - Improved positioning and sizing */}
          <div className={`hidden md:flex md:items-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="w-full max-w-md lg:max-w-lg xl:max-w-xl mx-auto md:ml-auto">
              {/* Containing box with better positioning */}
              <div className="relative aspect-square w-full flex items-center justify-center">
                {/* 3D-like grid effect - Adjusted positioning and sizing */}
                <div className="absolute w-64 h-64 border border-white/20 rotate-45 transform-gpu"></div>
                <div className="absolute w-80 h-80 border border-white/15 rotate-45 transform-gpu"></div>
                <div className="absolute w-96 h-96 border border-white/10 rotate-45 transform-gpu"></div>
                
                {/* Center piece - static, blue accent, no animation */}
                <div className="relative z-10 w-40 h-40">
                  <div className="absolute inset-0 bg-gradient-to-tr from-white via-white to-blue-400 rounded-lg transform rotate-45 shadow-2xl">
                    <div className="absolute inset-2 bg-black rounded-md flex items-center justify-center">
                      <div className="text-white text-5xl font-bold transform -rotate-45">LH</div>
                    </div>
                  </div>
                </div>
                
                {/* Floating elements - keep subtle animation for background only */}
                <div className="absolute top-16 right-16 w-16 h-16 bg-white/5 rounded-lg rotate-12 animate-float-slow"></div>
                <div className="absolute bottom-16 left-16 w-10 h-10 bg-blue-400/20 rounded-full animate-float-slow animation-delay-1000"></div>
                <div className="absolute bottom-32 right-16 w-6 h-6 bg-white/10 rounded-sm rotate-45 animate-float-slow animation-delay-2000"></div>
                
                {/* Additional subtle elements to match screenshot */}
                <div className="absolute top-32 left-16 w-4 h-4 bg-blue-400/10 rounded-full animate-float-slow animation-delay-1500"></div>
                <div className="absolute top-24 right-32 w-3 h-3 bg-white/5 rounded-full animate-float-slow animation-delay-700"></div>
              </div>
            </div>
          </div>
          
          {/* Mobile view of the geometric design - Improved to match desktop version */}
          <div className="block md:hidden w-full py-4 mt-8">
            <div className="relative mx-auto max-w-md">
              {/* Containing box with better positioning */}
              <div className="relative aspect-square w-full flex items-center justify-center">
                {/* 3D-like grid effect - Scaled down for mobile */}
                <div className="absolute w-40 h-40 border border-white/20 rotate-45 transform-gpu"></div>
                <div className="absolute w-52 h-52 border border-white/15 rotate-45 transform-gpu"></div>
                <div className="absolute w-64 h-64 border border-white/10 rotate-45 transform-gpu"></div>
                
                {/* Center piece - static, blue accent, no animation */}
                <div className="relative z-10 w-32 h-32">
                  <div className="absolute inset-0 bg-gradient-to-tr from-white via-white to-blue-400 rounded-lg transform rotate-45 shadow-2xl">
                    <div className="absolute inset-2 bg-black rounded-md flex items-center justify-center">
                      <div className="text-white text-4xl font-bold transform -rotate-45">LH</div>
                    </div>
                  </div>
                </div>
                
                {/* Floating elements - Properly sized and positioned for mobile */}
                <div className="absolute top-12 right-12 w-10 h-10 bg-white/5 rounded-lg rotate-12 animate-float-slow"></div>
                <div className="absolute bottom-12 left-12 w-8 h-8 bg-blue-400/20 rounded-full animate-float-slow animation-delay-1000"></div>
                <div className="absolute bottom-24 right-12 w-5 h-5 bg-white/10 rounded-sm rotate-45 animate-float-slow animation-delay-2000"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes float-slow {
          0% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(10px, -10px) rotate(5deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        
        @keyframes pulse-slow {
          0% { transform: rotate(45deg) scale(1); }
          50% { transform: rotate(45deg) scale(1.05); }
          100% { transform: rotate(45deg) scale(1); }
        }
        
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
        
        .animation-delay-700 {
          animation-delay: 0.7s;
        }
        
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        
        .animation-delay-1500 {
          animation-delay: 1.5s;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        /* Fluid height adjustments for larger screens */
        @media (min-height: 1000px) {
          #tenant-hero {
            min-height: 75vh;
          }
        }
        
        @media (min-height: 1200px) {
          #tenant-hero {
            min-height: 70vh;
          }
        }
      `}</style>
    </section>
  );
};

export default HeroSection;
