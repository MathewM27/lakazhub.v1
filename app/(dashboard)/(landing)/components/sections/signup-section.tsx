'use client';

import { useState, useCallback } from "react";
import { FcGoogle } from "react-icons/fc";
import { FiUser, FiHome, FiMail, FiPhone, FiArrowRight } from "react-icons/fi";
import dynamic from "next/dynamic";
import { signinWithGoogle, signinWithMagicLink } from "@/utils/actions";
import { motion } from "framer-motion";
import { useRouter } from 'next/navigation';

const Modal = dynamic(() => import("./../layout/Modal"), { ssr: false });

// Static backgrounds with CSS instead of canvas for better performance
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

export const SignupSection = () => {
  const router = useRouter();
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

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleUserTypeChange = useCallback((type: "tenant" | "landlord") => {
    setUserType(type);
  }, []);

  const toggleFormMode = useCallback((mode: "signup" | "signin") => {
    setFormMode(mode);
    setError("");
  }, []);

  const handleSendMagicLink = useCallback(async (e: React.FormEvent) => {
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
  }, [formData, formMode, userType]);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      setIsGoogleLoading(true);
      
      // First navigate to the loading screen, which gives immediate visual feedback
      router.push(`/auth/auth-loading?message=Connecting to Google&user_role=${userType}`);
      
      // Then initiate the Google sign-in process
      // The response will be handled by the callback route
      await signinWithGoogle(userType);
    } catch (error) {
      console.error('Failed to sign in with Google:', error);
      setError('Failed to sign in with Google. Please try again.');
      setIsGoogleLoading(false);
    }
  }, [userType, router]);

  return (
    <section id="signup" className="bg-black text-white py-16 relative overflow-hidden">
    
      <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black to-black/95"></div>
      <StaticBackground />
      
      <div className="container mx-auto px-4 relative z-10 max-w-5xl">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl font-bold text-center mb-10"
        >
          {formMode === "signup" ? "Join Our Community" : "Welcome Back"}
        </motion.h2>
        
        
        <div className="max-w-sm mx-auto mb-8">
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
        
        <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
          {/* Form section */}
          <div className="p-6 md:p-8">
            {error && (
              <div className="bg-red-900/20 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm mb-6">
                {error}
              </div>
            )}
            
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-sm font-semibold ${userType === 'tenant' ? 'text-blue-400' : 'text-amber-400'}`}>
                {formMode === "signup" ? "Create Account" : "Sign In"}
              </h3>
              
              <button
                type="button"
                onClick={() => toggleFormMode(formMode === "signup" ? "signin" : "signup")}
                className={`text-sm underline hover:text-opacity-80 ${
                  userType === "tenant" ? "text-blue-400" : "text-amber-400"
                }`}
              >
                {formMode === "signup" ? "Sign in?" : "Sign up?"}
              </button>
            </div>
            
            {/* Main Form */}
            <form onSubmit={handleSendMagicLink} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {formMode === "signup" && (
                  <>
                    <div className="relative">
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
                        className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all ${
                          userType === 'tenant' ? 'border-blue-500/30 focus:ring-blue-500/30' : 'border-amber-500/30 focus:ring-amber-500/30'
                        }`}
                      />
                    </div>

                    <div className="relative">
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
                        className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all ${
                          userType === 'tenant' ? 'border-blue-500/30 focus:ring-blue-500/30' : 'border-amber-500/30 focus:ring-amber-500/30'
                        }`}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="relative">
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
                  className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all ${
                    userType === 'tenant' ? 'border-blue-500/30 focus:ring-blue-500/30' : 'border-amber-500/30 focus:ring-amber-500/30'
                  }`}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 px-4 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-medium
                    ${userType === "tenant" 
                      ? "bg-blue-600 hover:bg-blue-700 text-white" 
                      : "bg-amber-500 hover:bg-amber-600 text-black"}`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      {formMode === "signup" 
                        ? `Continue with Email` 
                        : `Sign In with Email`}
                      <FiArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Improved separator */}
              <div className="flex items-center my-4">
                <div className="flex-grow h-px bg-white/10"></div>
                <span className="px-4 text-xs text-white/50">or</span>
                <div className="flex-grow h-px bg-white/10"></div>
              </div>

              {/* Google sign in */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all disabled:opacity-70"
              >
                {isGoogleLoading ? (
                  <>
                    <div className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin ${userType === "tenant" ? "border-blue-400" : "border-amber-400"}`}></div>
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <FcGoogle className="w-5 h-5" />
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              <p className="text-center text-xs text-white/50 mt-4">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>
            </form>
          </div>
        </div>
      </div>
      
      {isModalOpen && (
        <Modal isOpen={isModalOpen} message={modalMessage} onClose={() => setIsModalOpen(false)} />
      )}
    </section>
  );
};