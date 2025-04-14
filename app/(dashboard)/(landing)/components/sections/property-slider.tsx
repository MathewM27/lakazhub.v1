'use client'; // Keep client directive as we need interactivity for the slider

import { useState, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Home, MapPin, Star } from 'lucide-react';
import { properties } from '@/utils/types/properties';
import { PropertyCard } from '../../ui/property-card';

export const PropertySlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeFilters, setActiveFilters] = useState('all');
  const sliderRef = useRef<HTMLDivElement | null>(null);
  
  // Simplify logic - remove unnecessary state
  const canScrollLeft = currentIndex > 0;
  const canScrollRight = currentIndex + 3 < properties.length;

  const scrollLeft = () => {
    if (canScrollLeft) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const scrollRight = () => {
    if (canScrollRight) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Calculate current progress
  const progress = (currentIndex / (properties.length - 3)) * 100;
  
  // Handle property card click - scroll to signup section
  const handlePropertyClick = useCallback(() => {
    const signupSection = document.getElementById('signup');
    if (!signupSection) return;
    
    const offsetTop = signupSection.offsetTop;
    
    // On mobile, we need to account for the height of the navbar
    const offset = window.innerWidth < 768 ? -70 : 0;
    
    window.scrollTo({
      top: offsetTop + offset,
      behavior: 'smooth'
    });
  }, []);
  
  return (
    <section 
      id="properties" 
      className="py-24 bg-black relative overflow-hidden"
    >
      {/* Simplified static background pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white to-transparent"></div>
        {[...Array(10)].map((_, i) => (
          <div 
            key={i} 
            className="absolute w-px h-full bg-white/5" 
            style={{ left: `${i * 10}%` }}
          ></div>
        ))}
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto opacity-0 animate-fade-in">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-4 opacity-0 animate-fade-in delay-100">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                  <Home className="w-4 h-4 text-black" />
                </div>
                <span className="text-white/70 text-sm font-medium">Lakaz-Hub</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white opacity-0 animate-fade-in delay-200">
                Discover & List Properties
              </h2>
              
              <p className="text-base md:text-lg text-white/70 opacity-0 animate-fade-in delay-300">
                Explore a diverse selection of rental properties tailored to your needs.
              </p>
            </div>
            
            {/* Property filters */}
            <div className="flex items-center gap-3 mt-6 md:mt-0">
              {['all', 'apartment', 'house', 'villa'].map((filter, index) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilters(filter)}
                  className={`opacity-0 animate-fade-in px-4 py-2 text-sm rounded-full transition-all duration-300 ${
                    activeFilters === filter
                      ? 'bg-white text-black font-medium'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                  style={{animationDelay: `${300 + (index * 100)}ms`}}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div 
            className="relative" 
            ref={sliderRef}
          >
            <div className="overflow-hidden rounded-xl">
              {/* Use CSS transition instead of Framer Motion */}
              <div
                className="flex gap-6 transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentIndex * (100 / 3)}%)` }}
              >
                {properties.map((property, index) => (
                  <div 
                    key={property.id} 
                    className="flex-none w-full md:w-1/3 opacity-0 animate-slide-up transition-transform duration-300"
                    style={{animationDelay: `${400 + (index * 50)}ms`}}
                  >
                    <div 
                      className="relative cursor-pointer hover:translate-y-[-5px] transition-transform duration-300"
                      onClick={handlePropertyClick}
                    >
                      <PropertyCard
                        property={property}
                        onClick={handlePropertyClick}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive progress bar */}
            <div className="mt-8 flex items-center gap-6">
              <div className="flex-1 h-0.5 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              
              <div className="text-white/70 text-sm">{currentIndex + 1} / {properties.length - 2}</div>
            </div>

            {/* Navigation Buttons */}
            <button
              onClick={scrollLeft}
              className={`absolute -left-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white transition-all duration-300 border border-white/20 group ${
                !canScrollLeft ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white hover:text-black'
              }`}
              disabled={!canScrollLeft}
            >
              <ChevronLeft className="w-5 h-5 group-hover:scale-95 transition-transform" />
            </button>

            <button
              onClick={scrollRight}
              className={`absolute -right-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white transition-all duration-300 border border-white/20 group ${
                !canScrollRight ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white hover:text-black'
              }`}
              disabled={!canScrollRight}
            >
              <ChevronRight className="w-5 h-5 group-hover:scale-95 transition-transform" />
            </button>
          </div>
          
          {/* Premium features coming soon banner */}
          <div
            className="mt-16 flex flex-col items-center justify-center p-6 md:p-8 rounded-2xl bg-black border border-white/10 backdrop-blur-sm relative overflow-hidden opacity-0 animate-fade-in"
            style={{animationDelay: '800ms'}}
          >
            {/* Simplified static background instead of animated */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
            </div>

            {/* Premium banner content - centered */}
            <div className="relative z-10 text-center max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Home className="w-5 h-5 text-white" />
                <div className="bg-white/20 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                  Coming Soon
                </div>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
                Premium Features in Development
              </h3>
              <p className="text-white/70 text-sm md:text-base">
                We&apos;re working to enhance your experience with premium subscription services. 
                Soon you&apos;ll enjoy exclusive listings, virtual tours, and priority access to new properties.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add the animation styles */}
      <style jsx global>{`
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }

        @keyframes slideUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fadeIn 0.7s ease-out forwards;
        }

        .animate-slide-up {
          animation: slideUp 0.7s ease-out forwards;
        }

        /* Animation delays */
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
        .delay-600 { animation-delay: 0.6s; }
        .delay-700 { animation-delay: 0.7s; }
        .delay-800 { animation-delay: 0.8s; }
      `}</style>
    </section>
  );
};