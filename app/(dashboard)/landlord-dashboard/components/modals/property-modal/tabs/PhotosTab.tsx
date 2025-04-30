import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { FormData } from "../types"
import { Camera, Info, Edit, Trash2 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Image from "next/image"
import { ImageStorage } from "@/app/(dashboard)/landlord-dashboard/lib/utils/imageStorage"
import { supabase } from "@/app/(dashboard)/landlord-dashboard/lib/utils/supabase/client" // Add supabase import

interface PhotosTabProps {
  formData: FormData
  onChange: (formData: Partial<FormData>) => void
  onNext: () => void
  onPrev: () => void
  propertyId?: string // Add propertyId prop for existing properties
}

// Room categories with display names and limits
const ROOM_CATEGORIES = [
  { id: "exterior", displayName: "Cover Photo", limit: 1, description: "Main exterior photo (displayed to tenants)", primary: true },
  { id: "living", displayName: "Living Room", limit: 1, description: "Main living area" },
  { id: "kitchen", displayName: "Kitchen", limit: 1, description: "Kitchen area" },
  { id: "bedroom", displayName: "Bedroom", limit: 1, description: "Main bedroom" },
  { id: "bathroom", displayName: "Bathroom", limit: 1, description: "Main bathroom" },
  { id: "other", displayName: "Other Photos", limit: 5, description: "Additional property photos", allowMultiple: true }
]

export default function PhotosTab({
  formData,
  onChange,
  onNext,
  onPrev,
  propertyId
}: PhotosTabProps) {
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  
  // Group images by category
  const imagesByCategory = ROOM_CATEGORIES.reduce((acc, category) => {
    acc[category.id] = formData.images.filter(img => img.type === category.id)
    return acc
  }, {} as Record<string, typeof formData.images>)

  // Add a file to a specific category
  const handleFileSelected = (category: string, files: FileList | null) => {
    if (!files || files.length === 0) return

    // Convert FileList to array and filter for images only
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
    if (imageFiles.length === 0) return;

    // Find category config
    const categoryConfig = ROOM_CATEGORIES.find(c => c.id === category)
    if (!categoryConfig) return;

    // Get current images for this category
    const currentImages = formData.images.filter(img => img.type === category)

    // Calculate remaining slots
    const limit = categoryConfig.limit
    const remaining = limit - currentImages.length
    
    if (remaining <= 0) return;
    
    // Add new images (limiting to available slots)
    let newImagesToAdd: File[] = []

    // Handle primary images differently (replace instead of add)
    if (categoryConfig.primary) {
      // For primary categories, replace the existing image
      if (currentImages.length > 0) {
        // Remove the existing image
        const updatedImages = formData.images.filter(img => img.type !== category)
        
        // Add the new image (just the first one if multiple selected)
        const newImage = {
          file: imageFiles[0],
          type: category,
          url: URL.createObjectURL(imageFiles[0])
        }
        
        onChange({
          images: [...updatedImages, newImage]
        })
        return
      }
      
      // Limit to remaining slots
      newImagesToAdd = imageFiles.slice(0, limit - currentImages.length)
    } else {
      // For multiple categories, limit to remaining slots
      newImagesToAdd = imageFiles.slice(0, limit - currentImages.length)
    }

    // Create new images to add
    const newImages = newImagesToAdd.map(file => ({
      file,
      type: category,
      url: URL.createObjectURL(file)
    }));

    // Update form data with new images
    onChange({
      images: [...formData.images, ...newImages]
    })
  }

  const handleRemoveImage = async (index: number) => {
    setIsLoading(true);
    try {
      const imageToRemove = formData.images[index];
      const newImages = [...formData.images];
      
      // If it's an existing image from the database, we need to delete it from storage
      if (imageToRemove.existingUrl && propertyId) {
        try {
          // Get current user session for authorization
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.id && imageToRemove.url) { // Add null check for url
            // Delete the image from storage
            await ImageStorage.deleteImage(imageToRemove.url, session.user.id);
          }
        } catch (error) {
          console.error("Failed to delete image from storage:", error);
          // Continue with UI removal even if storage delete fails
        }
      }
      
      // If the image has a URL created with createObjectURL, revoke it
      if (newImages[index].url && !newImages[index].existingUrl && typeof newImages[index].url === 'string' && newImages[index].url.startsWith('blob:')) {
        URL.revokeObjectURL(newImages[index].url as string);
      }
      
      newImages.splice(index, 1);
      onChange({ images: newImages });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle drag events
  const handleDragOver = (e: React.DragEvent, category: string) => {
    e.preventDefault()
    setDragOver(category)
  }

  const handleDragLeave = () => {
    setDragOver(null)
  }

  const handleDrop = (e: React.DragEvent, category: string) => {
    e.preventDefault()
    setDragOver(null)
    handleFileSelected(category, e.dataTransfer.files)
  }

  // Helper functions
  const getCategoryRemainingSlots = (categoryId: string) => {
    const category = ROOM_CATEGORIES.find(c => c.id === categoryId)
    if (!category) return 0
    
    const currentCount = formData.images.filter(img => img.type === categoryId).length
    return category.limit - currentCount
  }

  const getCategoryStatusText = (categoryId: string) => {
    const remaining = getCategoryRemainingSlots(categoryId)
    const category = ROOM_CATEGORIES.find(c => c.id === categoryId)
    
    if (!category) return ''
    
    if (category.allowMultiple) {
      return remaining > 0 
        ? `Add up to ${remaining} more photos` 
        : 'Maximum photos reached'
    }
    
    return remaining > 0 
      ? 'Click to add photo' 
      : 'Photo added (click to replace)'
  }

  const getTotalPhotoCount = () => {
    return formData.images.length
  }

  const getOverallProgressPercentage = () => {
    // Count categories that have at least one photo
    const filledCategories = ROOM_CATEGORIES.filter(category => 
      formData.images.some(img => img.type === category.id)
    ).length
    
    return Math.round((filledCategories / ROOM_CATEGORIES.length) * 100)
  }

  // --- Compute required photos for enabling continue ---
  const requiredPhotos = ["exterior", "bedroom", "bathroom", "kitchen", "living"];
  const missingPhotos = requiredPhotos.filter(type => !formData.images.some(img => img.type === type));
  const canContinue = missingPhotos.length === 0;

  // Process existing images on component mount
  useEffect(() => {
    // Function to process existing image URLs into the formData.images format
    const processExistingImages = () => {
      if (!formData.existingImages || formData.existingImages.length === 0) return;

      // Process each existing image
      const processedImages = formData.existingImages.map((url: string, index: number) => {
        let imageType = "other";
        if (index === 0) imageType = "exterior";
        else if (index === 1) imageType = "living";
        else if (index === 2) imageType = "kitchen";
        else if (index === 3) imageType = "bedroom";
        else if (index === 4) imageType = "bathroom";
        return {
          type: imageType,
          url: url,
          existingUrl: true
        };
      });

      const newImages = [
        ...formData.images.filter(img => !img.existingUrl),
        ...processedImages
      ];

      onChange({
        images: newImages
      });
    };

    if (
      formData.existingImages &&
      formData.existingImages.length > 0 &&
      (!formData.images || formData.images.filter(img => img.existingUrl).length === 0)
    ) {
      processExistingImages();
    }
  }, [formData.existingImages, formData.images, onChange]);

  return (
    <div className="grid gap-6 py-4">
      <div>
        <h3 className="text-lg font-medium mb-2">Property Photos</h3>
        <p className="text-sm text-muted-foreground mb-2">
          Upload quality photos of your property to attract potential tenants.
        </p>
        
        {/* Progress indicator */}
        <div className="mt-4 mb-6">
          <div className="flex justify-between text-sm mb-1">
            <span>Photo upload progress</span>
            <span>{getTotalPhotoCount()} photos added</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${getOverallProgressPercentage()}%` }}
            />
          </div>
        </div>
      </div>

      {/* Category selection grid - improved spacing and fixed height */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ROOM_CATEGORIES.map((category) => {
          const images = imagesByCategory[category.id] || []
          const hasImage = images.length > 0
          
          return (
            <div 
              key={category.id}
              className={`
                relative border-2 border-dashed rounded-lg overflow-hidden
                transition-all 
                ${dragOver === category.id ? 'border-primary bg-primary/10' : 'border-gray-700'} 
                ${hasImage ? 'bg-black' : 'bg-black'}
                ${category.primary ? 'ring-2 ring-primary ring-offset-1 ring-offset-black' : ''}
              `}
            >
              {/* Upload area or image display */}
              <div 
                className={`
                  relative aspect-video cursor-pointer 
                  flex flex-col items-center justify-center
                  ${hasImage ? 'p-0' : 'p-4'}
                `}
                onClick={() => fileInputRefs.current[category.id]?.click()}
                onDragOver={(e) => handleDragOver(e, category.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, category.id)}
              >
                {hasImage ? (
                  // Display the first image if we have one
                  <div className="w-full h-full relative group">
                    <Image 
                      src={images[0]?.url || "/placeholder.jpg"} 
                      alt={category.displayName}
                      width={400}
                      height={300}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Image count badge for Other category only */}
                    {category.id === "other" && images.length > 1 && (
                      <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded-full">
                        {images.length} photos
                      </div>
                    )}
                    
                    {/* Controls - Edit/Delete */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRefs.current[category.id]?.click();
                        }}
                        className="bg-white text-black rounded-full p-2 hover:bg-gray-200 transition-colors"
                        title="Replace image"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const imageIndex = formData.images.findIndex(img => 
                            img.type === category.id && img.url === images[0].url
                          );
                          if (imageIndex !== -1) handleRemoveImage(imageIndex);
                        }}
                        className="bg-white text-black rounded-full p-2 hover:bg-gray-200 transition-colors"
                        title="Delete image"
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  // Upload placeholder
                  <>
                    <Camera className="h-8 w-8 text-gray-500 mb-2" />
                    <p className="text-sm font-medium text-center text-gray-400">
                      {category.displayName}
                    </p>
                    <p className="text-xs text-center text-gray-500 mt-1">
                      {getCategoryStatusText(category.id)}
                    </p>
                  </>
                )}
                
                {/* Hidden file input */}
                <input
                  type="file"
                  ref={(el) => { fileInputRefs.current[category.id] = el; }}
                  accept="image/*"
                  className="hidden"
                  multiple={category.allowMultiple}
                  onChange={(e) => handleFileSelected(category.id, e.target.files)}
                />
              </div>
              
              {/* Category label - Changed to white background with black text */}
              <div className="w-full bg-white px-3 py-2 flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-black">
                    {category.displayName}
                  </span>
                  
                  {/* Info tooltip */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="ml-1.5 text-gray-600 hover:text-gray-800">
                          <Info className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">{category.description}</p>
                        {category.id === "exterior" && (
                          <p className="text-xs mt-1 text-primary-foreground">This will be used as the cover photo</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                {/* Category badge - Only show for Other Photos */}
                {category.id === "other" && (
                  <div className="text-xs px-1.5 py-0.5 rounded bg-gray-200 text-gray-800">
                    {`${images.length}/${category.limit}`}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Photo gallery for "Other" category with multiple photos */}
      {imagesByCategory["other"] && imagesByCategory["other"].length > 1 && (
        <div className="mt-4">
          <Label className="mb-2 block">Other Photos Gallery</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {imagesByCategory["other"].map((image, index) => (
              <div key={index} className="relative aspect-square border border-gray-800 rounded-md overflow-hidden group">
                <Image 
                  src={image.url || "/placeholder.jpg"} 
                  alt={`Other ${index + 1}`} 
                  width={200}
                  height={200}
                  className="w-full h-full object-cover"
                />
                {/* Enhanced controls */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button 
                    onClick={() => {
                      const imageIndex = formData.images.findIndex(img => 
                        img.type === "other" && img.url === image.url
                      )
                      if (imageIndex !== -1) handleRemoveImage(imageIndex)
                    }}
                    className="bg-white text-black rounded-full p-2 hover:bg-gray-200 transition-colors"
                    title="Delete image"
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between mt-4">
        <Button variant="outline" onClick={onPrev}>
          Back
        </Button>
        <Button onClick={onNext} disabled={!canContinue}>
          Continue
        </Button>
      </div>
    </div>
  )
}