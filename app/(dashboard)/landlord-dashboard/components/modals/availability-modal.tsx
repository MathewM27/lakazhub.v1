"use client"

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarIcon, Clock, Home, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { supabase } from "../../lib/utils/supabase/client";
import { useToast } from "../../hooks/use-toast";
import { Property } from "../../types";

interface AvailabilityModalProps {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  property?: Property; // Using the Property type instead of any
  onUpdate?: () => void; // Add callback for when updates are successful
}

export default function AvailabilityModal({ 
  open, 
  onOpenChangeAction,
  property,
  onUpdate
}: AvailabilityModalProps) {
  const [step, setStep] = useState(0);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<string>("available");
  const [nextAvailableDate, setNextAvailableDate] = useState<Date | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  
  // Onboarding slides content
  const onboardingSlides = [
    {
      title: "Property Availability",
      description: "Set whether your property is currently available.",
      icon: <Home className="h-12 w-12 mb-4" />,
    },
    {
      title: "Next Available Date",
      description: "If your property is rented, set when it will be available again.",
      icon: <Clock className="h-12 w-12 mb-4" />,
    }
  ];
  
  // Load property data when modal opens
  useEffect(() => {
    if (property && open) {
      // Set initial status based on property
      setAvailabilityStatus(property.available ? "available" : "rented");
      
      // Set next available date if it exists
      if (property.next_available_date) {
        setNextAvailableDate(new Date(property.next_available_date));
      }
    }
  }, [property, open]);

  // Auto-advance onboarding slides
  useEffect(() => {
    if (!onboardingComplete && open) {
      const timer = setTimeout(() => {
        if (step < onboardingSlides.length - 1) {
          setStep(step + 1);
        } else {
          setOnboardingComplete(true);
        }
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [step, onboardingComplete, open, onboardingSlides.length]); // Added onboardingSlides.length dependency

  const handleStartForm = () => {
    setOnboardingComplete(true);
  };

  const resetModal = () => {
    setStep(0);
    setOnboardingComplete(false);
    setAvailabilityStatus("available");
    setNextAvailableDate(undefined);
  };

  // Reset modal state when it closes
  useEffect(() => {
    if (!open) {
      resetModal();
    }
  }, [open]);

  // Save availability settings
  const handleSaveAvailability = async () => {
    if (!property?.id) return;
    
    setSaving(true);
    
    try {
      // Prepare the update data
      const isAvailable = availabilityStatus === "available";
      
      // Using a proper type for the update data
      interface PropertyUpdateData {
        available: boolean;
        status: 'active' | 'rented';
        next_available_date: string | null;
      }
      
      const updateData: PropertyUpdateData = {
        available: isAvailable,
        status: isAvailable ? "active" : "rented",
        next_available_date: null
      };
      
      // Only include next_available_date if the property is rented
      if (!isAvailable && nextAvailableDate) {
        updateData.next_available_date = nextAvailableDate.toISOString();
      }
      
      // Update the property in Supabase
      const { error } = await supabase
        .from('properties')
        .update(updateData)
        .eq('id', property.id);
        
      if (error) throw error;
      
      toast({
        title: "Availability updated",
        description: `${property.name || 'Property'} availability has been updated.`,
      });
      
      // Call the update callback if provided
      if (onUpdate) onUpdate();
      
      // Close the modal
      onOpenChangeAction(false);
    } catch (error) {
      console.error('Error updating availability:', error);
      toast({
        title: "Update failed",
        description: "There was an error updating the property availability.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {!onboardingComplete
              ? "Set Property Availability"
              : `Set Availability for ${property?.name || "Your Property"}`}
          </DialogTitle>
          <DialogDescription>
            {!onboardingComplete
              ? "Follow these steps to set your property's availability"
              : "Configure if your property is available for rent"} 
          </DialogDescription>
        </DialogHeader>

        {!onboardingComplete ? (
          // Onboarding view - your existing code
          <div className="py-8">
            <AnimatePresence initial={false}>
              {open && (
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
              )}
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
              <Button onClick={handleStartForm}>Set Availability</Button>
            </div>
          </div>
        ) : (
          // Main form content
          <div className="grid md:grid-cols-2 gap-6 py-4">
            <div className="hidden md:block">
              <div
                className="h-full rounded-lg bg-cover bg-center flex items-center justify-center"
                style={{
                  backgroundImage: `url(${property?.images?.[0] || "/placeholder.svg?height=400&width=300"})`,
                  backgroundBlendMode: "overlay",
                  backgroundColor: "rgba(0, 0, 0, 0.4)",
                }}
              >
                <div className="text-center text-white p-6">
                  <Clock className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Set Property Availability</h3>
                  <p className="text-sm opacity-80">
                    {availabilityStatus === "available" 
                      ? "Your property is set as available for rent" 
                      : "Your property is currently rented out"}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <Label className="text-base">Availability Status</Label>
                <RadioGroup 
                  value={availabilityStatus}
                  onValueChange={setAvailabilityStatus}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="available" id="available" />
                    <Label htmlFor="available">Available for Rent</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="rented" id="rented" />
                    <Label htmlFor="rented">Currently Rented</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Show date picker only if property is set to "rented" */}
              {availabilityStatus === "rented" && (
                <div>
                  <Label className="text-base">Next Available Date</Label>
                  <div className="mt-2 border rounded-md p-4">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {nextAvailableDate 
                            ? format(nextAvailableDate, "PPP") 
                            : "When will it be available again?"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar 
                          mode="single" 
                          selected={nextAvailableDate} 
                          onSelect={setNextAvailableDate} 
                          initialFocus 
                          disabled={(date) => date < new Date()} // Disable past dates
                        />
                      </PopoverContent>
                    </Popover>
                    
                    {nextAvailableDate && (
                      <div className="mt-2 flex items-center justify-between bg-secondary p-2 rounded-md">
                        <span className="text-sm">
                          Available from: {format(nextAvailableDate, "PPP")}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setNextAvailableDate(undefined)}
                        >
                          <X className="h-3 w-3" />
                          <span className="sr-only">Clear date</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Button 
                className="w-full" 
                onClick={handleSaveAvailability}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Availability"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
