'use client';

import { useState, useCallback } from "react";
import { FcGoogle } from "react-icons/fc";
import { FiUser, FiHome } from "react-icons/fi";
import { BsShieldLockFill, BsStars } from "react-icons/bs";
import { HiOutlineSparkles } from "react-icons/hi2";
import { AiOutlineCheck } from "react-icons/ai";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from 'next/navigation';
// import { signinWithGoogle } from "@/utils/actions"; // Commented out for now

const StaticBackground = () => (
  <div className="absolute inset-0 z-0 opacity-40">
    <div className="absolute inset-0" 
      style={{ 
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
        backgroundSize: '20px 20px' 
      }}
    />
    <div className="absolute top-1/4 right-1/4 w-32 h-32 rounded-full bg-white/5"></div>
    <div className="absolute bottom-1/4 left-1/4 w-48 h-48 rounded-full bg-white/5"></div>
  </div>
);

const tenantInfo = {
  title: "Find Your Perfect Home",
  description: "Browse verified listings, connect with trusted landlords, and manage your rental journey with ease. Enjoy a seamless experience tailored for tenants.",
  icon: <FiUser className="w-8 h-8 text-blue-400" />,
  color: "from-blue-700/80 to-blue-400/30"
};

const landlordInfo = {
  title: "List & Manage Properties",
  description: "Showcase your properties to quality tenants, streamline communication, and manage your rentals efficiently. Designed for modern landlords.",
  icon: <FiHome className="w-8 h-8 text-amber-400" />,
  color: "from-amber-600/80 to-amber-300/30"
};

const AnimatedDivider = () => (
  <motion.div
    initial={{ scaleX: 0 }}
    animate={{ scaleX: 1 }}
    transition={{ duration: 0.7, delay: 0.2, type: "spring" }}
    className="w-full h-1 bg-gradient-to-r from-blue-500 via-white/30 to-amber-400 rounded-full my-6 origin-left"
  />
);

export const SignupSection = () => {
  const router = useRouter();
  const [userType, setUserType] = useState<"tenant" | "landlord">("tenant");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [showComingSoon, setShowComingSoon] = useState(false);

  const handleUserTypeChange = useCallback((type: "tenant" | "landlord") => {
    setUserType(type);
  }, []);

  // Utility to clear PKCE/session storage and Supabase cookies
  const clearAuthStorage = useCallback(() => {
    try {
      sessionStorage.clear();
      localStorage.clear();
      if (typeof document !== "undefined") {
        document.cookie.split(";").forEach(cookie => {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        });
      }
    } catch {}
  }, []);

  // Disabled: Google sign-in functionality
  // const handleGoogleSignIn = useCallback(async () => {
  //   try {
  //     setIsGoogleLoading(true);
  //     clearAuthStorage();
  //     router.push(`/auth/auth-loading?message=Connecting to Google&user_role=${userType}`);
  //     await signinWithGoogle(userType);
  //   } catch (error) {
  //     setError('Failed to sign in with Google. Please try again.');
  //     setIsGoogleLoading(false);
  //   }
  // }, [userType, router, clearAuthStorage]);

  const handleGoogleSignIn = useCallback(() => {
    setShowComingSoon(true);
  }, []);

  const info = userType === "tenant" ? tenantInfo : landlordInfo;

  return (
    <section id="signup" className="bg-black text-white py-16 md:py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black to-black/95"></div>
      <StaticBackground />
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 relative z-10">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="font-bold text-center mb-10 text-fluid-h2"
        >
          Join Our Community
        </motion.h2>
        
        {/* User Type Selector - Centered at the top */}
        <div className="max-w-xs mx-auto mb-8">
          <div className="flex rounded-lg border border-white/10 p-1 bg-black/40 backdrop-blur-sm">
            <button
              onClick={() => handleUserTypeChange("tenant")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md transition-colors duration-300 ${
                userType === "tenant" 
                  ? "bg-blue-600 text-white" 
                  : "bg-transparent text-white/70 hover:bg-white/5"
              }`}
            >
              <FiUser className="w-4 h-4" />
              <span className="text-sm font-medium">Tenant</span>
            </button>
            <button
              onClick={() => handleUserTypeChange("landlord")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md transition-colors duration-300 ${
                userType === "landlord" 
                  ? "bg-amber-500 text-black" 
                  : "bg-transparent text-white/70 hover:bg-white/5"
              }`}
            >
              <FiHome className="w-4 h-4" />
              <span className="text-sm font-medium">Landlord</span>
            </button>
          </div>
        </div>

        {/* Grid Layout */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column - Info Card */}
          <motion.div
            key={`${userType}-info`}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, type: "spring" }}
            className={`w-full bg-gradient-to-br ${info.color} rounded-xl shadow-lg border border-white/10 p-6 md:p-8 flex flex-col justify-center`}
          >
            <div className="flex flex-col items-center text-center">
              <motion.div
                initial={{ rotate: -10, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="mb-4"
              >
                {info.icon}
              </motion.div>
              <div>
                <div className="flex items-center justify-center gap-2 mb-3">
                  <span className="font-semibold text-xl">{info.title}</span>
                  <motion.span
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="inline-flex"
                  >
                    <BsStars className={`w-4 h-4 ${userType === "tenant" ? "text-blue-300" : "text-amber-300"}`} />
                  </motion.span>
                </div>
                <p className="text-white/80 text-sm max-w-md mx-auto">
                  {info.description}
                </p>
              </div>
            </div>
          </motion.div>
          
          {/* Right Column - Sign In */}
          <motion.div
            key={`${userType}-signin`}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden"
          >
            <div className="p-6 md:p-8">
              {/* Animated One Tap Sign-In Badge */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="flex items-center justify-center mb-6"
              >
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-800/60 to-amber-700/40 border border-white/10 text-xs font-semibold text-white/80 shadow-sm animate-pulse">
                  <BsShieldLockFill className="w-4 h-4 text-blue-300" />
                  One Tap Sign-In
                  <HiOutlineSparkles className="w-4 h-4 text-amber-300" />
                </span>
              </motion.div>
              {error && (
                <div className="bg-red-900/20 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm mb-6">
                  {error}
                </div>
              )}
              <motion.div 
                className="flex flex-col gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={true}
                  className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-white/5 text-white border border-white/10 transition-all opacity-60 cursor-not-allowed`}
                  style={{ pointerEvents: "auto" }}
                >
                  <FcGoogle className="w-5 h-5" />
                  <span>Continue with Google</span>
                </button>
              </motion.div>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="text-center text-xs text-white/50 mt-6"
              >
                By continuing, you agree to our Terms of Service and Privacy Policy
              </motion.p>
            </div>
          </motion.div>
        </div>
      </div>
      {/* Coming Soon Modal */}
      <AnimatePresence>
        {showComingSoon && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="bg-gradient-to-br from-zinc-900 via-black to-zinc-800 border border-white/10 rounded-2xl shadow-2xl max-w-sm w-full p-8 flex flex-col items-center"
            >
              <div className="mb-4 flex flex-col items-center">
                <HiOutlineSparkles className="w-10 h-10 text-amber-400 mb-2 animate-bounce" />
                <h3 className="text-xl font-bold text-white mb-2 text-center">LakazHub is almost ready!</h3>
                <p className="text-white/80 text-center text-sm">
                  We&apos;re putting the final touches on our platform.<br />
                  Sign up will be available soon.<br />
                  Stay tuned for our official launch!
                </p>
              </div>
              <button
                className="mt-6 px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
                onClick={() => setShowComingSoon(false)}
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};