'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { Menu, X, User, Home, Building, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeLink, setActiveLink] = useState('/');
  
  // Handle scroll behavior
  const handleScroll = () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    setIsScrolled(scrollTop > 50);
    
    // Update active link based on scroll position
    const sections = {
      'hero': 0,
      'why-us': document.getElementById('why-us')?.offsetTop || 0,
      'properties': document.getElementById('properties')?.offsetTop || 0,
      'signup': document.getElementById('signup')?.offsetTop || 0,
    };
    
    // Add a small offset to account for the navbar height
    const scrollPosition = scrollTop + 100;
    
    if (scrollPosition >= sections.signup) {
      setActiveLink('/signup'); // Changed from '/contact'
    } else if (scrollPosition >= sections.properties) {
      setActiveLink('/properties');
    } else if (scrollPosition >= sections['why-us']) {
      setActiveLink('/about');
    } else {
      setActiveLink('/');
    }
  };

  // Setup scroll event listener
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Smooth scroll function
  const scrollToSection = useCallback((sectionId: string, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
    }
    
    // Close mobile menu immediately
    setIsOpen(false);
    
    // Small delay to ensure the menu closes before scrolling
    setTimeout(() => {
      const section = document.getElementById(sectionId);
      if (!section) return;
      
      const offsetTop = section.offsetTop;
      
      // On mobile, we need to account for the height of the navbar
      const offset = window.innerWidth < 768 ? -70 : 0;
      
      window.scrollTo({
        top: offsetTop + offset,
        behavior: 'smooth'
      });
      
      // Update active section
      const newActiveLink = 
        sectionId === 'hero' ? '/' : 
        sectionId === 'why-us' ? '/about' : 
        sectionId === 'properties' ? '/properties' : 
        sectionId === 'signup' ? '/signup' : '/';
        
      setActiveLink(newActiveLink);
    }, 100);
  }, []);

  // Animation variants
  const navbarVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  const mobileNavVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { 
      opacity: 1,
      height: 'auto',
      transition: { 
        duration: 0.3,
        ease: "easeInOut"
      }
    },
    exit: { 
      opacity: 0,
      height: 0,
      transition: { 
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  };

  // Navigation links - Removed Contact
  const navLinks = [
    { href: '/', label: 'Home', icon: Home, section: 'hero' },
    { href: '/about', label: 'About', icon: Info, section: 'why-us' },
    { href: '/properties', label: 'Properties', icon: Building, section: 'properties' },
  ];

  return (
    <motion.nav 
      initial="hidden"
      animate="visible"
      variants={navbarVariants}
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-black/90 backdrop-blur-md shadow-lg py-2' 
          : 'bg-transparent py-4'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 bg-black">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" 
                className="group flex items-center" 
                onClick={(e) => scrollToSection('hero', e)}>
            <span className="text-2xl font-bold tracking-tight transition-colors text-white">
              Lakaz<span className="opacity-70">Hub</span>
            </span>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="h-1 w-0 bg-white/30 group-hover:bg-white/50 transition-colors ml-1 mt-1 rounded-full"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <div key={link.href} className="relative px-1">
                <a 
                  href={`#${link.section}`}
                  className="px-3 py-2 rounded-md text-sm font-medium flex items-center transition-all duration-300 text-white/90 hover:text-white cursor-pointer"
                  onClick={(e) => scrollToSection(link.section, e)}
                >
                  <span>{link.label}</span>
                </a>
                {activeLink === link.href && (
                  <motion.div 
                    layoutId="activeIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 mx-3 rounded-full bg-white"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </div>
            ))}

            {/* Single Sign Up Button */}
            <div className="ml-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-1 px-4 py-2 rounded-full bg-white text-black hover:bg-white/90 transition-all duration-300 text-sm font-medium"
                onClick={(e) => scrollToSection('signup', e)}
              >
                <User className="h-4 w-4 mr-1" />
                <span>Sign Up</span>
              </motion.button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-full bg-white text-black hover:bg-white/90 transition-all duration-300 focus:outline-none"
            >
              {isOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={mobileNavVariants}
            className="md:hidden overflow-hidden"
          >
            <div className="backdrop-blur-xl bg-black/95 shadow-xl">
              <div className="px-2 pt-2 pb-3 space-y-1">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={`#${link.section}`}
                    className="flex items-center gap-2 px-3 py-4 rounded-lg text-sm font-medium transition-all duration-300 text-white hover:bg-white/10"
                    onClick={(e) => {
                      e.preventDefault(); // Make sure to prevent default
                      scrollToSection(link.section);
                    }}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </a>
                ))}
              </div>
              
              {/* Mobile Authentication Option - Single Sign Up Button */}
              <div className="px-2 pb-3">
                <div className="mt-3 p-3 rounded-lg bg-white/5">
                  <a
                    href="#signup"
                    className="flex justify-center items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-white text-black hover:bg-white/90 transition-all duration-300"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection('signup');
                    }}
                  >
                    <User className="h-4 w-4" />
                    Sign Up
                  </a>
                  
                  <div className="mt-3 flex flex-col space-y-2">
                    <a
                      href="#faq"
                      className="px-3 py-2 rounded-lg text-sm text-white/70 hover:underline text-center"
                      onClick={() => setIsOpen(false)}
                    >
                      FAQ
                    </a>
                    <a
                      href="#help"
                      className="px-3 py-2 rounded-lg text-sm text-white/70 hover:underline text-center"
                      onClick={() => setIsOpen(false)}
                    >
                      Help Center
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};