import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Home, Camera, Banknote } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PropertyOnboardingProps {
  onComplete: () => void
}

export default function PropertyOnboarding({ onComplete }: PropertyOnboardingProps) {
  const [step, setStep] = useState(0)
  
  // Onboarding slides content
  const onboardingSlides = [
    {
      title: "Property Details",
      description: "Fill in details about your property.",
      icon: <Home className="h-12 w-12 mb-4" />,
    },
    {
      title: "Upload Photos",
      description: "Add high-quality photos to attract tenants.",
      icon: <Camera className="h-12 w-12 mb-4" />,
    },
    {
      title: "Set Pricing",
      description: "Set rental price and additional utilities.",
      icon: <Banknote className="h-12 w-12 mb-4" />,
    },
  ]
  
  // Auto-advance slides
  useEffect(() => {
    const timer = setTimeout(() => {
      if (step < onboardingSlides.length - 1) {
        setStep(step + 1)
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [step, onboardingSlides.length])
  
  return (
    <div className="py-8">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center text-center"
        >
          {onboardingSlides[step].icon}
          <h3 className="text-xl font-semibold mb-2">{onboardingSlides[step].title}</h3>
          <p className="text-muted-foreground mb-6">{onboardingSlides[step].description}</p>
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-center mt-6">
        {onboardingSlides.map((_, index) => (
          <div
            key={index}
            className={`h-2 w-2 rounded-full mx-1 ${index === step ? "bg-primary" : "bg-gray-200"}`}
          />
        ))}
      </div>

      <div className="flex justify-center mt-8">
        <Button onClick={onComplete}>Get Started</Button>
      </div>
    </div>
  )
}