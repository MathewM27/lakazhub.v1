'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface ParallaxProps {
  title?: string;
  subtitle?: string;
}

const Parallax = ({
  title = "Discover Modern Living",
  subtitle = "Experience the perfect balance of comfort and luxury in our carefully curated properties"
}: ParallaxProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );
    
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  
  // Simple parallax effects
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -20]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <div 
      ref={containerRef}
      className="relative py-12 md:py-14 lg:py-14 bg-black overflow-hidden"
    >
      {/* Grid pattern background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Horizontal lines */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        
        {/* Vertical lines */}
        {[...Array(6)].map((_, i) => (
          <div 
            key={i} 
            className="absolute w-px h-full bg-white/5" 
            style={{ left: `${i * 20}%` }}
          ></div>
        ))}
      </div>
      
      {/* Decorative elements */}
      <motion.div 
        style={{ y: y1 }}
        className="absolute left-[5%] top-[20%] w-32 h-32 rounded-full bg-white/2 blur-xl"
      />
      
      <motion.div 
        style={{ y: y2 }}
        className="absolute right-[10%] bottom-[20%] w-48 h-48 rounded-full bg-white/3 blur-xl"
      />
      
      {/* Centered content */}
      <motion.div
        style={{ opacity }}
        className="relative z-10 container mx-auto px-4 text-center max-w-4xl"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mb-8"
        >
          {/* Decorative line */}
          <div className="w-12 h-px bg-white/30 mx-auto mb-8"></div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">{title}</h2>
          <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">{subtitle}</p>
          
          <div className="h-px w-full max-w-xs mx-auto bg-gradient-to-r from-transparent via-white/20 to-transparent mb-8"></div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Parallax;