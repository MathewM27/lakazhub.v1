'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { HiOutlineHome, HiOutlineKey } from 'react-icons/hi';
import { FiCheck, FiArrowRight } from 'react-icons/fi';
import Image from 'next/image';

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

export const HeroSection = () => {
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

  return (
    <section id="hero" className="relative min-h-[90svh] flex items-center justify-center py-8 sm:py-12 bg-black text-white overflow-hidden">
      {/* Animated background canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-50"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-black pointer-events-none"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 mt-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left content column */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full md:w-1/2 space-y-4 md:space-y-8"
          >
            <div className="inline-block ">
              <motion.span
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="text-sm font-medium bg-white/10 backdrop-blur-sm text-white/90 py-1 px-3 rounded-full border border-white/20"
              >
                Introducing LakazHub
              </motion.span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="block"
              >
                Where Homes &
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="block relative"
              >
                <span className="relative z-10">People Connect</span>
              </motion.span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-base sm:text-lg text-white/80 max-w-xl leading-relaxed"
            >
              Redefining the renting experience by seamlessly connecting landlords and tenants.
            </motion.p>

            {/* Mobile image - Only shown on mobile devices */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="block md:hidden w-full py-4"
            >
              <div className="relative mx-auto max-w-md">
                <div className="aspect-square w-full relative">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="absolute inset-0 w-full h-full rounded-3xl bg-gradient-to-tr from-white/5 to-white/10 backdrop-blur-md border border-white/10 shadow-2xl overflow-hidden"
                  >
                    {/* Image background */}
                    <Image
                      src="/home0.jpg"
                      alt="Home background"
                      fill
                      priority
                      className="absolute inset-0 object-contain transform scale-125 animate-zoom"
                    />

                    {/* Interior elements */}
                    <div className="absolute inset-0 p-6 flex flex-col">
                      <div className="flex justify-between items-center mb-6">
                        <HiOutlineHome className="w-8 h-8 text-white" />
                        <HiOutlineKey className="w-7 h-7 text-white" />
                      </div>

                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.9 }}
                        className="mt-auto"
                      >
                        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-4"></div>
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-sm text-white/60">Connecting</p>
                            <p className="text-lg font-medium text-white">Landlords & Tenants</p>
                          </div>
                          <motion.div
                            animate={{
                              rotate: [0, 5, 0, -5, 0],
                              y: [0, -5, 0, -5, 0]
                            }}
                            transition={{
                              duration: 5,
                              repeat: Infinity,
                              repeatType: "loop"
                            }}
                            className="w-10 h-10 rounded-full bg-white flex items-center justify-center"
                          >
                            <div className="w-5 h-5 rounded-full bg-black"></div>
                          </motion.div>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.2 }}
                    className="absolute -top-4 -right-4 w-36 h-12 bg-black border border-white/20 rounded-lg shadow-lg flex items-center justify-center"
                  >
                    <div className="text-white text-center">
                      <p className="text-xs">Seamless Experience</p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              <Link
                href="#signup"
                className="group min-h-[50px] flex items-center justify-center px-8 py-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-all duration-300 text-base font-medium focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                Get Started
                <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
              <Link
                href="#properties"
                className="min-h-[50px] flex items-center justify-center px-8 py-3 bg-transparent text-white border border-white/30 rounded-lg hover:bg-white/10 transition-all duration-300 text-base font-medium focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                Explore Properties
              </Link>
            </motion.div>

            {/* Feature highlights */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2"
            >
              <motion.div variants={itemVariants} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <FiCheck className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm text-white/80">Streamlined Application Process</p>
              </motion.div>

              <motion.div variants={itemVariants} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <FiCheck className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm text-white/80">Smart Property Management</p>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Right image/visual column - Only shown on tablet/desktop */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden md:block w-full md:w-1/2"
          >
            <div className="relative mx-auto max-w-md">
              {/* Animated visual element */}
              <div className="aspect-square w-full relative">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="absolute inset-0 w-full h-full rounded-3xl bg-gradient-to-tr from-white/5 to-white/10 backdrop-blur-md border border-white/10 shadow-2xl overflow-hidden"
                >
                  {/* Image background */}
                  <Image
                    src="/home0.jpg"
                    alt="Home background"
                    fill
                    priority
                    className="absolute inset-0 object-contain transform scale-125 animate-zoom"
                  />

                  {/* Interior elements */}
                  <div className="absolute inset-0 p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                      <HiOutlineHome className="w-8 h-8 text-white" />
                      <HiOutlineKey className="w-7 h-7 text-white" />
                    </div>

                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.6, delay: 0.9 }}
                      className="mt-auto"
                    >
                      <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-4"></div>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-sm text-white/60">Connecting</p>
                          <p className="text-lg font-medium text-white">Landlords & Tenants</p>
                        </div>
                        <motion.div
                          animate={{
                            rotate: [0, 5, 0, -5, 0],
                            y: [0, -5, 0, -5, 0]
                          }}
                          transition={{
                            duration: 5,
                            repeat: Infinity,
                            repeatType: "loop"
                          }}
                          className="w-10 h-10 rounded-full bg-white flex items-center justify-center"
                        >
                          <div className="w-5 h-5 rounded-full bg-black"></div>
                        </motion.div>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 1.2 }}
                  className="absolute -top-4 -right-4 w-36 h-12 bg-black border border-white/20 rounded-lg shadow-lg flex items-center justify-center"
                >
                  <div className="text-white text-center">
                    <p className="text-xs">Seamless Experience</p>
                  </div>
                </motion.div>
              </div>
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