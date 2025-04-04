import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/app/(dashboard)/landlord-dashboard/hooks/use-toast"
import { FormData, PropertyData, ROOM_TYPES, convertPropertyToFormData } from "./types"
import { ImageStorage } from "@/app/(dashboard)/landlord-dashboard/lib/utils/imageStorage"

import BasicInfoTab from "./tabs/BasicInfoTab"
import PhotosTab from "./tabs/PhotosTab"
import PricingTab from "./tabs/PricingTab"

interface PropertyFormTabsProps {
  property?: PropertyData;
  onSubmit: (formData: FormData, imageUrls: string[]) => Promise<void>;
  isSubmitting: boolean;
}

export default function PropertyFormTabs({ 
  property,
  onSubmit,
  isSubmitting 
}: PropertyFormTabsProps) {
  const [activeTab, setActiveTab] = useState("basic-info")
  const [uploadingImages, setUploadingImages] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const { toast } = useToast()
  
  // Initialize form with existing property data or defaults
  const [formData, setFormData] = useState<FormData>({
    name: "",
    location: "",
    type: "apartment",
    bedrooms: "1",
    bathrooms: "1",
    description: "",
    price: "",
    deposit: "",
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
    status: "active"
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
    try {
      setUploadingImages(true)
      
      // Filter images that need to be uploaded (have File objects)
      const imagesToUpload = formData.images.filter(img => img.file)
      
      // Get existing image URLs that don't need uploading
      const existingImageUrls = formData.images
        .filter(img => img.url && !img.file)
        .map(img => img.url as string)
      
      // If we have new images to upload
      let uploadedImageUrls: string[] = []
      if (imagesToUpload.length > 0) {
        // Group images by type
        const imagesByType = ROOM_TYPES.reduce((acc, roomType) => {
          acc[roomType] = imagesToUpload
            .filter(img => img.type === roomType)
            .map(img => img.file as File)
          return acc
        }, {} as Record<string, File[]>)
        
        // Generate a property ID for storage
        const propertyId = property?.id || `new-property-${Date.now()}`
        
        // Upload each group
        for (const [roomType, files] of Object.entries(imagesByType)) {
          if (files.length > 0) {
            try {
              // Update progress
              setUploadProgress(prev => prev + 10)
              
              // Upload the files for this room type
              const urls = await ImageStorage.uploadImages(
                `${propertyId}/${roomType.toLowerCase().replace(/\s+/g, '-')}`, 
                files,
                { 
                  onProgress: (progress: number) => {
                    setUploadProgress(Math.floor(progress))
                  }
                }
              )
              
              uploadedImageUrls = [...uploadedImageUrls, ...urls]
            } catch (error) {
              console.error(`Error uploading ${roomType} images:`, error)
              toast({
                title: `${roomType} Upload Error`,
                description: "Failed to upload some images. Please try again.",
                variant: "destructive"
              })
            }
          }
        }
      }
      
      // Combine existing and newly uploaded URLs
      const allImageUrls = [...existingImageUrls, ...uploadedImageUrls]
      
      // Submit the form with all image URLs
      await onSubmit(formData, allImageUrls)
      
    } catch (error) {
      console.error("Error in form submission:", error)
      toast({
        title: "Submission Error",
        description: "Failed to submit property. Please try again.",
        variant: "destructive" 
      })
    } finally {
      setUploadingImages(false)
      setUploadProgress(0)
    }
  }
  
  return (
    <Tabs 
      defaultValue="basic-info" 
      value={activeTab}
      onValueChange={handleTabChange}
      className="space-y-6"
    >
      <TabsList className="grid grid-cols-3 w-full">
        <TabsTrigger value="basic-info">Basic Info</TabsTrigger>
        <TabsTrigger value="photos">Photos</TabsTrigger>
        <TabsTrigger value="pricing">Pricing</TabsTrigger>
      </TabsList>
      
      <TabsContent value="basic-info">
        <BasicInfoTab 
          formData={formData}
          onChange={handleFormDataChange}
          onNext={handleNext}
        />
      </TabsContent>
      
      <TabsContent value="photos">
        <PhotosTab 
          formData={formData}
          onChange={handleFormDataChange}
          onNext={handleNext}
          onPrev={handlePrev}
        />
      </TabsContent>
      
      <TabsContent value="pricing">
        <PricingTab 
          formData={formData}
          onChange={handleFormDataChange}
          onPrev={handlePrev}
          onSubmit={handleSubmitFinal}
          isSubmitting={isSubmitting}
          isUploading={uploadingImages}
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