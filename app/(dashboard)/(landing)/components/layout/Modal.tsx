import React, { useEffect } from 'react';
import { Check, AlertCircle, X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
  type?: 'success' | 'error';
}

const Modal: React.FC<ModalProps> = ({ isOpen, message, onClose, type = 'success' }) => {
  // Close modal with escape key
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    
    document.addEventListener('keydown', handleEscKey);
    
    // Lock body scroll when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-black border border-white/10 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with icon */}
        <div className={`flex justify-center pt-8 ${type === 'success' ? 'text-blue-500' : 'text-red-500'}`}>
          <div className={`w-16 h-16 rounded-full ${type === 'success' ? 'bg-blue-500/20' : 'bg-red-500/20'} flex items-center justify-center`}>
            {type === 'success' ? (
              <Check className="w-8 h-8" />
            ) : (
              <AlertCircle className="w-8 h-8" />
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="px-6 pt-6 pb-8 text-center">
          <h2 className="text-xl font-bold text-white mb-2">
            {type === 'success' ? 'Magic Link Sent' : 'Something went wrong'}
          </h2>
          
          <p className="text-white/70 mb-6">
            {message}
          </p>
          
          <button
            onClick={onClose}
            className={`w-full py-3 px-4 rounded-lg transition-all font-medium 
              ${type === 'success' 
                ? "bg-blue-600 hover:bg-blue-700 text-white" 
                : "bg-red-600 hover:bg-red-700 text-white"
              }`}
          >
            Close
          </button>
        </div>
        
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors p-1"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <style jsx global>{`
        @keyframes scaleIn {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        .animate-scale-in {
          animation: scaleIn 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Modal;
