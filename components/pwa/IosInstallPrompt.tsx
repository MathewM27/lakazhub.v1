"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

function isIos() {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isInStandaloneMode() {
  if (typeof window === "undefined") return false;
  // @ts-ignore
  return window.navigator.standalone === true;
}

// Track installs via localStorage
function isRecentlyDismissed() {
  if (typeof window === "undefined") return false;
  const lastDismissed = localStorage.getItem('lakazHubIosPromptDismissed');
  const dismissedTime = lastDismissed ? parseInt(lastDismissed) : 0;
  return Date.now() - dismissedTime < 3 * 24 * 60 * 60 * 1000; // 3 days
}

export default function IosInstallPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show on iOS, not in standalone mode, and not recently dismissed
    if (isIos() && !isInStandaloneMode() && !isRecentlyDismissed()) {
      // Short delay to avoid flickering on page load
      const timer = setTimeout(() => {
        setShow(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    // Remember dismissal for 3 days
    localStorage.setItem('lakazHubIosPromptDismissed', Date.now().toString());
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-black/90 border border-white/20 rounded-xl shadow-xl p-4 backdrop-blur-lg max-w-md mx-auto">
      <div className="flex items-center gap-3">
        {/* Use the existing apple-icon.png instead of a missing icon */}
        <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/20">
          <Image
            src="/apple-icon.png"
            alt="LakazHub"
            fill
            className="object-contain"
          />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white mb-1">Install LakazHub on your iPhone</h3>
          <p className="text-white/70 text-sm">
            Tap <span className="inline-block px-1 py-0.5 bg-white/10 rounded">Share</span> then <b>Add to Home Screen</b> in Safari.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="ml-2 px-2 py-1 text-white/60 hover:text-white text-xs"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
