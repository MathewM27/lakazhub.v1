'use client';

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { FiSearch, FiHome, FiCheck, FiArrowRight, FiMapPin, FiFilter } from "react-icons/fi";
import { HiOutlineAdjustments, HiOutlineOfficeBuilding, HiOutlineHome } from "react-icons/hi";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

// Define interface for Particle class
interface ParticleProps {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  update: () => void;
  draw: (ctx: CanvasRenderingContext2D) => void;
}

const TenantHeroSection = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchFocused, setSearchFocused] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Animation for the line pattern background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width = window.innerWidth;
    const height = canvas.height = window.innerHeight;
    
    let particlesArray: ParticleProps[] = [];
    
    class Particle implements ParticleProps {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;
      }
      
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        
        if (this.x < 0 || this.x > width) this.speedX *= -1;
        if (this.y < 0 || this.y > height) this.speedY *= -1;
      }
      
      draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
      }
    }
    
    function init() {
      particlesArray = [];
      const particleCount = Math.floor((width * height) / 20000);
      for (let i = 0; i < particleCount; i++) {
        particlesArray.push(new Particle());
      }
    }
    
    function animate() {
      if (!ctx) return;
      
      ctx.clearRect(0, 0, width, height);
      particlesArray.forEach(particle => {
        particle.update();
        particle.draw(ctx);
      });
      
      // Draw connections
      connectParticles();
      
      requestAnimationFrame(animate);
    }
    
    function connectParticles() {
      if (!ctx) return;
      
      const maxDistance = 150;
      for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
          const dx = particlesArray[a].x - particlesArray[b].x;
          const dy = particlesArray[a].y - particlesArray[b].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < maxDistance) {
            const opacity = 1 - (distance / maxDistance);
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.1})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
            ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
            ctx.stroke();
          }
        }
      }
    }
    
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init();
    };
    
    window.addEventListener('resize', handleResize);
    
    init();
    animate();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Handle initial loading state
  useEffect(() => {
    const loadTimer = setTimeout(() => {
      setIsLoading(false);
    }, 600);
    
    return () => clearTimeout(loadTimer);
  }, []);

  const quickFeatures = [
    { text: 'Direct contact with Landlord', icon: FiCheck },
    { text: 'Chat and inquire', icon: FiCheck },
    { text: 'Custom filtering', icon: FiCheck }
  ];

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center bg-black overflow-hidden text-white pt-4">
      {/* Animated background canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-30"
      />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-black pointer-events-none"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <AnimatePresence>
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center max-w-4xl mx-auto"
            >
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
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-full mx-auto"
            >
              {/* Main content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-center">
                {/* Left column */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="space-y-6 pt-12 lg:pt-0 order-1 lg:order-1"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-block"
                  >
                    <motion.span 
                      className="text-sm font-medium bg-white/10 backdrop-blur-sm text-white/90 py-1 px-3 rounded-full border border-white/20"
                    >
                      Find Your Dream Rental
                    </motion.span>
                  </motion.div>

                  <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight leading-tight"
                  >
                    <span className="block">Find Your</span>
                    <span className="block">Perfect Home</span>
                  </motion.h1>
                  
                  {/* Mobile-specific ordering - this div will only be visible on mobile */}
                  <div className="block lg:hidden">
                    {/* Right column - Featured property card (Mobile version) */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                      className="mt-6 mb-8"
                    >
                      <div className="relative mx-auto max-w-md">
                        {/* Featured property card */}
                        <motion.div 
                          initial={{ scale: 0.95, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.8, delay: 0.5 }}
                          className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
                        >
                          <div className="aspect-[4/3] relative w-full">
                            <div className="absolute inset-0 z-10">
                              <Image 
                                src="/bg1.jpg" 
                                alt="Featured Property"
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="absolute inset-0 z-20 bg-gradient-to-b from-transparent via-transparent to-black/90"></div>
                            
                            {/* Property tag */}
                            <motion.div 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.5, delay: 0.8 }}
                              className="absolute top-4 left-4 z-30"
                            >
                              <div className="bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full border border-white/20">
                                Featured Property
                              </div>
                            </motion.div>
                            
                            {/* Property info */}
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.5, delay: 0.9 }}
                              className="absolute bottom-0 left-0 right-0 p-5 z-30"
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="text-lg font-bold text-white">Sunset Villa Retreat</h3>
                                  <div className="flex items-center gap-1 text-white/70 text-sm mt-1">
                                    <FiMapPin className="w-3 h-3" />
                                    <span>Grand Baie, Mauritius</span>
                                  </div>
                                </div>
                                <motion.div 
                                  animate={{ 
                                    y: [0, -3, 0],
                                  }}
                                  transition={{ 
                                    duration: 2, 
                                    repeat: Infinity,
                                    repeatType: "reverse" 
                                  }}
                                  className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1"
                                >
                                  <span className="text-white font-bold">Rs 45,000</span>
                                  <span className="text-white/70 text-xs">/month</span>
                                </motion.div>
                              </div>
                            </motion.div>
                          </div>
                          
                          {/* Property features */}
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8, delay: 1 }}
                            className="bg-white/5 backdrop-blur-md p-4 flex justify-between"
                          >
                            <div className="text-center">
                              <span className="text-white/70 text-xs">Bedrooms</span>
                              <p className="text-white font-medium">3</p>
                            </div>
                            <div className="text-center">
                              <span className="text-white/70 text-xs">Bathrooms</span>
                              <p className="text-white font-medium">2</p>
                            </div>
                            <div className="text-center">
                              <span className="text-white/70 text-xs">Area</span>
                              <p className="text-white font-medium">180m²</p>
                            </div>
                            <div className="text-center">
                              <span className="text-white/70 text-xs">Type</span>
                              <p className="text-white font-medium">Villa</p>
                            </div>
                          </motion.div>
                        </motion.div>

                        {/* Floating elements */}
                        <motion.div
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.8, delay: 1.2 }}
                          className="absolute -top-4 -right-4 w-36 h-12 bg-black border border-white/20 rounded-lg shadow-lg flex items-center justify-center"
                        >
                          <div className="text-white text-center">
                            <p className="text-xs">Newly Listed</p>
                          </div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.8, delay: 1.3 }}
                          className="absolute -bottom-4 -left-4 w-36 h-12 bg-black border border-white/20 rounded-lg shadow-lg flex items-center justify-center"
                        >
                          <div className="text-white text-center">
                            <p className="text-xs">Top Rated</p>
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                    
                    {/* Mobile paragraph */}
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                      className="text-base sm:text-lg text-white/80 max-w-xl leading-relaxed"
                    >
                      Browse exclusive verified listings and find your ideal space with ease.
                      Our platform connects you with the best rental properties in your area.
                    </motion.p>
                    
                    {/* Mobile quick features */}
                    <motion.div
                      variants={{
                        hidden: { opacity: 0 },
                        show: {
                          opacity: 1,
                          transition: {
                            staggerChildren: 0.2,
                            delayChildren: 0.6
                          }
                        }
                      }}
                      initial="hidden"
                      animate="show"
                      className="flex flex-wrap gap-6 mt-6"
                    >
                      {quickFeatures.map((feature, index) => (
                        <motion.div
                          key={index}
                          variants={{
                            hidden: { opacity: 0, x: -10 },
                            show: { opacity: 1, x: 0 }
                          }}
                          className="flex items-center gap-3"
                        >
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                            <feature.icon className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-white/80">{feature.text}</span>
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>

                  {/* Desktop paragraph */}
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="text-base sm:text-lg text-white/80 max-w-xl leading-relaxed hidden lg:block"
                  >
                    Browse listings and find your ideal space with ease.
                    Our platform connects you with the property owners.
                  </motion.p>

                  {/* Desktop quick features */}
                  <motion.div
                    variants={{
                      hidden: { opacity: 0 },
                      show: {
                        opacity: 1,
                        transition: {
                          staggerChildren: 0.2,
                          delayChildren: 0.6
                        }
                      }
                    }}
                    initial="hidden"
                    animate="show"
                    className="hidden lg:flex flex-wrap gap-6 mt-4"
                  >
                    {quickFeatures.map((feature, index) => (
                      <motion.div
                        key={index}
                        variants={{
                          hidden: { opacity: 0, x: -10 },
                          show: { opacity: 1, x: 0 }
                        }}
                        className="flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                          <feature.icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-white/80">{feature.text}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                  
                  {/* CTA Button */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.8 }}
                    className="pt-4"
                  >
                    <Link 
                      href="/properties"
                      className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-lg hover:bg-white/90 transition-all font-medium group"
                    >
                      <span>Explore Properties</span>
                      <FiArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </motion.div>
                </motion.div>
                
                {/* Right column - Featured property card */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="lg:mt-0 mt-0 order-2 lg:order-2 hidden lg:block"
                >
                  <div className="relative mx-auto max-w-md lg:max-w-lg">
                    {/* Featured property card */}
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.8, delay: 0.5 }}
                      className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
                    >
                      <div className="aspect-[4/3] relative w-full">
                        <div className="absolute inset-0 z-10">
                          <Image 
                            src="/bg1.jpg" 
                            alt="Featured Property"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="absolute inset-0 z-20 bg-gradient-to-b from-transparent via-transparent to-black/90"></div>
                        
                        {/* Property tag */}
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.8 }}
                          className="absolute top-4 left-4 z-30"
                        >
                          <div className="bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full border border-white/20">
                            Featured Property
                          </div>
                        </motion.div>
                        
                        {/* Property info */}
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.9 }}
                          className="absolute bottom-0 left-0 right-0 p-5 z-30"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-bold text-white">Sunset Villa Retreat</h3>
                              <div className="flex items-center gap-1 text-white/70 text-sm mt-1">
                                <FiMapPin className="w-3 h-3" />
                                <span>Grand Baie, Mauritius</span>
                              </div>
                            </div>
                            <motion.div 
                              animate={{ 
                                y: [0, -3, 0],
                              }}
                              transition={{ 
                                duration: 2, 
                                repeat: Infinity,
                                repeatType: "reverse" 
                              }}
                              className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1"
                            >
                              <span className="text-white font-bold">Rs 45,000</span>
                              <span className="text-white/70 text-xs">/month</span>
                            </motion.div>
                          </div>
                        </motion.div>
                      </div>
                      
                      {/* Property features */}
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 1 }}
                        className="bg-white/5 backdrop-blur-md p-4 flex justify-between"
                      >
                        <div className="text-center">
                          <span className="text-white/70 text-xs">Bedrooms</span>
                          <p className="text-white font-medium">3</p>
                        </div>
                        <div className="text-center">
                          <span className="text-white/70 text-xs">Bathrooms</span>
                          <p className="text-white font-medium">2</p>
                        </div>
                        <div className="text-center">
                          <span className="text-white/70 text-xs">Area</span>
                          <p className="text-white font-medium">180m²</p>
                        </div>
                        <div className="text-center">
                          <span className="text-white/70 text-xs">Type</span>
                          <p className="text-white font-medium">Villa</p>
                        </div>
                      </motion.div>
                    </motion.div>

                    {/* Floating elements */}
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 1.2 }}
                      className="absolute -top-4 -right-4 w-36 h-12 bg-black border border-white/20 rounded-lg shadow-lg flex items-center justify-center"
                    >
                      <div className="text-white text-center">
                        <p className="text-xs">Newly Listed</p>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 1.3 }}
                      className="absolute -bottom-4 -left-4 w-36 h-12 bg-black border border-white/20 rounded-lg shadow-lg flex items-center justify-center"
                    >
                      <div className="flex items-center gap-2 text-white text-center">
                  {/* Glowing green dot */}
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                  <p className="text-xs">Available</p>
                </div>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <style jsx>{`
        @keyframes zoom {
          0% {
            transform: scale(1.25);
          }
          50% {
            transform: scale(1.3);
          }
          100% {
            transform: scale(1.25);
          }
        }

        .animate-zoom {
          animation: zoom 10s infinite linear;
        }
        
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
};

export default TenantHeroSection;