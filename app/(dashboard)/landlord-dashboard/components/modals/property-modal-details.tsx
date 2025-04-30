import { useState, useEffect } from "react" 
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import PropertyOnboarding from "./property-modal/PropertyOnboarding"
import PropertyFormTabs from "./property-modal/PropertyFormTabs"
import { supabase } from "../../lib/utils/supabase/client"
import { PropertyCache } from "../../lib/utils/cache/propertyCache" // Adjust the path as needed
import { useToast } from "../../hooks/use-toast"
import { FormData, PropertyData } from "./property-modal/types" 
import SuccessModal from "../modals/success-modal"; // Add this import

// Define a proper type for the property object that extends PropertyData
interface Property extends PropertyData {
  [key: string]: unknown; // Use unknown instead of any for better type safety
}

interface PropertyDetailsModalProps {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  property?: Partial<Property>;
  onSuccess?: () => void;
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
  const [pendingSuccess, setPendingSuccess] = useState<null | string>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("Property created");

  // Reset modal state when it closes
  useEffect(() => {
    if (!open) {
      setOnboardingComplete(false)
    }
  }, [open])

  const handleStartForm = () => {
    setOnboardingComplete(true)
  }

  // Convert the property to PropertyData type for the form tabs
  const getPropertyDataForForm = (): PropertyData | undefined => {
    if (!property) return undefined;
    
    return {
      id: property.id || '',
      name: property.name || '',
      location: property.location || '',
      property_type: property.property_type || '',
      bedrooms: property.bedrooms || 0,
      bathrooms: property.bathrooms || 0,
      description: property.description || '',
      monthly_rent: property.monthly_rent || 0,
      security_deposit: property.security_deposit || 0,
      utilities: property.utilities || {
        water: false,
        electricity: false,
        internet: false,
        gas: false,
        trash: false,
        cable: false,
      },
      images: property.images || [],
      available: property.available ?? true,
      landlord_id: property.landlord_id || '',
      updated_at: property.updated_at || new Date().toISOString(),
      status: property.status || 'active',
      created_at: property.created_at || new Date().toISOString()
    };
  }

  // When SuccessModal closes, reset state
  const handleSuccessModalClose = (open: boolean) => {
    setShowSuccessModal(open);
    if (!open) {
      setSuccessMessage("");
      setPendingSuccess(null);
    }
  };

  const handleSubmit = async (formData: FormData, imageUrls: string[]) => {
    // --- Validation for required fields ---
    const requiredPhotos = ["exterior", "bedroom", "bathroom", "kitchen", "living"];
    const missingPhotos = requiredPhotos.filter(type => !formData.images.some(img => img.type === type));
    if (!formData.price || !formData.location || missingPhotos.length > 0) {
      toast({
        title: "Missing Required Fields",
        description: [
          !formData.price ? "Price is required." : "",
          !formData.location ? "Location is required." : "",
          missingPhotos.length > 0 ? `Missing photo(s) for: ${missingPhotos.join(", ")}` : ""
        ].filter(Boolean).join(" "),
        variant: "destructive"
      });
      return;
    }
    try {
      setIsSubmitting(true)
      console.log("[PropertyModal] Submitting property form data...", { formData, imageUrls });

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
      
      try {
        if (property?.id) {
          console.log("[PropertyModal] Updating existing property...", property.id, propertyData);
          // Update existing property
          const { error: updateError } = await supabase
            .from('properties')
            .update(propertyData)
            .eq('id', property.id)
          
          if (updateError) {
            throw new Error(`Failed to update property: ${updateError.message}`)
          }
          setPendingSuccess("Property updated");
          // Update cache
          console.log("[PropertyModal] Marking property updated in cache...", property.id);
          PropertyCache.markPropertyUpdated(property.id)
          
        } else {
          // Create new property with created_at timestamp
          const createData = {
            ...propertyData,
            created_at: new Date().toISOString(),
          }
          console.log("[PropertyModal] Creating new property...", createData);
          const { error: createError } = await supabase
            .from('properties')
            .insert(createData)
          
          if (createError) {
            throw new Error(`Failed to create property: ${createError.message}`)
          }
          setPendingSuccess("Property created");
          // Invalidate properties list cache
          console.log("[PropertyModal] Clearing properties cache after create...");
          PropertyCache.setProperties([], undefined)
        }

        // Success notification
        toast({
          title: "Success", 
          description: property?.id ? "Property updated successfully" : "Property created successfully"
        })

        // Add a small delay to ensure cache is cleared before refresh
        if (onSuccess) {
          console.log("[PropertyModal] Waiting before calling onSuccess to refresh properties...");
          await new Promise(res => setTimeout(res, 150));
          console.log("[PropertyModal] Calling onSuccess to refresh properties...");
          await onSuccess();
          console.log("[PropertyModal] onSuccess (refresh) completed.");
        }
        
        // Only close the modal after refresh is complete
        onOpenChangeAction(false);
        console.log("[PropertyModal] Modal closed after save.");
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown database error'
        toast({
          title: "Database Error",
          description: `Failed to save property details: ${errorMessage}`,
          variant: "destructive"
        })
        console.error("[PropertyModal] Error in DB operation:", errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast({
        title: "Error",
        description: `An unexpected error occurred: ${errorMessage}`,
        variant: "destructive"
      })
      console.error("[PropertyModal] Unexpected error:", errorMessage);
    } finally {
      setIsSubmitting(false)
      console.log("[PropertyModal] Submission finished.");
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
            await onSuccess();
          }
          
          // Now show the success modal
          setSuccessMessage(pendingSuccess);
          setShowSuccessModal(true);
        } catch (error) {
          console.error("Error handling success:", error);
        }
      };
      
      runSuccessSequence();
    }
  }, [pendingSuccess, onOpenChangeAction, onSuccess]);

  return (
    <>
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
              property={getPropertyDataForForm()} 
              onSubmit={handleSubmit} 
              isSubmitting={isSubmitting} 
              onSuccess={onSuccess}
            />
          )}
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