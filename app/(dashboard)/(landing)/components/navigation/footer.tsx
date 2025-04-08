'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Facebook, Instagram, ArrowUp, Mail } from 'lucide-react';

// Custom TikTok icon since it's not in lucide-react by default
const TiktokIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

export const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
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
    <footer className="relative bg-black text-white pt-8 pb-4 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="footer-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#footer-grid)" />
          </svg>
        </div>
      </div>

      {/* Decorative elements */}
      <motion.div
        animate={{ 
          y: [0, -15, 0],
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{ 
          duration: 10, 
          repeat: Infinity,
          repeatType: "reverse" 
        }}
        className="absolute top-10 right-[20%] w-64 h-64 rounded-full bg-white/5"
      />
      
      <div className="container mx-auto px-4 relative z-10">
        
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          
          {/* Logo section */}
          <motion.div 
            variants={itemVariants}
            className="flex justify-center mb-4"
          >
            <div className="text-center">
              {/* FutureX Design Section */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center justify-center "
          >
            {/* Logo with spinning animation */}
            <div className="relative w-20 h-20 mb-4">
              {/* Spinning border */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ 
                  duration: 8, 
                  repeat: Infinity, 
                  ease: "linear" 
                }}
                className="absolute inset-0 rounded-full border-2 border-t-white border-r-white/40 border-b-white/10 border-l-white/40"
              />
              
              {/* Inner content with logo */}
              <div className="absolute inset-2 bg-black rounded-full flex items-center justify-center overflow-hidden">
                <Image 
                  src="/X.jpg" 
                  alt="FutureX Design Logo" 
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            
          </motion.div>
              <h2 className="text-3xl font-bold tracking-tight">
                Lakaz<span className="text-white/70">Hub</span>
              </h2>
              <div className="h-1 w-12 bg-white/30 mx-auto mt-2 rounded-full" />
            </div>
          </motion.div>

          {/* Main footer content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {/* About Section */}
            <motion.div variants={itemVariants} className="space-y-4">
              <h3 className="text-xl font-bold border-b border-white/10 pb-2 mb-4">About Us</h3>
              <p className="text-white/70 leading-relaxed">
                Simplifying the rental experience for landlords and tenants across Mauritius with our innovative platform and dedicated service.
              </p>
              <div className="pt-2">
                <Link 
                  href="/about" 
                  className="inline-flex items-center text-white hover:text-white/80 font-medium text-sm"
                >
                  Learn more 
                  <span className="ml-2 text-xs">→</span>
                </Link>
              </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div variants={itemVariants} className="space-y-4">
              <h3 className="text-xl font-bold border-b border-white/10 pb-2 mb-4">Quick Links</h3>
              <ul className="space-y-3">
                {[
                  { name: 'Home', href: '/' },
                  { name: 'Properties', href: '#properties' },
                  { name: 'Why Us', href: '#why-us' },
                  { name: 'Sign Up', href: '#signup' }
                ].map((link, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 + 0.2 }}
                  >
                    <Link 
                      href={link.href} 
                      className="text-white/70 hover:text-white transition-colors flex items-center group"
                    >
                      <span className="w-0 group-hover:w-2 h-[2px] bg-white mr-0 group-hover:mr-2 transition-all duration-300"></span>
                      {link.name}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Social Links */}
            <motion.div variants={itemVariants} className="space-y-4">
              <h3 className="text-xl font-bold border-b border-white/10 pb-2 mb-4">Follow Us</h3>
              <p className="text-white/70 mb-4">Stay connected for updates and news</p>
              <div className="flex space-x-3">
                {[
                  { icon: Facebook, href: '#' },
                  { icon: Instagram, href: '#' },
                  { icon: TiktokIcon, href: '#' }
                ].map((social, i) => (
                  <motion.a
                    key={i}
                    href={social.href}
                    whileHover={{ y: -3, scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    className="w-10 h-10 rounded-full backdrop-blur-sm bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all duration-300"
                  >
                    <social.icon className="w-4 h-4" />
                  </motion.a>
                ))}
              </div>
              <div className="mt-4 flex items-center">
                <Mail className="w-4 h-4 mr-3 text-white/50" />
                <span className="text-white/70">futurexdesigns.info@gmail.com</span>
              </div>
            </motion.div>
          </div>

          
        </motion.div>

        {/* Bottom Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          viewport={{ once: true }}
          className="border-t border-white/10 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center gap-4"
        >
          <p className="text-white/50 text-sm">
            © {new Date().getFullYear()} Lakaz Hub. All rights reserved.
          </p>
          <div className="flex items-center gap-8">
            <Link href="/privacy" className="text-white/50 hover:text-white text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-white/50 hover:text-white text-sm transition-colors">
              Terms of Service
            </Link>
          </div>
        </motion.div>

        {/* Scroll to Top Button */}
        <motion.button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 w-12 h-12 backdrop-blur-md bg-white/10 border border-white/20 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-white hover:text-black transition-all duration-300"
          whileHover={{ y: -4, scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 260, 
            damping: 20 
          }}
        >
          <ArrowUp className="w-5 h-5" />
        </motion.button>
      </div>
    </footer>
  );
};