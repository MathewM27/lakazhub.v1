'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Handle scroll to show/hide scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 500) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-black text-white pt-16 pb-8 overflow-hidden">
      {/* Background pattern - simple and static for better performance */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full" 
          style={{ 
            backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* Decorative elements - simplified */}
      <div className="absolute top-10 right-[20%] w-64 h-64 rounded-full bg-white/5 opacity-0 animate-pulse-slow"></div>
      
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 relative z-10">
        {/* Logo section */}
        <div className="flex justify-center mb-4 opacity-0 animate-fade-in">
          <div className="text-center">
            {/* Logo with spinning animation - CSS only */}
            <div className="relative w-20 h-20 mb-4 mx-auto">
              {/* Spinning border using pure CSS */}
              <div className="absolute inset-0 rounded-full border-2 border-t-white border-r-white/40 border-b-white/10 border-l-white/40 animate-spin-slow"></div>
              
              {/* Inner content with logo */}
              <div className="absolute inset-2 bg-black rounded-full flex items-center justify-center overflow-hidden">
                <Image 
                  src="https://qqqes0fuio.ufs.sh/f/7I9AgfULkX7rloBGUTUKas6W9TwJvzOH7X2rSPMt5dQbjqo4" 
                  alt="FutureX Design Logo" 
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                  priority={false}
                  loading="lazy"
                />
              </div>
            </div>
            
            <h2 className="font-bold tracking-tight text-fluid-h2">
              Lakaz<span className="text-white/70">Hub</span>
            </h2>
            <div className="h-1 w-12 bg-white/30 mx-auto mt-2 rounded-full" />
          </div>
        </div>

        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          {/* About Section */}
          <div className="space-y-4 opacity-0 animate-fade-in delay-200">
            <h3 className="text-fluid-lg font-bold border-b border-white/10 pb-2 mb-4">About Us</h3>
            <p className="text-white/70 leading-relaxed">
              Simplifying the rental experience for landlords and tenants across Mauritius with our innovative platform and dedicated service.
            </p>
            
          </div>

          {/* Quick Links */}
          <div className="space-y-4 opacity-0 animate-fade-in delay-300">
            <h3 className="text-fluid-lg font-bold border-b border-white/10 pb-2 mb-4">Quick Links</h3>
            <ul className="space-y-3">
              {[
                { name: 'Home', href: '/' },
                { name: 'Properties', href: '#properties' },
                { name: 'Why Us', href: '#why-us' },
                { name: 'Sign Up', href: '#signup' }
              ].map((link, i) => (
                <li
                  key={i}
                  className="opacity-0 animate-slide-in"
                  style={{animationDelay: `${300 + (i * 100)}ms`}}
                >
                  <Link 
                    href={link.href} 
                    className="text-white/70 hover:text-white transition-colors flex items-center group"
                  >
                    <span className="w-0 group-hover:w-2 h-[2px] bg-white mr-0 group-hover:mr-2 transition-all duration-300"></span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links */}
          <div className="space-y-4 opacity-0 animate-fade-in delay-400">
            <h3 className="text-fluid-lg font-bold border-b border-white/10 pb-2 mb-4">Follow Us</h3>
            <p className="text-white/70 mb-4">Stay connected for updates and news</p>
            <div className="flex space-x-4">
              {[
                { icon: Facebook, href: 'https://www.facebook.com/profile.php?id=61565853924765', label: 'Facebook' },
                { icon: Instagram, href: 'https://www.instagram.com/futurexdesigns/', label: 'Instagram' },
                { icon: TiktokIcon, href: 'https://www.tiktok.com/@future_xdesigns?_t=ZM-8vjhmF9nyMQ&_r=1', label: 'TikTok' }
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  className="w-10 h-10 rounded-full backdrop-blur-sm bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all duration-300 hover:-translate-y-1"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
            <div className="mt-4 flex items-center">
              <Mail className="w-4 h-4 mr-3 text-white/50" />
              <span className="text-white/70">support@lakazhub.com</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar - simplified */}
        <div className="border-t border-white/10 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center gap-4 opacity-0 animate-fade-in delay-500">
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
        </div>

        {/* Scroll to Top Button - CSS animations */}
        <button
          onClick={scrollToTop}
          className={`fixed bottom-8 right-8 w-12 h-12 backdrop-blur-md bg-white/10 border border-white/20 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-white hover:text-black transition-all duration-300 hover:-translate-y-1 ${
            showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16 pointer-events-none'
          }`}
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      </div>
      
      {/* CSS animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        
        @keyframes slideIn {
          0% { opacity: 0; transform: translateX(-10px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }
        
        .animate-slide-in {
          animation: slideIn 0.5s ease-out forwards;
        }
        
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        
        .animate-pulse-slow {
          animation: pulseSlow 10s ease-in-out infinite;
        }
        
        @keyframes pulseSlow {
          0%, 100% { opacity: 0.05; }
          50% { opacity: 0.2; }
        }
        
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
      `}</style>
    </footer>
  );
};