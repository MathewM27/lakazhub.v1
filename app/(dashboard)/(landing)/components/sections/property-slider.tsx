'use client'; // Keep client directive as we need interactivity for the slider

import { useState, useEffect, useCallback, memo } from 'react';
import { Home, ImageOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { properties } from '@/utils/types/properties';
import { PropertyCard } from '../ui/property-card';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';

// Memoized PropertyCard for performance
const MemoPropertyCard = memo(PropertyCard);

// Create a component for handling image errors with proper TypeScript types
interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  [key: string]: unknown; // For any other props that might be passed
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({ src, alt, className, ...rest }) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;

  const handleError = () => {
    if (retryCount < maxRetries) {
      // Retry loading the image a limited number of times
      setRetryCount(prev => prev + 1);
      setError(false);
      // Add a small delay before retry
      setTimeout(() => {
        const timestamp = new Date().getTime();
        // Append timestamp to bypass cache
        const imgElement = document.createElement('img');
        imgElement.src = `${src}?retry=${timestamp}`;
      }, 500);
    } else {
      // After max retries, show fallback
      setError(true);
      setLoading(false);
    }
  };

  if (error) {
    // Render fallback UI instead of the image
    return (
      <div 
        className={`flex items-center justify-center bg-gray-900 ${className || ''}`}
        {...rest}
      >
        <div className="flex flex-col items-center text-white/60">
          <ImageOff className="w-8 h-8 mb-2" />
          <span className="text-xs">Image unavailable</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {loading && (
        <div className={`absolute inset-0 bg-gray-900 animate-pulse ${className || ''}`} />
      )}
      <Image
        src={src}
        alt={alt}
        className={className}
        onError={handleError}
        onLoad={() => setLoading(false)}
        width={800}
        height={600}
        {...rest}
      />
    </>
  );
};

export const PropertySlider = () => {
  const [activeFilters, setActiveFilters] = useState('all');
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'start' });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filter properties based on active filter
  const filteredProperties = activeFilters === 'all'
    ? properties
    : properties.filter((p) => p.type === activeFilters);

  // Update scroll buttons state and current index
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
    setCurrentIndex(emblaApi.selectedScrollSnap() || 0);
  }, [emblaApi]);

  // Initialize and cleanup
  useEffect(() => {
    if (!emblaApi) return;

    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);

    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  // Handle property card click - scroll to signup section
  const handlePropertyClick = useCallback(() => {
    const signupSection = document.getElementById('signup');
    if (!signupSection) return;
    
    const offsetTop = signupSection.offsetTop;
    
    // On mobile, we need to account for the height of the navbar
    const offset = typeof window !== 'undefined' && window.innerWidth < 768 ? -70 : 0;
    
    window.scrollTo({
      top: offsetTop + offset,
      behavior: 'smooth'
    });
  }, []);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  // Only render a window of slides around the current index for performance
  const visibleWindow = 2;
  const visibleProperties = filteredProperties.filter((_, idx) =>
    Math.abs(idx - currentIndex) <= visibleWindow
  );

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
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                  <Home className="w-4 h-4 text-black" />
                </div>
                <span className="text-white/70 text-sm font-medium">Lakaz-Hub</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                Discover & List Properties
              </h2>
              
              <p className="text-base md:text-lg text-white/70">
                Explore a diverse selection of rental properties tailored to your needs.
              </p>
            </div>
            
            {/* Property filters */}
            <div className="flex items-center gap-3 mt-6 md:mt-0">
              {['all', 'apartment', 'house', 'villa'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilters(filter)}
                  className={`px-4 py-2 text-sm rounded-full transition-all duration-300 ${
                    activeFilters === filter
                      ? 'bg-white text-black font-medium'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-xl" ref={emblaRef}>
              <div className="flex">
                {filteredProperties.map((property, index) => {
                  // Only render slides within the visible window
                  if (Math.abs(index - currentIndex) > visibleWindow) {
                    return <div key={property.id} className="flex-none w-full sm:w-1/2 md:w-1/3 pl-0 pr-6" style={{ minHeight: 300 }} />;
                  }
                  return (
                    <div 
                      key={property.id}
                      className="flex-none w-full sm:w-1/2 md:w-1/3 pl-0 pr-6"
                    >
                      <div 
                        className="relative cursor-pointer hover:translate-y-[-5px] transition-transform duration-300 h-full"
                        onClick={handlePropertyClick}
                      >
                        <div className="h-full w-full max-w-[400px] mx-auto">
                          <MemoPropertyCard
                            id={property.id}
                            name={property.name}
                            location={property.location}
                            price={property.price ?? 0}
                            monthly_rent={property.monthly_rent}
                            bedrooms={property.bedrooms ?? 0}
                            bathrooms={property.bathrooms ?? 0}
                            area={property.area ?? 0}
                            type={property.type}
                            imageUrl={property.imageUrl}
                            isAvailable={property.isAvailable}
                            onClick={handlePropertyClick}
                            fallbackImage={ImageWithFallback}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <button 
              onClick={scrollPrev}
              className={`absolute -left-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white transition-all duration-300 border border-white/20 group ${!canScrollPrev ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white hover:text-black'}`}
              disabled={!canScrollPrev}
            >
              <ChevronLeft className="w-5 h-5 group-hover:scale-95 transition-transform" />
            </button>
            
            <button 
              onClick={scrollNext}
              className={`absolute -right-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white transition-all duration-300 border border-white/20 group ${!canScrollNext ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white hover:text-black'}`}
              disabled={!canScrollNext}
            >
              <ChevronRight className="w-5 h-5 group-hover:scale-95 transition-transform" />
            </button>
          </div>
          
          {/* Premium features coming soon banner */}
          <div
            className="mt-16 flex flex-col items-center justify-center p-6 md:p-8 rounded-2xl bg-black border border-white/10 backdrop-blur-sm relative overflow-hidden"
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

// For optimal performance, import this component using next/dynamic in the parent page:
// const PropertySlider = dynamic(() => import('.../property-slider'), { ssr: false });