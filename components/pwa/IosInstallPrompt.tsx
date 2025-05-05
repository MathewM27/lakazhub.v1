import { useEffect, useState } from "react";

function isIos() {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isInStandaloneMode() {
  if (typeof window === "undefined") return false;
  // @ts-ignore
  return window.navigator.standalone === true;
}

export default function IosInstallPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isIos() && !isInStandaloneMode()) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-black/90 border border-white/20 rounded-xl shadow-xl p-4 backdrop-blur-lg max-w-md mx-auto">
      <div className="flex items-center gap-3">
        <img src="/icons/apple-touch-icon-120x120.png" alt="LakazHub" className="w-12 h-12 rounded-lg" />
        <div className="flex-1">
          <h3 className="font-semibold text-white mb-1">Install LakazHub on your iPhone</h3>
          <p className="text-white/70 text-sm">
            Tap <span className="inline-block px-1 py-0.5 bg-white/10 rounded">Share</span> then <b>Add to Home Screen</b> in Safari.
          </p>
        </div>
        <button
          onClick={() => setShow(false)}
          className="ml-2 px-2 py-1 text-white/60 hover:text-white text-xs"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
