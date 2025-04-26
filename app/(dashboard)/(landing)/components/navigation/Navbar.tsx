'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Menu, X, User, Home, Building, Info } from 'lucide-react';

// Navigation links definition
const navLinks = [
  { href: '/', label: 'Home', icon: Home, section: 'hero' },
  { href: '/about', label: 'About', icon: Info, section: 'why-us' },
  { href: '/properties', label: 'Properties', icon: Building, section: 'properties' },
];

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeLink, setActiveLink] = useState('/');
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Only update state if value changes
  const setIsScrolledSafe = useCallback((val: boolean) => {
    setIsScrolled(prev => (prev !== val ? val : prev));
  }, []);

  const setActiveLinkSafe = useCallback((val: string) => {
    setActiveLink(prev => (prev !== val ? val : prev));
  }, []);

  // Throttled scroll handler for better performance
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          setIsScrolledSafe(scrollTop > 50);

          // Only run active link logic after first scroll
          if (scrollTop > 0) {
            const sections: {[key: string]: number} = {
              'hero': 0,
              'why-us': document.getElementById('why-us')?.offsetTop || 0,
              'properties': document.getElementById('properties')?.offsetTop || 0,
              'signup': document.getElementById('signup')?.offsetTop || 0,
            };
            const scrollPosition = scrollTop + 100;
            if (scrollPosition >= sections.signup) {
              setActiveLinkSafe('/signup');
            } else if (scrollPosition >= sections.properties) {
              setActiveLinkSafe('/properties');
            } else if (scrollPosition >= sections['why-us']) {
              setActiveLinkSafe('/about');
            } else {
              setActiveLinkSafe('/');
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [setIsScrolledSafe, setActiveLinkSafe]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node) && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  // Smooth scroll function with passive event listeners
  const scrollToSection = useCallback((sectionId: string, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
    }
    
    // Close mobile menu immediately
    setIsOpen(false);
    
    // Get the section element
    const section = document.getElementById(sectionId);
    if (!section) return;
    
    const offsetTop = section.offsetTop;
    
    // On mobile, we need to account for the height of the navbar
    const offset = window.innerWidth < 768 ? -70 : 0;
    
    // Use modern smooth scrolling
    window.scrollTo({
      top: offsetTop + offset,
      behavior: 'smooth'
    });
    
    // Update active section immediately for better UX
    const newActiveLink = 
      sectionId === 'hero' ? '/' : 
      sectionId === 'why-us' ? '/about' : 
      sectionId === 'properties' ? '/properties' : 
      sectionId === 'signup' ? '/signup' : '/';
      
    setActiveLink(newActiveLink);
  }, []);

  return (
    <nav 
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-black/90 backdrop-blur-md shadow-lg py-2' 
          : 'bg-transparent py-4'
      }`}
    >
      <div className="max-w-screen-xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="group flex items-center"
            onClick={(e) => scrollToSection('hero', e)}
          >
            <span className="font-bold tracking-tight text-white text-2xl">
              Lakaz<span className="opacity-70">Hub</span>
            </span>
            <div className="h-1 bg-white/30 group-hover:bg-white/50 transition-all duration-300 ml-1 mt-1 rounded-full w-0 group-hover:w-full"></div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-3">
            {navLinks.map((link) => (
              <div key={link.href} className="relative px-1">
                <a 
                  href={`#${link.section}`}
                  className="px-3 py-2 rounded-md text-sm font-medium flex items-center transition-all duration-300 text-white/90 hover:text-white"
                  onClick={(e) => scrollToSection(link.section, e)}
                >
                  <span>{link.label}</span>
                </a>
                {activeLink === link.href && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 mx-3 rounded-full bg-white transition-all duration-300"></div>
                )}
              </div>
            ))}

            {/* Sign Up Button */}
            <div className="ml-4">
              <button
                className="flex items-center space-x-1 px-4 py-2 rounded-full bg-white text-black hover:bg-white/90 transition-all duration-300 text-sm font-medium"
                onClick={(e) => scrollToSection('signup', e)}
              >
                <User className="h-4 w-4 mr-1" />
                <span>Sign Up</span>
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-full bg-white text-black hover:bg-white/90 transition-all duration-300 focus:outline-none"
              aria-label={isOpen ? "Close menu" : "Open menu"}
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <div
        ref={mobileMenuRef}
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          isOpen 
            ? "max-h-[400px] opacity-100" 
            : "max-h-0 opacity-0"
        }`}
      >
        <div className="backdrop-blur-xl bg-black/95 shadow-xl">
          <div className="px-4 pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={`#${link.section}`}
                className="flex items-center gap-2 px-3 py-4 rounded-lg text-sm font-medium transition-all duration-300 text-white hover:bg-white/10"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection(link.section);
                }}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </a>
            ))}
          </div>
          <div className="px-4 pb-3">
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
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};