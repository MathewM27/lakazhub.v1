'use client';

import { useRef, useEffect } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';
import { Home, Users, CheckCircle, ArrowRight, X, Check } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// Define interface for Dot class
interface DotProps {
  x: number;
  y: number;
  size: number;
  opacity: number;
  draw: () => void;
}

const features = [
  {
    title: 'For Landlords',
    icon: Home,
    benefits: ['Manage multiple properties', 'customize availability', 'Chat with potential tenants'],
  },
  {
    title: 'For Tenants',
    icon: Users,
    benefits: ['Access filtered properties', 'Seamless inquiry with chat service', 'Access upto date listings'],
  },
  {
    title: 'Hassle-free Renting',
    icon: CheckCircle,
    benefits: ['No Agency fees', 'Communication chanel', 'Seamless experience'],
  },
];

export const WhyUsSection = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { once: false, margin: "-10% 0px" });
  const controls = useAnimation();

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [inView, controls]);

  // Canvas background animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width = window.innerWidth;
    const height = canvas.height = canvas.clientHeight;
    
    let dots: DotProps[] = [];
    const dotsCount = Math.min(width, height) / 20; // Adjust dots density
    
    class Dot implements DotProps {
      x: number;
      y: number;
      size: number;
      opacity: number;
      
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2 + 0.5;
        this.opacity = Math.random() * 0.2 + 0.1;
      }
      
      draw() {
        if (!ctx) return;
        // Changed to white dots with opacity
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
      }
    }
    
    function init() {
      dots = [];
      for (let i = 0; i < dotsCount; i++) {
        dots.push(new Dot());
      }
    }
    
    function animate() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      dots.forEach(dot => {
        dot.draw();
      });
      requestAnimationFrame(animate);
    }
    
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = canvas.clientHeight;
      init();
    };
    
    window.addEventListener('resize', handleResize);
    
    init();
    animate();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const headingVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: "easeOut"
      },
    },
  };

  const highlightVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
        delay: 0.3
      }
    }
  };

  return (
    <section 
      id="why-us" 
      ref={sectionRef}
      className="relative py-24 bg-black overflow-hidden" // Changed background to black
    >
      {/* Subtle background pattern */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-30"
      />
      
      {/* Section Content */}
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial="hidden"
          animate={controls}
          variants={containerVariants}
          className="max-w-6xl mx-auto"
        >
          {/* Section heading with animated underline */}
          <motion.div 
            variants={headingVariants} 
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white relative inline-block">
              {/* Changed to white text */}
              Why join the community?
              <motion.span 
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="absolute -bottom-2 left-0 h-1 bg-white/20 rounded-full" // Changed underline to white with opacity
              ></motion.span>
            </h2>
            
            <motion.p 
              variants={headingVariants}
              className="text-lg text-white/70 max-w-2xl mx-auto mt-6" // Changed to white text with opacity
            >
              We're redefining the rental experience by creating a seamless connection 
              between landlords and tenants.
            </motion.p>
          </motion.div>

          {/* Feature cards with subtle hover effects */}
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={cardVariants}
                whileHover={{ 
                  y: -5,
                  transition: { duration: 0.2 }
                }}
                className="group relative bg-black/80 rounded-2xl p-8 border border-white/10 shadow-xl overflow-hidden" // Changed to black/dark background with white border
              >
                {/* Card background effect */}
                <motion.div 
                  className="absolute -right-20 -top-20 w-40 h-40 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" // Changed to white with opacity
                />
                <motion.div 
                  className="absolute -left-20 -bottom-20 w-40 h-40 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" // Changed to white with opacity
                />
                
                {/* Icon with animated background */}
                <motion.div 
                  whileHover={{ 
                    rotate: [0, -5, 5, -5, 0],
                    transition: { duration: 0.5 }
                  }}
                  className="relative"
                >
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 relative z-10 overflow-hidden"> {/* Changed bg to white */}
                    <motion.div 
                      animate={{ 
                        y: ["-100%", "0%", "0%", "100%"],
                      }}
                      transition={{ 
                        duration: 4, 
                        repeat: Infinity,
                        repeatType: "loop",
                        times: [0, 0.4, 0.6, 1]
                      }}
                      className="absolute inset-0 bg-gradient-to-b from-white via-white to-gray-200" // Changed gradient to white/light
                    />
                    <feature.icon className="w-7 h-7 text-black relative z-10" /> {/* Changed icon color to black */}
                  </div>
                </motion.div>
                
                {/* Content - Title only, removed description */}
                <h3 className="text-2xl font-semibold mb-6 text-white">{feature.title}</h3> {/* Changed to white text and increased bottom margin */}
                
                {/* Benefits list with animations */}
                <motion.ul variants={highlightVariants} className="space-y-3 mb-6">
                  {feature.benefits.map((benefit, i) => (
                    <motion.li 
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + (i * 0.1) }}
                      className="flex items-start gap-2"
                    >
                      <span className="mt-1 flex-shrink-0 w-4 h-4 bg-white rounded-full flex items-center justify-center"> {/* Changed to white background */}
                        <Check className="w-2.5 h-2.5 text-black" /> {/* Changed check color to black */}
                      </span>
                      <span className="text-sm text-white/80">{benefit}</span> {/* Changed to white text with opacity */}
                    </motion.li>
                  ))}
                </motion.ul>
                
                {/* Learn more link with animation */}
                <Link href={`#${feature.title.toLowerCase().replace(' ', '-')}`} className="group inline-flex items-center text-sm font-medium text-white"> {/* Changed to white text */}
                  Learn more
                  <ArrowRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </motion.div>
            ))}
          </div>
          
          {/* Bottom highlight card with centered text and subtle animation */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="mt-16 backdrop-blur-sm bg-black border border-white/10 text-white rounded-2xl p-8 md:p-10 relative overflow-hidden"
          >
            {/* Subtle background animation */}
            <div className="absolute inset-0 overflow-hidden">
              {/* Subtle gradient glow that shifts position */}
              <motion.div 
                animate={{ 
                  x: ["0%", "5%", "0%", "-5%", "0%"],
                  y: ["0%", "-5%", "0%", "5%", "0%"]
                }}
                transition={{ 
                  duration: 20, 
                  ease: "easeInOut", 
                  repeat: Infinity,
                }}
                className="absolute -inset-[100%] opacity-20 bg-radial-gradient from-white/10 via-transparent to-transparent"
              />
              
              {/* Fine grid pattern with slight opacity change */}
              <div className="absolute inset-0" 
                style={{ 
                  backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)`,
                  backgroundSize: '20px 20px' 
                }}
              >
                <motion.div
                  animate={{ opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 8, ease: "easeInOut", repeat: Infinity }}
                  className="absolute inset-0"
                />
              </div>
            </div>
            
            {/* Centered content */}
            <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto">
              <motion.h3 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-2xl md:text-3xl font-bold mb-4 text-white"
              >
                Ready to transform your rental experience?
              </motion.h3>
              
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="text-white/80 text-lg"
              >
                Join a community of property owners and tenants enjoying a seamless rental experience.
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};