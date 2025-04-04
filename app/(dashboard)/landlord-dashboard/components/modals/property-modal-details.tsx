import { useState, useEffect } from "react" // Ensure useEffect is imported
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import PropertyOnboarding from "./property-modal/PropertyOnboarding"
import PropertyFormTabs from "./property-modal/PropertyFormTabs"
import { supabase } from "../../lib/utils/supabase/client"
import { useToast } from "../../hooks/use-toast"

import { FormData } from "./property-modal/types" // Import the FormData type
interface PropertyDetailsModalProps {
  open: boolean
  onOpenChangeAction: (open: boolean) => void
  property?: any
  onSuccess?: () => void
}

export default function PropertyModal({ 
  open, 
  onOpenChangeAction, 
  property, 
  onSuccess 
}: PropertyDetailsModalProps) {
  const [onboardingComplete, setOnboardingComplete] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  
  // Reset modal state when it closes
  useEffect(() => {
    if (!open) {
      setOnboardingComplete(false)
    }
  }, [open])

  const handleStartForm = () => {
    setOnboardingComplete(true)
  }

  const handleSubmit = async (formData: FormData, imageUrls: string[]) => {
    try {
      setIsSubmitting(true)
      
      // Get current user session for landlord_id
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to add a property",
          variant: "destructive"
        })
        return
      }
      
      const landlordId = session.user.id
      
      // Format property data for database
      const propertyData = {
        name: formData.name || "Untitled Property",
        location: formData.location || "downtown",
        property_type: formData.type || "apartment",
        bedrooms: parseInt(formData.bedrooms) || 1,
        bathrooms: parseFloat(formData.bathrooms) || 1,
        description: formData.description || "",
        monthly_rent: parseFloat(formData.price) || 0,
        security_deposit: parseFloat(formData.deposit || "0"),
        utilities: formData.utilities,
        images: imageUrls,
        available: true,
        landlord_id: landlordId,
        updated_at: new Date().toISOString(),
        status: 'active' as const
      }
      
      let result
      
      try {
        if (property?.id) {
          // Update existing property
          const { data, error } = await supabase
            .from('properties')
            .update(propertyData)
            .eq('id', property.id)
            .select()
            .single()
            
          if (error) throw error
          result = data
        } else {
          // Create new property
          const { data, error } = await supabase
            .from('properties')
            .insert([propertyData])
            .select()
            .single()
            
          if (error) throw error
          result = data
        }
        
        // Success notification
        toast({
          title: "Success", 
          description: property?.id ? "Property updated successfully" : "Property created successfully"
        })
        
        // Call success callback to refresh the property list
        if (onSuccess) {
          onSuccess()
        }
        
        // Close the modal
        onOpenChangeAction(false)
        
      } catch (error) {
        console.error("Database operation failed:", error)
        toast({
          title: "Database Error",
          description: "Failed to save property details. Please try again.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error submitting property:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="w-full max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {!onboardingComplete
              ? "Welcome to Property Submission"
              : property
                ? "Edit Property Details"
                : "Add New Property"}
          </DialogTitle>
          <DialogDescription>
            {!onboardingComplete
              ? "Follow these steps to list your property on LakazHub"
              : "Fill in the details below to list your property"}
          </DialogDescription>
        </DialogHeader>

        {!onboardingComplete ? (
          <PropertyOnboarding onComplete={handleStartForm} />
        ) : (
          <PropertyFormTabs 
            property={property} 
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting} 
          />
        )}
        
        
      </DialogContent>
    </Dialog>
  )
}