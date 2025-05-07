import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/app/(dashboard)/landlord-dashboard/hooks/use-toast"
import { FormData, PropertyData, convertPropertyToFormData } from "./types"
import { PropertyCache } from "../../../lib/utils/cache/propertyCache"; // Add this import

import BasicInfoTab from "./tabs/BasicInfoTab"
import PhotosTab from "./tabs/PhotosTab"
import PricingTab from "./tabs/PricingTab"

interface PropertyFormTabsProps {
  property?: PropertyData;
  onSubmit: (formData: FormData, imageUrls: string[]) => Promise<void>;
  isSubmitting: boolean;
  onSuccess?: () => void; // Add this prop for refreshing properties
}

export default function PropertyFormTabs({ 
  property,
  onSubmit,
  isSubmitting,
  onSuccess 
}: PropertyFormTabsProps) {
  const [activeTab, setActiveTab] = useState("basic-info")
  const [uploadingImages, setUploadingImages] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const { toast } = useToast()
  
  // Initialize form with existing property data or defaults
  const [formData, setFormData] = useState<FormData>({
    name: "",
    location: "",
    property_type: "apartment", // Changed from 'type' to 'property_type'
    bedrooms: "1",
    bathrooms: "1",
    description: "",
    monthly_rent: "", // Changed from 'price' to 'monthly_rent'
    security_deposit: "", // Changed from 'deposit' to 'security_deposit'
    utilities: {
      water: false,
      electricity: false,
      internet: false,
      gas: false,
      trash: false,
      cable: false,
    },
    images: [],
    available: true,
    status: "active",
    phone_number: "", // Initialize phone number field with empty string
  })
  
  // Load property data if editing
  useEffect(() => {
    if (property) {
      setFormData(convertPropertyToFormData(property))
    }
  }, [property])
  
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab)
  }
  
  const handleNext = () => {
    if (activeTab === "basic-info") {
      setActiveTab("photos")
    } else if (activeTab === "photos") {
      setActiveTab("pricing")
    }
  }
  
  const handlePrev = () => {
    if (activeTab === "pricing") {
      setActiveTab("photos")
    } else if (activeTab === "photos") {
      setActiveTab("basic-info")
    }
  }
  
  const handleFormDataChange = (newData: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...newData }))
  }
  
  const handleSubmitFinal = async () => {
    // --- Validation for required fields ---
    const requiredPhotos = ["exterior", "bedroom", "bathroom", "kitchen", "living"];
    const missingPhotos = requiredPhotos.filter(type => !formData.images.some(img => img.type === type));
    if (!formData.monthly_rent || !formData.location || missingPhotos.length > 0) { // Changed from 'price' to 'monthly_rent'
      toast({
        title: "Missing Required Fields",
        description: [
          !formData.monthly_rent ? "Monthly rent is required." : "", // Changed from 'price' to 'monthly_rent'
          !formData.location ? "Location is required." : "",
          missingPhotos.length > 0 ? `Missing photo(s) for: ${missingPhotos.join(", ")}` : ""
        ].filter(Boolean).join(" "),
        variant: "destructive"
      });
      return;
    }

    try {
      setUploadingImages(true)
      
      // Comment out console logs
      // console.log('Starting property submission process');
      // console.log('Form data:', JSON.stringify(formData, null, 2));
      
      // Fix: We need to treat the images differently since JSON.stringify doesn't handle File objects properly
      // The images are showing up as empty objects in the logs but they are valid File objects
      const imagesToUpload = formData.images
        .filter(img => img.file instanceof File || (typeof img.file === 'object' && img.file !== null))
        .map(img => ({
          file: img.file as File,
          type: img.type
        }));
      
      // Comment out console logs
      // console.log(`Found ${imagesToUpload.length} images to upload`, 
      //   imagesToUpload.map(img => `${img.type}: ${(img.file as File).name}`));
      
      // Get existing image URLs that don't need uploading
      const existingImageUrls = formData.images
        .filter(img => img.url && typeof img.url === 'string' && img.url.startsWith('http'))
        .map(img => img.url as string);
      
      // Comment out console logs
      // console.log(`Existing image URLs: ${existingImageUrls.length}`);
      
      // If we have new images to upload
      let uploadedImageUrls: string[] = [];
      if (imagesToUpload.length > 0) {
        // Fix: Create a proper mapping of image types to files
        const imagesByType: Record<string, File[]> = {};
        
        // Initialize all recognized room types
        ["exterior", "bedroom", "bathroom", "kitchen", "living", "other"].forEach(type => {
          imagesByType[type] = [];
        });
        
        // Add files to their respective categories
        imagesToUpload.forEach(img => {
          if (img.file instanceof File) {
            // Ensure the category exists in our map
            if (!imagesByType[img.type]) {
              imagesByType[img.type] = [];
            }
            imagesByType[img.type].push(img.file);
          }
        });
        
        // Comment out console logs
        // console.log('Images grouped by room type:', 
        //   Object.entries(imagesByType).map(([type, files]) => 
        //     `${type}: ${files.length} files ${files.length > 0 ? `(${files[0]?.name || 'unnamed'})` : ''}`
        //   )
        // );
        
        // Generate a property ID for storage
        const propertyId = property?.id || `new-property-${Date.now()}`;
        // console.log(`Using property ID for storage: ${propertyId}`);
        
        // Upload each group of images
        for (const [roomType, files] of Object.entries(imagesByType)) {
          if (files.length > 0) {
            try {
              // Update progress
              setUploadProgress(prev => prev + 10);
              
              // Comment out console logs
              // console.log(`Uploading ${files.length} files for room type: ${roomType}`);
              // console.log('File objects:', files.map(f => `${f.name} (${f.size} bytes)`));
              
              // Import ImageStorage here to ensure it's available
              const { ImageStorage } = await import('../../../lib/utils/imageStorage');
              
              // Upload files without compression
              const urls = await ImageStorage.uploadImages(
                propertyId, 
                files,
                { 
                  roomType: roomType,
                  compress: false, // Disable compression completely
                  onProgress: (progress: number) => {
                    setUploadProgress(Math.floor(progress));
                  }
                }
              );
              
              // Comment out console logs
              // console.log(`Upload complete for ${roomType}. Received URLs:`, urls);
              uploadedImageUrls = [...uploadedImageUrls, ...urls];
            } catch (error) {
              console.error(`Error uploading ${roomType} images:`, error);
              toast({
                title: `${roomType} Upload Error`,
                description: "Failed to upload some images. Please try again with smaller files.",
                variant: "destructive"
              });
            }
          }
        }
      }
      
      // Check if we have any successful uploads before proceeding
      if (imagesToUpload.length > 0 && uploadedImageUrls.length === 0) {
        // All uploads failed, but we'll still create the property
        // console.warn("All image uploads failed, continuing with property creation without images");
        toast({
          title: "Image Upload Warning",
          description: "Images couldn't be uploaded due to size limitations. Please try with smaller images (under 2MB) or resize them before uploading.",
          variant: "default"
        });
      }
      
      // Combine existing and newly uploaded URLs
      const allImageUrls = [...existingImageUrls, ...uploadedImageUrls];
      
      // No need for field mapping anymore since our field names match the database
      // Submit the form with all image URLs
      await onSubmit(formData, allImageUrls);
      
      // Do not call onSuccess here - parent component will handle it
      // after setting pendingSuccess
      
      // Mark property as updated in cache if we're editing an existing property
      if (property?.id) {
        PropertyCache.markPropertyUpdated(property.id);
      }
      
    } catch (error) {
      toast({
        title: "Submission Error",
        description: "Failed to submit property. Please try again.",
        variant: "destructive" 
      });
      console.error("Error submitting property:", error);
    } finally {
      setUploadingImages(false);
      setUploadProgress(0);
    }
  }
  
  // --- Compute required fields for enabling submit ---
  const requiredPhotos = ["exterior", "bedroom", "bathroom", "kitchen", "living"];
  const missingPhotos = requiredPhotos.filter(type => !formData.images.some(img => img.type === type));
  const canSubmit =
    !!formData.monthly_rent && // Changed from 'price' to 'monthly_rent'
    !!formData.location &&
    missingPhotos.length === 0;
  
  return (
    <Tabs 
      defaultValue="basic-info" 
      value={activeTab}
      onValueChange={handleTabChange}
      className="space-y-4"
    >
      <TabsList className="grid grid-cols-3 w-full">
        <TabsTrigger value="basic-info">Basic Info</TabsTrigger>
        <TabsTrigger value="photos">Photos</TabsTrigger>
        <TabsTrigger value="pricing">Pricing</TabsTrigger>
      </TabsList>
      
      <TabsContent value="basic-info" className="max-h-[60vh] overflow-y-auto pr-1">
        <BasicInfoTab 
          formData={formData}
          onChange={handleFormDataChange}
          onNext={handleNext}
        />
      </TabsContent>
      
      <TabsContent value="photos" className="max-h-[60vh] overflow-y-auto pr-1">
        <PhotosTab 
          formData={formData}
          onChange={handleFormDataChange}
          onNext={handleNext}
          onPrev={handlePrev}
        />
      </TabsContent>
      
      <TabsContent value="pricing" className="max-h-[60vh] overflow-y-auto pr-1">
        <PricingTab 
          formData={formData}
          onChange={handleFormDataChange}
          onPrev={handlePrev}
          onSubmit={handleSubmitFinal}
          isSubmitting={isSubmitting}
          isUploading={uploadingImages}
          canSubmit={canSubmit}
        />
        
        {uploadingImages && (
          <div className="mt-4">
            <div className="text-sm text-muted-foreground mb-2">
              Uploading images: {uploadProgress}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-primary h-2.5 rounded-full" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}