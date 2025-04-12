'use client';

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { FcGoogle } from "react-icons/fc";
import { motion } from "framer-motion";
import { FiUser, FiHome, FiMail, FiPhone, FiArrowRight } from "react-icons/fi";
import Modal from "./../layout/Modal";
import { signinWithGoogle, signinWithMagicLink } from "@/utils/actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Canvas Background Component
const CanvasBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Define dot properties
    interface Dot {
      x: number;
      y: number;
      size: number;
      opacity: number;
      speedX: number;
      speedY: number;
    }

    // Declare dots array before using it in functions
    let dots: Dot[] = [];
    
    // Set canvas dimensions
    const handleResize = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
        initDots();
      }
    };
    
    // Initialize dots
    function initDots() {
      if (!canvas) return;
      
      const dotCount = Math.min(Math.floor((canvas.width * canvas.height) / 12000), 40);
      dots = [];
      
      for (let i = 0; i < dotCount; i++) {
        dots.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 1,
          opacity: Math.random() * 0.15 + 0.1,
          speedX: (Math.random() - 0.5) * 0.4,
          speedY: (Math.random() - 0.5) * 0.4
        });
      }
    }

    // Animate dots
    function animateDots() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw dots
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        
        // Update position
        dot.x += dot.speedX;
        dot.y += dot.speedY;
        
        // Bounce off edges
        if (dot.x < 0 || dot.x > canvas.width) dot.speedX *= -1;
        if (dot.y < 0 || dot.y > canvas.height) dot.speedY *= -1;
        
        // Draw dot
        ctx.fillStyle = `rgba(255, 255, 255, ${dot.opacity})`;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
      }

      // Connect dots with lines
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x;
          const dy = dots[i].y - dots[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * (1 - distance / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.stroke();
          }
        }
      }
      
      requestAnimationFrame(animateDots);
    }

    handleResize();
    window.addEventListener('resize', handleResize);
    
    // Start animation
    initDots();
    animateDots();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full z-2 opacity-40"
    />
  );
};

