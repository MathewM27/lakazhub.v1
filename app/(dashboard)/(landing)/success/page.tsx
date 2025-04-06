'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { motion } from 'framer-motion';
import { FaHome, FaComments, FaCalendarAlt, FaBook, FaTools, FaBuilding } from 'react-icons/fa';
import Confetti from 'react-confetti';

// Define the type for debugInfo
interface DebugInfo {
  session?: any;
  sessionError?: any;
  user?: any;
  user_metadata?: any;
  redirectUrl?: string;
  [key: string]: any;
}

const SuccessPage = () => {
  const [status, setStatus] = useState('Authenticating...');
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({});
  const [showDebug, setShowDebug] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // Set window size for confetti
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight
    });

    const handleAuthCallback = async () => {
      const supabase = createClient();
      
      try {
        // Check if we have auth params in the URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);
        const hasAuthParams = hashParams.has('access_token') || queryParams.has('code');
        
        if (hasAuthParams) {
          // For hash-based auth (implicit flow)
          if (hashParams.has('access_token')) {
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');
            
            await supabase.auth.setSession({
              access_token: accessToken!,
              refresh_token: refreshToken || ''
            });
          }
          
          // For code-based auth (PKCE flow)
          if (queryParams.has('code')) {
            await supabase.auth.exchangeCodeForSession(window.location.href);
          }
          
          // Remove the auth params from URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        
        // Get the session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        setDebugInfo(prev => ({
          ...prev,
          session,
          sessionError
        }));
        
        if (sessionError) {
          throw sessionError;
        }
        
        if (!session) {
          throw new Error('No session found');
        }
        
        // Get user data
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          throw userError;
        }
        
        if (!user) {
          throw new Error('No user found');
        }
        
        const { user_metadata } = user;
        
        setDebugInfo(prev => ({
          ...prev,
          user,
          user_metadata
        }));

        const { full_name, user_role } = user_metadata || {};
        
        if (!user_role) {
          throw new Error('User role not found in metadata');
        }

        setStatus(`Authentication successful`);
        setShowConfetti(true);
        
        // Set redirect URL based on role
        setDebugInfo(prev => ({
          ...prev,
          redirectUrl: user_role === 'landlord' 
            ? '/landlord-dashboard' 
            : user_role === 'tenant' 
              ? '/tenant-dashboard'
              : user_role === 'admin'
                ? '/admin-dashboard'
                : '/',
          session
        }));
      } catch (error: any) {
        console.error('Authentication error:', error);
        setError(error.message);
        setStatus(`Authentication error: ${error.message}`);
      }
    };
    
    handleAuthCallback();
  }, []);
  
  const handleRedirect = () => {
    const { redirectUrl, user_metadata } = debugInfo;
    if (redirectUrl) {
      if (user_metadata?.user_role === 'landlord') {
        window.location.href = `${redirectUrl}?role=landlord`;
      } else {
        window.location.href = redirectUrl;
      }
    } else {
      window.location.href = '/';
    }
  };

  // Feature items for each role
  const tenantFeatures = [
    { icon: <FaHome className="text-yellow-400 text-2xl" />, title: "Curated Properties", description: "Access filtered and quality properties" },
    { icon: <FaComments className="text-yellow-400 text-2xl" />, title: "Seamless Chat", description: "Inquire directly with landlords" },
    { icon: <FaCalendarAlt className="text-yellow-400 text-2xl" />, title: "Latest Listings", description: "Always up-to-date properties" },
    { icon: <FaBook className="text-yellow-400 text-2xl" />, title: "Rental Guide", description: "Tips to navigate your journey" },
  ];

  const landlordFeatures = [
    { icon: <FaBuilding className="text-yellow-400 text-2xl" />, title: "Property Management", description: "Manage multiple properties easily" },
    { icon: <FaTools className="text-yellow-400 text-2xl" />, title: "Customization", description: "Control property availability" },
    { icon: <FaComments className="text-yellow-400 text-2xl" />, title: "Tenant Connect", description: "Chat with potential tenants" },
    { icon: <FaBook className="text-yellow-400 text-2xl" />, title: "Listing Tips", description: "Optimize your property listings" },
  ];

  const adminFeatures = [
    { icon: <FaBuilding className="text-yellow-400 text-2xl" />, title: "Platform Oversight", description: "Monitor platform activity" },
    { icon: <FaTools className="text-yellow-400 text-2xl" />, title: "Admin Controls", description: "Approve listings and manage users" },
    { icon: <FaComments className="text-yellow-400 text-2xl" />, title: "User Support", description: "Help users with inquiries" },
    { icon: <FaBook className="text-yellow-400 text-2xl" />, title: "Analytics", description: "Track platform performance" },
  ];

  // Get the appropriate content based on user role
  const getUserContent = () => {
    const { user_metadata } = debugInfo;
    const role = user_metadata?.user_role;
    const name = user_metadata?.full_name || 'there';

    if (role === 'tenant') {
      return {
        title: `Welcome to LakazHub, ${name}! 🏡✨`,
        subtitle: 'Your new rental journey starts here. Find your perfect home, chat with landlords easily, and stay updated with the latest listings.',
        features: tenantFeatures,
        buttonText: 'Explore Properties',
      };
    } else if (role === 'landlord') {
      return {
        title: `Welcome ${name}! 🏢✨`,
        subtitle: 'Let\'s get ready for business. Manage your properties, customize availability, and connect with tenants in just a few clicks.',
        features: landlordFeatures,
        buttonText: 'Manage Your Properties',
      };
    } else if (role === 'admin') {
      return {
        title: `Welcome Admin! 🛡️`,
        subtitle: 'Monitor users, approve listings, and keep LakazHub running smoothly.',
        features: adminFeatures,
        buttonText: 'Access Admin Panel',
      };
    }

    return {
      title: 'Welcome to LakazHub!',
      subtitle: 'Your journey with us begins now.',
      features: [],
      buttonText: 'Continue',
    };
  };

  const content = getUserContent();

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-black text-white">
        <div className="max-w-2xl w-full bg-gray-900 p-8 rounded-xl shadow-2xl border border-gray-800">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Authentication Error</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-yellow-400 text-black px-6 py-3 rounded-md font-medium hover:bg-yellow-300 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (!debugInfo.user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
        <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-lg font-medium">Authenticating...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          colors={['#FFFFFF', '#FFD700']}
          tweenDuration={10000}
        />
      )}

      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-yellow-400/20 via-transparent to-transparent"></div>
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-yellow-400/20 via-transparent to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-5xl mx-auto">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div 
              className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.2 
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                <svg className="w-12 h-12 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </motion.div>
            </motion.div>
            <motion.h1 
              className="text-4xl md:text-5xl font-bold mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <span className="text-yellow-400">
                {content.title.split('!')[0]}
              </span>
              {content.title.includes('!') ? '!' : ''}
            </motion.h1>
            <motion.p 
              className="text-xl text-gray-300 max-w-3xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {content.subtitle}
            </motion.p>
          </motion.div>

          {/* Features */}
          {content.features.length > 0 && (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
              variants={container}
              initial="hidden"
              animate="show"
            >
              {content.features.map((feature, index) => (
                <motion.div 
                  key={index} 
                  className="bg-gray-900 rounded-xl p-6 hover:bg-gray-800 transition-colors border border-gray-800"
                  variants={item}
                >
                  <div className="mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* CTA Button */}
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <button
              onClick={handleRedirect}
              className="bg-yellow-400 text-black px-8 py-4 rounded-md font-bold text-lg hover:bg-yellow-300 transition-all hover:scale-105 transform shadow-lg shadow-yellow-400/20"
            >
              {content.buttonText} →
            </button>

            {/* Debug toggle - keep this for development */}
            <div className="mt-10">
              <button 
                onClick={() => setShowDebug(!showDebug)}
                className="text-gray-500 text-sm underline"
              >
                {showDebug ? 'Hide' : 'Show'} Debug Info
              </button>
              
              {showDebug && (
                <pre className="bg-gray-900 p-4 rounded overflow-auto max-w-full max-h-96 mt-4 text-left text-xs text-gray-400">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;