'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FiCheck, FiArrowRight } from 'react-icons/fi';
import { FiMapPin } from 'react-icons/fi';

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

const HeroSection = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Animation for the line pattern background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    const setCanvasDimensions = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    
    setCanvasDimensions();
    window.addEventListener('resize', setCanvasDimensions);
    
    // Store canvas width and height to avoid null checks
    let canvasWidth = canvas.width;
    let canvasHeight = canvas.height;
    
    // Update dimensions on resize
    const handleResize = () => {
      setCanvasDimensions();
      canvasWidth = canvas.width;
      canvasHeight = canvas.height;
    };
    
    window.addEventListener('resize', handleResize);
    
    // Create Particle class that implements ParticleProps
    class Particle implements ParticleProps {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      
      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;
      }
      
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        
        if (this.x < 0 || this.x > canvasWidth) {
          this.speedX = -this.speedX;
        }
        
        if (this.y < 0 || this.y > canvasHeight) {
          this.speedY = -this.speedY;
        }
      }
      
      draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Create particles
    const particles: Particle[] = [];
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * canvasWidth;
      const y = Math.random() * canvasHeight;
      particles.push(new Particle(x, y));
    }
    
    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      
      // Update and draw particles
      particles.forEach(particle => {
        particle.update();
        particle.draw(ctx);
      });
      
      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * (1 - distance/100)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      
      requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', setCanvasDimensions);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Features animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
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

  const quickFeatures = [
    { text: 'Easy Property Setup', icon: FiCheck },
    { text: 'Chat with tenants', icon: FiCheck },
    { text: 'Set Property Availability', icon: FiCheck }
  ];

  return (
    <section className="relative min-h-[90svh] flex items-center justify-center py-8 sm:py-12 bg-black text-white overflow-hidden mt-2">
      {/* Animated background canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-50"
      />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-black pointer-events-none"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 py-4 sm:py-8">
          {/* Left content column */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full md:w-1/2 space-y-4 md:space-y-6 pt-4 md:pt-0"
          >
            <div className="inline-block">
              <motion.span 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="text-sm font-medium bg-white/10 backdrop-blur-sm text-white/90 py-1 px-3 rounded-full border border-white/20"
              >
                Landlord Management Platform
              </motion.span>
            </div>
            
            <h1 className="text-3xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="block"
              >
                Manage Your
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="block relative"
              >
                <span className="relative z-10">Properties Effortlessly</span>
              </motion.span>
            </h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-base sm:text-lg text-white/80 max-w-xl leading-relaxed"
            >
              Streamline your rental business with our all-in-one platform designed specifically for property owners.
            </motion.p>
            
            {/* Mobile-specific ordering - this div will only be visible on mobile */}
            <div className="block md:hidden">
              {/* Right image/visual column (Mobile version) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
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
                          Premium Listing
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
                            <span className="text-white font-bold">Rs 35,000</span>
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
                      <p className="text-xs">Featured Property</p>
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
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              <Link
                href="/get-started"
                className="group min-h-[50px] flex items-center justify-center px-8 py-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-all duration-300 text-base font-medium focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                Get Started
                <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
              <Link
                href="/properties"
                className="min-h-[50px] flex items-center justify-center px-8 py-3 bg-transparent text-white border border-white/30 rounded-lg hover:bg-white/10 transition-all duration-300 text-base font-medium focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                List Your Property
              </Link>
            </motion.div>
            
            {/* Feature highlights */}
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              {quickFeatures.map((feature, index) => (
                <motion.div 
                  key={index}
                  variants={itemVariants} 
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-sm text-white/80">{feature.text}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
          
          {/* Right image/visual column - Only visible on desktop */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="w-full md:w-1/2 hidden md:block"
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
                      Premium Listing
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
                        <span className="text-white font-bold">Rs 35,000</span>
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
                  <p className="text-xs">Featured Property</p>
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
      `}</style>
    </section>
  );
};

export default HeroSection;