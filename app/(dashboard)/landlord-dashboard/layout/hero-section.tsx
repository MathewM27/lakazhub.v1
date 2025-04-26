'use client'

import { useState, useEffect } from "react";
import Link from "next/link";
import { FiArrowRight, FiCheck, FiHeart, FiMapPin } from "react-icons/fi";
import Image from "next/image";

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
    <section className="relative flex items-center justify-center min-h-[80vh] lg:min-h-[85vh] xl:min-h-[80vh] py-16 md:py-24 bg-black text-white overflow-hidden">
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
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 relative z-10 py-0" style={{ minHeight: "600px" }}>
        {isLoading ? (
          <div className="text-center max-w-4xl mx-auto">
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
          <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6 lg:gap-12 w-full">
            <div
              className={`flex flex-col justify-between h-full gap-y-8 py-4 transition-all duration-700 delay-300 ease-out ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <div className="space-y-4 md:space-y-6 mt-4">
                <h1 className="font-bold text-white leading-tight tracking-tight text-fluid-h1">
                  <span className="block">
                    Manage Your <span className="text-amber-400">Properties</span>
                  </span>
                </h1>
                <p className="text-base sm:text-lg text-white/80 max-w-xl leading-relaxed">
                  List, manage, and connect with qualified tenants in one seamless platform.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-start gap-4 sm:gap-8 mt-2 mb-8 max-w-xl mx-auto md:mx-0">
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
                className={`flex justify-center md:justify-start pt-2 transition-all duration-500 delay-700 ease-out ${
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
            <div 
              className={`relative rounded-2xl overflow-hidden border border-white/10 shadow-lg transition-all duration-700 delay-500 ease-out w-full max-w-md mx-auto md:mx-0 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <div className="aspect-[4/3] relative w-full min-h-[260px] sm:min-h-[320px]">
                <Image 
                  src="https://qqqes0fuio.ufs.sh/f/7I9AgfULkX7r2wDOOlgxMUVO4urzl6ogWXn2Iw7tGeQHA1dF" 
                  alt="Featured Property"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 788px) 100vw, (min-width: 788px) 50vw"
                  placeholder="blur"
                  blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDMyMCAyNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMyMCIgaGVpZ2h0PSIyNDAiIGZpbGw9IiNlZWUiLz48L3N2Zz4="
                />
                <div className="absolute inset-0 z-20 bg-gradient-to-b from-transparent via-transparent to-black/90"></div>
                <div className="absolute top-4 left-4 z-30">
                  <div className="bg-black/70 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full border border-white/20 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2"></span>
                    <span>Available</span>
                  </div>
                </div>
                <div className="absolute top-4 right-4 p-2 bg-black/60 backdrop-blur-sm rounded-full z-30">
                  <FiHeart className="h-4 w-4 text-amber-400" />
                </div>
                <div className="absolute top-4 right-16 w-2 h-2 rounded-full bg-white/40"></div>
                <div className="absolute top-4 right-20 w-1 h-1 rounded-full bg-white/30"></div>
                <div className="absolute bottom-20 left-4 w-2 h-2 rounded-full bg-white/40"></div>
                <div className="absolute bottom-16 left-8 w-1 h-1 rounded-full bg-white/30"></div>
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
        )}
      </div>
    </section>
  );
};

export default HeroSection;