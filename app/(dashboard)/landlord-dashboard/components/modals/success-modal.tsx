"use client"

import { useState, useEffect } from "react"
import { CheckCircle2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

interface SuccessModalProps {
  open: boolean
  onOpenChangeAction: (open: boolean) => void // Renamed here
  title: string
  message: string
  actionCallback?: () => void // Renamed to avoid same issue
  actionLabel?: string
  autoClose?: boolean
  autoCloseDelay?: number
}

export default function SuccessModal({
  open,
  onOpenChangeAction, // Updated parameter name
  title,
  message,
  actionCallback, // Updated parameter name
  actionLabel = "Continue",
  autoClose = true,
  autoCloseDelay = 3000,
}: SuccessModalProps) {
  const [countdown, setCountdown] = useState(autoCloseDelay / 1000)
  
  // Auto close and countdown
  useEffect(() => {
    if (!open || !autoClose) return;
    
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1));
    }, 1000);
    
    // Auto close timer
    const closeTimer = setTimeout(() => {
      onOpenChangeAction(false); // Updated reference here
    }, autoCloseDelay);
    
    // Clean up timers when component unmounts or when modal closes
    return () => {
      clearInterval(timer);
      clearTimeout(closeTimer);
    };
  }, [open, autoClose, autoCloseDelay, onOpenChangeAction]); // Updated dependency here
  
  // Reset countdown when modal opens
  useEffect(() => {
    if (open) {
      setCountdown(Math.floor(autoCloseDelay / 1000));
    }
  }, [open, autoCloseDelay]);

  return (
    <Dialog 
      open={open} 
      onOpenChange={onOpenChangeAction} // Updated here - this is crucial!
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
          </motion.div>
          
          <p className="text-center text-muted-foreground mb-6">{message}</p>
          
          <div className="flex gap-4">
            {actionCallback && ( // Updated reference here
              <Button onClick={() => {
                onOpenChangeAction(false); // Updated reference here
                actionCallback(); // Updated reference here
              }}>
                {actionLabel}
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={() => onOpenChangeAction(false)} // Updated reference here
            >
              {autoClose && countdown > 0 ? `Close (${countdown})` : "Close"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}