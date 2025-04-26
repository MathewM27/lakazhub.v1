'use client'

import { useState, useEffect } from "react";
import Link from "next/link";
import { FiArrowRight, FiCheck } from "react-icons/fi";

const HeroSection = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const loadTimer = setTimeout(() => {
      setIsLoading(false);
      const visibilityTimer = setTimeout(() => {
        setIsVisible(true);
      }, 100);
      return () => clearTimeout(visibilityTimer);
    }, 500);
    return () => clearTimeout(loadTimer);
  }, []);

  const quickFeatures = [
    { text: 'Manage multiple properties', icon: FiCheck },
    { text: 'Control your listings', icon: FiCheck }
  ];

  return (
    <section className="relative flex items-center justify-center min-h-[40vh] py-12 bg-black text-white overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black/95 via-black to-black/90 pointer-events-none"></div>
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
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 relative z-10 py-0">
        {isLoading ? (
          <div className="text-center max-w-4xl mx-auto">
            <div className="h-8 bg-white/20 w-1/2 mx-auto mb-4 rounded animate-pulse"></div>
            <div className="h-4 bg-white/10 w-3/4 mx-auto mb-6 rounded animate-pulse"></div>
            <div className="w-full h-16 bg-white/5 border border-white/10 rounded-xl animate-pulse mb-10" />
            <div className="space-y-4">
              <div className="h-6 bg-white/10 rounded-lg w-3/4 mx-auto animate-pulse" />
              <div className="h-6 bg-white/10 rounded-lg w-1/2 mx-auto animate-pulse" />
              <div className="h-12 bg-white/10 rounded-lg w-full mx-auto animate-pulse mt-6" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <div
              className={`flex flex-col items-center justify-center gap-y-8 py-4 max-w-xl transition-all duration-700 delay-300 ease-out ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <div className="space-y-4 md:space-y-6 mt-4 text-center">
                <h1 className="font-bold text-white leading-tight tracking-tight text-fluid-h1">
                  <span className="block">
                    Manage Your <span className="text-amber-400">Properties</span>
                  </span>
                </h1>
                <p className="text-base sm:text-lg text-white/80 max-w-xl leading-relaxed">
                  List, manage, and connect with qualified tenants in one seamless platform.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-center gap-4 sm:gap-8 mt-2 mb-8">
                {quickFeatures.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-2 shadow-sm transition-all duration-500 ease-out"
                    style={{
                      transitionDelay: `${400 + (index * 100)}ms`,
                      opacity: isVisible ? 1 : 0,
                      transform: isVisible ? 'translateX(0)' : 'translateX(-10px)'
                    }}
                  >
                    <div className="w-8 h-8 rounded-full bg-amber-400/20 flex items-center justify-center">
                      <feature.icon className="w-4 h-4 text-amber-400" />
                    </div>
                    <span className="text-white/90 text-base font-medium">{feature.text}</span>
                  </div>
                ))}
              </div>
              <div
                className={`flex justify-center pt-2 transition-all duration-500 delay-700 ease-out ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
              >
                <Link
                  href="/add-property"
                  className="group min-h-[50px] flex items-center justify-center px-8 py-3 bg-amber-400 hover:bg-amber-500 text-black rounded-lg shadow-lg font-semibold text-base transition-all focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  <span>Add Property</span>
                  <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default HeroSection;