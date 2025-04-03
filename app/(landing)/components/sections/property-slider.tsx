'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Home, MapPin, Star, DollarSign } from 'lucide-react';
import { properties } from '@/types/properties';
import { PropertyCard } from '../../../../components/ui/property-card';

export const PropertySlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);
  const [activeFilters, setActiveFilters] = useState('all');

  const canScrollLeft = currentIndex > 0;
  const canScrollRight = currentIndex + 3 < properties.length;

  const scrollLeft = () => {
    if (canScrollLeft) {
      setCurrentIndex(currentIndex - 1);
      setAutoplayEnabled(false);
    }
  };

  const scrollRight = () => {
    if (canScrollRight) {
      setCurrentIndex(currentIndex + 1);
      setAutoplayEnabled(false);
    }
  };

  // Auto-play functionality
  useEffect(() => {
    if (!autoplayEnabled || isHovering) return;

    const interval = setInterval(() => {
      if (currentIndex + 3 < properties.length) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setCurrentIndex(0);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentIndex, autoplayEnabled, isHovering]);

  // Handle mouse movement for the custom cursor
  interface CursorPosition {
    x: number;
    y: number;
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    setCursorPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  // Calculate current progress
  const progress = (currentIndex / (properties.length - 3)) * 100;
  
  return (
    <section 
      id="properties" 
      className="py-24 bg-black relative overflow-hidden"
    >
      {/* Background pattern */}
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
        <motion.div 
          className="max-w-6xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16">
            <div className="max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="flex items-center gap-2 mb-4"
              >
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                  <Home className="w-4 h-4 text-black" />
                </div>
                <span className="text-white/70 text-sm font-medium">Lakaz-Hub</span>
              </motion.div>
              
              <motion.h2 
                className="text-3xl md:text-4xl font-bold mb-4 text-white"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
              >
                Discover & List Properties
              </motion.h2>
              
              <motion.p 
                className="text-base md:text-lg text-white/70"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
              >
                Explore a diverse selection of rental properties tailored to your needs.
              </motion.p>
            </div>
            
            {/* Property filters */}
            <motion.div 
              className="flex items-center gap-3 mt-6 md:mt-0"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {['all', 'apartment', 'house', 'villa'].map((filter) => (
                <motion.button
                  key={filter}
                  variants={itemVariants}
                  onClick={() => setActiveFilters(filter)}
                  className={`px-4 py-2 text-sm rounded-full transition-all duration-300 ${
                    activeFilters === filter
                      ? 'bg-white text-black font-medium'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </motion.button>
              ))}
            </motion.div>
          </div>

          <div 
            className="relative" 
            ref={sliderRef}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onMouseMove={handleMouseMove}
          >
            {/* Custom interaction cursor */}
            <AnimatePresence>
              {isHovering && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="hidden md:flex absolute w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm items-center justify-center pointer-events-none z-20"
                  style={{
                    left: cursorPosition.x - 32,
                    top: cursorPosition.y - 32,
                  }}
                >
                  <span className="text-white text-xs font-medium">Explore</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="overflow-hidden rounded-xl">
              <motion.div
                className="flex gap-6"
                animate={{ x: -currentIndex * (100 / 3) + '%' }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {properties.map((property, index) => (
                  <motion.div 
                    key={property.id} 
                    className="flex-none w-full md:w-1/3"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true, margin: "-100px" }}
                    whileHover={{ y: -10 }}
                  >
                    <div className="relative group">
                      <PropertyCard
                        property={property}
                        onClick={() => {
                          // Handle property click
                        }}
                      />
                      
                      {/* Hover overlay */}
                      <motion.div 
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-between p-6 pointer-events-none"
                      >
                        <div>
                          <p className="text-white text-sm font-medium mb-1 flex items-center">
                            <MapPin className="w-3 h-3 mr-1" /> {property.location}
                          </p>
                          <p className="text-white/70 text-xs">Sign up to view details</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-white/10 backdrop-blur-sm px-2 py-1 rounded-full">
                            <Star className="w-3 h-3 text-white mr-1" fill="white" />
                            <span className="text-white text-xs">4.9</span>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Interactive progress bar */}
            <div className="mt-8 flex items-center gap-6">
              <div className="flex-1 h-0.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-white"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                ></motion.div>
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            viewport={{ once: true }}
            className="mt-16 flex flex-col items-center justify-center p-6 md:p-8 rounded-2xl bg-black border border-white/10 backdrop-blur-sm relative overflow-hidden"
          >
            {/* Subtle animated background */}
            <div className="absolute inset-0 overflow-hidden">
              <motion.div 
                animate={{ 
                  x: ["0%", "100%"], 
                }}
                transition={{ 
                  duration: 15, 
                  ease: "linear", 
                  repeat: Infinity,
                }}
                className="absolute top-0 left-[-100%] right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
              />
              <motion.div 
                animate={{ 
                  x: ["100%", "0%"], 
                }}
                transition={{ 
                  duration: 20, 
                  ease: "linear", 
                  repeat: Infinity,
                }}
                className="absolute bottom-0 left-0 right-[-100%] h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
              />
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
                We're working to enhance your experience with premium subscription services. 
                Soon you'll enjoy exclusive listings, virtual tours, and priority access to new properties.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};