export const SignupSection = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
  });
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [userType, setUserType] = useState<"tenant" | "landlord">("tenant");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [formMode, setFormMode] = useState<"signup" | "signin">("signup");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleUserTypeChange = (type: "tenant" | "landlord") => {
    setUserType(type);
  };

  const toggleFormMode = (mode: "signup" | "signin") => {
    setFormMode(mode);
    setError("");
  };

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signinWithMagicLink(
        null,
        formData.email,
        formMode === "signup" ? formData.fullName : "",
        formMode === "signup" ? formData.phoneNumber : "",
        userType
      );
      setModalMessage(formMode === "signup" 
        ? `Magic link sent! Check your email to complete signup as a ${userType}.` 
        : `Magic link sent! Check your email to sign in as a ${userType}.`);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error sending magic link:", error);
      setError("Failed to send magic link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
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
    <section id="signup" className="min-h-screen flex flex-col items-center bg-black text-white py-16 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      </div>
      
      {/* Floating design elements */}
      <motion.div
        animate={{ 
          y: [0, -15, 0],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ 
          duration: 10, 
          repeat: Infinity,
          repeatType: "reverse" 
        }}
        className="absolute top-20 right-20 w-64 h-64 rounded-full bg-white/5"
      ></motion.div>
      
      <motion.div
        animate={{ 
          y: [0, 15, 0],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ 
          duration: 12, 
          repeat: Infinity,
          repeatType: "reverse" 
        }}
        className="absolute bottom-20 left-20 w-80 h-80 rounded-full bg-white/5"
      ></motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-12 container relative z-10"
      >
        <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
          {formMode === "signup" ? "Join LakazHub Community" : "Welcome Back"}
        </h2>
        <p className="text-lg text-white/80 max-w-2xl mx-auto">
          {formMode === "signup" 
            ? "Find your perfect property or list your rental with ease. Connect with landlords and tenants in our growing community."
            : "Sign in to access your account and continue your property journey."}
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="container mx-auto relative z-10"
      >
        <div className="grid md:grid-cols-2 gap-8 items-stretch max-w-6xl mx-auto backdrop-blur-sm bg-white/5 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
          {/* Left Column - Role Visual */}
          <div className="relative order-2 md:order-1 h-full min-h-[450px] flex items-center justify-center p-8 bg-gradient-to-br from-white/10 to-transparent">
            <div className="relative w-full h-full rounded-xl overflow-hidden border border-white/20">
              {/* Image based on selected role */}
              <div className="absolute inset-0 z-0 rounded-xl">
                <Image
                  src={userType === "tenant" ? "/home5.png" : "/bg1.jpg"}
                  alt={userType === "tenant" ? "Tenant" : "Landlord"}
                  fill
                  priority
                  className="object-cover transition-all duration-700"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              
              {/* Dark overlay for better text visibility */}
              <div className="absolute inset-0 bg-black/70 z-1 rounded-xl"></div>
              
              {/* Canvas particle animation */}
              <CanvasBackground />
              
              {/* Gradient overlay for better text visibility */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70 z-5 rounded-xl"></div>
              
              {/* Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-6 text-center">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="mb-6"
                >
                  <div className="w-20 h-20 mx-auto rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                    {userType === 'tenant' ? (
                      <FiUser className="w-9 h-9 text-white" />
                    ) : (
                      <FiHome className="w-9 h-9 text-white" />
                    )}
                  </div>
                </motion.div>
                
                <motion.h3 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="text-2xl font-bold mb-2 text-white"
                >
                  {userType === 'tenant' ? 'Find Your Ideal Home' : 'List Your Properties'}
                </motion.h3>
                
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  className="text-white/80 mb-8 max-w-sm"
                >
                  {userType === 'tenant' 
                    ? 'Discover perfect rentals with virtual tours, secure payments, and streamlined applications.' 
                    : 'Manage listings, screen tenants, collect rent, and handle maintenance requests all in one place.'}
                </motion.p>

                {/* Display current role with highlight */}
                <div className="flex items-center justify-center gap-2 backdrop-blur-sm bg-white/10 border border-white/20 rounded-lg p-3">
                  <div className={`w-3 h-3 rounded-full ${userType === 'tenant' ? 'bg-blue-500' : 'bg-amber-500'}`}></div>
                  <p className="text-sm text-white">
                    {formMode === "signup" ? `Signing up` : `Signing in`} as a <span className="font-bold">{userType === 'tenant' ? 'Tenant' : 'Landlord'}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form Column */}
          <div className="flex items-center order-1 md:order-2 bg-black p-8 sm:p-10">
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="w-full"
            >
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-900/20 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm mb-6"
                >
                  {error}
                </motion.div>
              )}

              {/* Role Selection Tabs */}
              <motion.div variants={itemVariants} className="mb-6">
                <Tabs 
                  value={userType} 
                  onValueChange={(value) => handleUserTypeChange(value as "tenant" | "landlord")}
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-2 w-full bg-white/10 p-1">
                    <TabsTrigger 
                      value="tenant" 
                      className={`flex items-center gap-2 ${userType === "tenant" ? "bg-white text-black" : "bg-transparent text-white"}`}
                    >
                      <FiUser className="w-4 h-4" />
                      <span>Tenant</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="landlord"
                      className={`flex items-center gap-2 ${userType === "landlord" ? "bg-white text-black" : "bg-transparent text-white"}`}
                    >
                      <FiHome className="w-4 h-4" />
                      <span>Landlord</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </motion.div>

              <form onSubmit={handleSendMagicLink} className="space-y-4">
                {formMode === "signup" && (
                  <>
                    <motion.div variants={itemVariants} className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
                        <FiUser className="w-4 h-4" />
                      </div>
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        required={formMode === "signup"}
                        placeholder="Full Name"
                        value={formData.fullName}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all duration-200"
                      />
                    </motion.div>

                    <motion.div variants={itemVariants} className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
                        <FiPhone className="w-4 h-4" />
                      </div>
                      <input
                        id="phoneNumber"
                        name="phoneNumber"
                        type="tel"
                        required={formMode === "signup"}
                        placeholder="Phone Number"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all duration-200"
                      />
                    </motion.div>
                  </>
                )}

                <motion.div variants={itemVariants} className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
                    <FiMail className="w-4 h-4" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="Email address"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all duration-200"
                  />
                </motion.div>

                <motion.button
                  variants={itemVariants}
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 px-4 rounded-lg transition-all duration-300 font-medium disabled:opacity-50 flex items-center justify-center gap-2
                    ${userType === "tenant" ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-amber-500 hover:bg-amber-600 text-black"}`}
                >
                  {isLoading ? "Sending..." : (
                    <>
                      {formMode === "signup" ? `Sign Up as ${userType === 'tenant' ? 'Tenant' : 'Landlord'}` : `Sign In as ${userType === 'tenant' ? 'Tenant' : 'Landlord'}`}
                      <FiArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>

                {/* Toggle link between Sign in/Sign up */}
                <motion.div 
                  variants={itemVariants}
                  className="text-center mt-4 text-white/70"
                >
                  {formMode === "signup" ? (
                    <p>
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => toggleFormMode("signin")}
                        className={`font-medium hover:underline ${userType === "tenant" ? "text-blue-400" : "text-amber-400"}`}
                      >
                        Sign in
                      </button>
                    </p>
                  ) : (
                    <p>
                      Don't have an account?{" "}
                      <button
                        type="button"
                        onClick={() => toggleFormMode("signup")}
                        className={`font-medium hover:underline ${userType === "tenant" ? "text-blue-400" : "text-amber-400"}`}
                      >
                        Sign up
                      </button>
                    </p>
                  )}
                </motion.div>
              </form>

              <motion.div variants={itemVariants} className="relative mt-6 mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-black text-white/50">Or continue with</span>
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <button
                  onClick={async () => {
                    try {
                      setIsGoogleLoading(true);
                      await signinWithGoogle(userType);
                    } catch (error) {
                      console.error('Failed to sign in with Google:', error);
                      setError('Failed to sign in with Google. Please try again.');
                    } finally {
                      setIsGoogleLoading(false);
                    }
                  }}
                  disabled={isGoogleLoading}
                  className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-70
                    ${userType === "tenant" 
                      ? "bg-white/10 hover:bg-white/15 text-white border border-blue-500/30" 
                      : "bg-white/10 hover:bg-white/15 text-white border border-amber-500/30"}`}
                >
                  {isGoogleLoading ? (
                    <>
                      <div className={`w-5 h-5 border-2 border-t-transparent rounded-full animate-spin ${userType === "tenant" ? "border-blue-500" : "border-amber-500"}`}></div>
                      <span>Connecting to Google...</span>
                    </>
                  ) : (
                    <>
                      <FcGoogle className="w-5 h-5" />
                      <span>{formMode === "signup" ? `Sign up with Google as ${userType}` : `Sign in with Google as ${userType}`}</span>
                    </>
                  )}
                </button>
              </motion.div>

              <motion.p variants={itemVariants} className="text-center text-sm text-white/60 mt-6">
                By continuing, you agree to our <a href="#" className="text-white hover:underline">Terms of Service</a> and <a href="#" className="text-white hover:underline">Privacy Policy</a>.
              </motion.p>
            </motion.div>
          </div>
        </div>
      </motion.div>
      <Modal isOpen={isModalOpen} message={modalMessage} onClose={() => setIsModalOpen(false)} />
    </section>
  );
};