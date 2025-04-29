"use client"

import { CheckCircle2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

interface SuccessModalProps {
  open: boolean
  onOpenChangeAction: (open: boolean) => void
  title: string
  message: string
  actionCallback?: () => void
  actionLabel?: string
  autoClose?: boolean
  autoCloseDelay?: number
}

export default function SuccessModal({
  open,
  onOpenChangeAction,
  title,
  message,
  actionCallback,
  actionLabel = "Continue",
  autoClose = false, // Default to false for manual close
  // autoCloseDelay is ignored if autoClose is false
}: SuccessModalProps) {
  return (
    <Dialog 
      open={open} 
      onOpenChange={onOpenChangeAction}
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
            {actionCallback && (
              <Button onClick={() => {
                onOpenChangeAction(false);
                actionCallback();
              }}>
                {actionLabel}
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => onOpenChangeAction(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}