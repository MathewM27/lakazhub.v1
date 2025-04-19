import Link from 'next/link';
import Image from 'next/image';
import { FiCheck, FiArrowRight, FiMessageCircle, FiFilter, FiHome, FiLink } from 'react-icons/fi';

export const HeroSection = () => {
  return (
    <section id="hero" className="relative min-h-[90svh] py-8 sm:py-12 bg-black text-white overflow-hidden">
      {/* Simple gradient overlay instead of canvas background */}
      

      <div className="container mx-auto px-4 sm:px-4 lg:px-4 relative z-10 mt-12">
        {/* Convert from flex to grid for better performance */}
        <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6">
          {/* Left content column */}
          <div className="space-y-4 md:space-y-6">
            <div>
              <span className="inline-block text-sm font-medium bg-white/10 text-white/90 py-1 px-3 rounded-full border border-white/20 opacity-0 animate-fade-in">
                Introducing LakazHub
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-6xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
              <span className="block opacity-0 animate-slide-up delay-100">
                Where Homes &
              </span>
              <span className="block relative opacity-0 animate-slide-up delay-200">
                <span className="relative z-10">People Connect</span>
              </span>
            </h1>

            <p className="text-base sm:text-lg text-white/80 max-w-xl leading-relaxed opacity-0 animate-slide-up delay-300">
              Redefining the renting experience by seamlessly connecting landlords and tenants.
            </p>

            {/* Mobile image - Only shown on mobile devices */}
            <div className="block md:hidden w-full py-4 opacity-0 animate-fade-in delay-300">
              <div className="relative mx-auto max-w-md">
                <div className="aspect-square w-full relative">
                  <div className="absolute inset-0 w-full h-full rounded-3xl bg-black border border-white/10 shadow-2xl overflow-hidden">
                    {/* Progressive image loading with priority for hero image */}
                    <Image
                      src="/hero.webp"
                      alt="Home background"
                      fill
                      priority
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-contain transform scale-105 hover:scale-110 transition-transform duration-700"
                      quality={85}
                    />

                    {/* Status badge - positioned at top-right - changed to pure black */}
                    <div className="absolute top-4 right-4 bg-black px-3 py-1 rounded-full flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      <span className="text-xs text-white font-medium">Realtime Availability</span>
                    </div>

                    {/* Messaging badge - positioned at top-left - changed to pure black */}
                    <div className="absolute top-4 left-4 bg-black px-3 py-1 rounded-full flex items-center space-x-1.5">
                      <FiMessageCircle className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-xs text-white font-medium">In-built Messaging</span>
                    </div>

                    {/* Updated property features - smaller height and justify-between */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black to-transparent py-2 px-4">
                      <h3 className="text-white font-semibold mb-1 text-sm">Seamless Connection</h3>
                      <div className="flex items-center justify-between text-white/70 text-xs w-full">
                        <div className="flex items-center">
                          <FiFilter className="w-3.5 h-3.5 mr-1" />
                          <span>Custom Filters</span>
                        </div>
                        <div className="flex items-center">
                          <FiHome className="w-3.5 h-3.5 mr-1" />
                          <span>Manage Properties</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Using grid for button layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 opacity-0 animate-fade-in delay-400">
              <Link
                href="#signup"
                className="group min-h-[50px] flex items-center justify-center px-8 py-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-all duration-300 text-base font-medium focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                Join Today
                <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
              
              <Link
                href="#properties"
                className="min-h-[50px] flex items-center justify-center px-8 py-3 bg-transparent text-white border border-white/30 rounded-lg hover:bg-white/10 transition-all duration-300 text-base font-medium focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                Explore Properties
              </Link>
            </div>

            {/* Feature highlights */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-center gap-3 opacity-0 animate-slide-up delay-500">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <FiCheck className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm text-white/80">Smart Property Management</p>
              </div>

              <div className="flex items-center gap-3 opacity-0 animate-slide-up delay-600">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <FiCheck className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm text-white/80">Smart Property Search</p>
              </div>
            </div>
          </div>

          {/* Right image/visual column - Only shown on tablet/desktop */}
          <div className="hidden md:block opacity-0 animate-fade-in delay-300">
            <div className="relative mx-auto">
              <div className="aspect-square w-full max-w-lg ml-auto relative">
                <div className="absolute inset-0 w-full h-full rounded-3xl bg-black border border-white/10 shadow-2xl overflow-hidden">
                  {/* Progressive image loading for desktop */}
                  <Image
                    src="/bg5.webp"
                    alt="Home interior"
                    fill
                    priority
                    sizes="(max-width: 1280px) 50vw, 40vw"
                    className="object-contain transform scale-105 hover:scale-110 transition-transform duration-700"
                    quality={85}
                  />
                  
                  {/* Status badge - positioned at top-right - changed to pure black */}
                  <div className="absolute top-6 right-6 bg-black px-4 py-1.5 rounded-full flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-sm text-white font-medium">Available Online</span>
                  </div>

                  {/* Messaging badge - positioned at top-left - changed to pure black */}
                  <div className="absolute top-6 left-6 bg-black px-4 py-1.5 rounded-full flex items-center space-x-2">
                    <FiMessageCircle className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-white font-medium">In-built Messaging</span>
                  </div>

                  {/* Updated property features - smaller height and justify-between */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black to-transparent py-3 px-6">
                    <h3 className="text-white font-semibold mb-1 text-lg">Seamless Connection</h3>
                    <div className="flex items-center justify-between text-white/80 text-sm w-full">
                      <div className="flex items-center">
                        <FiFilter className="w-4 h-4 mr-1.5" />
                        <span>Custom Filters</span>
                      </div>
                      <div className="flex items-center">
                        <FiHome className="w-4 h-4 mr-1.5" />
                        <span>Manage Properties</span>
                      </div>
                    </div>
                  </div>

                  {/* Connection indicator - positioned at top-right but shifted - changed to pure black */}
                  <div className="absolute top-20 right-6 p-2 bg-black rounded-full">
                    <FiLink className="h-5 w-5 text-blue-400 hover:text-blue-300 transition-colors cursor-pointer" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        /* Simpler keyframes that avoid layout shifts */
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        
        @keyframes slideUp {
          0% { opacity: 0; transform: translateY(15px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        /* Animation classes */
        .animate-fade-in {
          animation: fadeIn 0.7s ease-out forwards;
        }
        
        .animate-slide-up {
          animation: slideUp 0.5s ease-out forwards;
        }
        
        /* Animation delays */
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
        .delay-600 { animation-delay: 0.6s; }
      `}</style>
    </section>
  );
};