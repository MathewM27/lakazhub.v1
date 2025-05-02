import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FormData, PropertyData } from "./property-modal/types"
import PropertyFormTabs from "./property-modal/PropertyFormTabs"
import { supabase } from "../../lib/utils/supabase/client"
import { PropertyCache } from "../../lib/utils/cache/propertyCache"
import { Property } from "../../types"
import SuccessModal from "./success-modal"
import { useToast } from "../../hooks/use-toast"

interface PropertyModalProps {
  open: boolean
  onOpenChangeAction: (open: boolean) => void
  property?: Property
  onSuccess?: () => Promise<void> | void
}

export default function PropertyModal({
  open,
  onOpenChangeAction,
  property,
  onSuccess
}: PropertyModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingSuccess, setPendingSuccess] = useState<string>("")
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const { toast } = useToast() // Add this to fix the toast error

  // Handle form submission
  const handleSubmit = async (formData: FormData, imageUrls: string[]) => {
    // --- Validation for required fields ---
    const requiredPhotos = ["exterior", "bedroom", "bathroom", "kitchen", "living"];
    const missingPhotos = requiredPhotos.filter(type => !formData.images.some(img => img.type === type));
    if (!formData.monthly_rent || !formData.location || missingPhotos.length > 0) {
      toast({
        title: "Missing Required Fields",
        description: [
          !formData.monthly_rent ? "Monthly rent is required." : "",
          !formData.location ? "Location is required." : "",
          missingPhotos.length > 0 ? `Missing photo(s) for: ${missingPhotos.join(", ")}` : ""
        ].filter(Boolean).join(" "),
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true)
      console.log("[PropertyModal] Submitting property form data...", formData);

      // Process the form data to prepare for database
      const propertyData = {
        name: formData.name,
        location: formData.location,
        property_type: formData.property_type,
        bedrooms: parseInt(formData.bedrooms) || 1,
        bathrooms: parseInt(formData.bathrooms) || 1,
        description: formData.description,
        monthly_rent: parseFloat(formData.monthly_rent.toString().replace(/,/g, "")) || 0,
        security_deposit: parseFloat(formData.security_deposit.toString().replace(/,/g, "")) || 0,
        images: imageUrls,
        utilities: formData.utilities,
        available: formData.available,
        status: formData.status
      }

      // If we're editing an existing property
      if (property?.id) {
        console.log("[PropertyModal] Updating existing property...", property.id);

        // Update the property in Supabase
        const { error } = await supabase
          .from('properties')
          .update(propertyData)
          .eq('id', property.id)

        if (error) throw error

        // Update the property in cache
        PropertyCache.markPropertyUpdated(property.id)
        console.log("[PropertyModal] Property updated in cache.");

        // Set success message but don't close modal yet
        setPendingSuccess(`${formData.name || 'Property'} has been updated successfully.`)
        
      } else {
        console.log("[PropertyModal] Creating new property...", propertyData);

        // Add the property to Supabase
        const { data, error } = await supabase
          .from('properties')
          .insert([propertyData])
          .select()

        if (error) throw error

        // Clear the properties cache after creating a new property
        PropertyCache.clearCache() // Change from invalidateCache to clearCache
        console.log("[PropertyModal] Clearing properties cache after create...");

        // Set success message but don't close modal yet
        setPendingSuccess(`${formData.name || 'Property'} has been created successfully.`)
      }
      
    } catch (error) {
      console.error("[PropertyModal] Error submitting property:", error);
      // Handle error
    } finally {
      console.log("[PropertyModal] Submission finished.");
      setIsSubmitting(false)
    }
  }

  // Effect: when pendingSuccess is set, close property modal, run refresh, then show SuccessModal
  useEffect(() => {
    if (pendingSuccess) {
      const runSuccessSequence = async () => {
        try {
          // Don't close modal and run refresh at the same time
          // First close the property modal
          onOpenChangeAction(false);
          
          // Wait for animation to complete
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Run refresh if needed
          if (onSuccess) {
            console.log("[PropertyModal] Waiting before calling onSuccess to refresh properties...");
            await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
            console.log("[PropertyModal] Calling onSuccess to refresh properties...");
            await onSuccess();
            console.log("[PropertyModal] onSuccess (refresh) completed.");
          }
          
          // Now show the success modal
          setSuccessMessage(pendingSuccess);
          setShowSuccessModal(true);
          
          // Clear pending success
          setPendingSuccess("");
          
          console.log("[PropertyModal] Modal closed after save.");
        } catch (error) {
          console.error("[PropertyModal] Error handling success:", error);
        }
      };
      
      runSuccessSequence();
    }
  }, [pendingSuccess, onOpenChangeAction, onSuccess]);

  // Handle closing the success modal
  const handleSuccessModalClose = useCallback((open: boolean) => {
    setShowSuccessModal(open);
  }, []);

  // Convert Property to PropertyData to fix type error
  const convertedProperty: PropertyData | undefined = property ? {
    id: property.id,
    name: property.name || "",
    location: property.location || "",
    property_type: property.property_type || "apartment",
    bedrooms: property.bedrooms || 1,
    bathrooms: property.bathrooms || 1,
    description: property.description || "",
    monthly_rent: property.monthly_rent || 0,
    security_deposit: property.security_deposit || 0,
    images: property.images || [],
    utilities: property.utilities || {
      water: false,
      electricity: false,
      internet: false,
      gas: false,
      trash: false,
      cable: false
    },
    available: property.available !== undefined ? property.available : true,
    status: property.status || "active",
    created_at: property.created_at,
    user_id: property.landlord_id,
    existingImages: property.images || []
  } : undefined;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChangeAction}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {property ? "Edit" : "Add"} Property
            </DialogTitle>
          </DialogHeader>
          <PropertyFormTabs 
            property={convertedProperty} 
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      <SuccessModal
        open={showSuccessModal}
        onOpenChangeAction={handleSuccessModalClose}
        title="Success"
        message={successMessage}
        autoClose={true}
        autoCloseDelay={3000}
      />
    </>
  )
}