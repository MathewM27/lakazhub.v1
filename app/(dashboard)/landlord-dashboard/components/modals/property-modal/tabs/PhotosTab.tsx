import { useRef, useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { FormData } from "../types"
import { X, Camera, Info, Loader2 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface PhotosTabProps {
  formData: FormData
  onChange: (formData: Partial<FormData>) => void
  onNext: () => void
  onPrev: () => void
}

// Room categories with display names and limits
const ROOM_CATEGORIES = [
  { id: "exterior", displayName: "Cover Photo", limit: 1, description: "Main exterior photo (displayed to tenants)", primary: true },
  { id: "living", displayName: "Living Room", limit: 1, description: "Main living area" },
  { id: "kitchen", displayName: "Kitchen", limit: 1, description: "Kitchen area" },
  { id: "bedroom", displayName: "Bedroom", limit: 1, description: "Main bedroom" },
  { id: "bathroom", displayName: "Bathroom", limit: 1, description: "Main bathroom" },
  { id: "other", displayName: "Other Photos", limit: 10, description: "Additional property photos", allowMultiple: true }
]

// Default placeholder image for cases where image URL might be undefined
const PLACEHOLDER_IMAGE = "/placeholder-image.jpg"

export default function PhotosTab({
  formData,
  onChange,
  onNext,
  onPrev
}: PhotosTabProps) {
  const [dragOver, setDragOver] = useState<string | null>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({})
  
  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      // Revoke all blob URLs to prevent memory leaks
      formData.images.forEach(img => {
        if (img.url && isBlobUrl(img.url)) {
          URL.revokeObjectURL(img.url);
        }
      });
    };
  }, []);
  
  // Group images by category
  const imagesByCategory = ROOM_CATEGORIES.reduce((acc, category) => {
    acc[category.id] = formData.images.filter(img => img.type === category.id)
    return acc
  }, {} as Record<string, typeof formData.images>)

  // Add a file to a specific category
  const handleFileSelected = async (category: string, files: FileList | null) => {
    if (!files || files.length === 0) return

    // Show loading indicator for this category
    setIsLoading(prev => ({ ...prev, [category]: true }));

    try {
      // Convert FileList to array and filter for images only
      const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
      if (imageFiles.length === 0) {
        setIsLoading(prev => ({ ...prev, [category]: false }));
        return;
      }

      // Find category config
      const categoryConfig = ROOM_CATEGORIES.find(c => c.id === category)
      if (!categoryConfig) {
        setIsLoading(prev => ({ ...prev, [category]: false }));
        return;
      }

      // Get current images of this category
      const currentImages = formData.images.filter(img => img.type === category)
      
      // Check if we exceed limits
      const limit = categoryConfig.limit
      let newImagesToAdd = imageFiles
      
      // If not a multiple category, replace existing images or limit to remaining slots
      if (!categoryConfig.allowMultiple) {
        // If we already have an image and it's not a multiple category, remove the old one
        if (currentImages.length >= limit) {
          // Remove existing images of this category
          const updatedImages = formData.images.filter(img => img.type !== category)
          
          // Create new image for this category with blob URL for preview
          const newImage = {
            file: imageFiles[0],
            type: category,
            url: URL.createObjectURL(imageFiles[0])
          }
          
          onChange({
            images: [...updatedImages, newImage]
          })
          
          setIsLoading(prev => ({ ...prev, [category]: false }));
          return
        }
        
        // Limit to remaining slots
        newImagesToAdd = imageFiles.slice(0, limit - currentImages.length)
      } else {
        // For multiple categories, limit to remaining slots
        newImagesToAdd = imageFiles.slice(0, limit - currentImages.length)
      }

      // Process each image file to create object URLs for preview
      const processedImages = await Promise.all(
        newImagesToAdd.map(async (file) => {
          // Add category to the file name for organizational purposes
          const renamedFile = new File(
            [file], 
            `${category}__${file.name}`, 
            { type: file.type }
          );
          
          // Create blob URL for preview
          return {
            file: renamedFile,
            type: category,
            url: URL.createObjectURL(file)
          };
        })
      );

      // Update form data with new images
      onChange({
        images: [...formData.images, ...processedImages]
      });
    } catch (error) {
      console.error("Error processing image files:", error);
    } finally {
      setIsLoading(prev => ({ ...prev, [category]: false }));
    }
  }

  const handleRemoveImage = (index: number) => {
    const newImages = [...formData.images]
    
    // If the image has a URL created with createObjectURL, revoke it
    if (newImages[index].url && isBlobUrl(newImages[index].url)) {
      URL.revokeObjectURL(newImages[index].url as string)
    }
    
    newImages.splice(index, 1)
    onChange({ images: newImages })
  }

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

  // Check if url is blob URL
  const isBlobUrl = (url: string | undefined): boolean => {
    return !!url && url.startsWith('blob:')
  }

  return (
    <div className="grid gap-6 py-4">
      <div>
        <h3 className="text-lg font-medium mb-2">Property Photos</h3>
        <p className="text-sm text-muted-foreground mb-2">
          Upload high-quality photos of your property to attract potential tenants.
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

      {/* Category selection grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ROOM_CATEGORIES.map((category) => {
          const images = imagesByCategory[category.id] || []
          const hasImage = images.length > 0
          const imageUrl = hasImage && images[0]?.url ? images[0].url : PLACEHOLDER_IMAGE
          const loading = isLoading[category.id] || false;
          
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
                className="relative cursor-pointer flex flex-col items-center justify-center"
                style={{ aspectRatio: '16 / 9' }} // Ensure the parent has a height
                onClick={() => fileInputRefs.current[category.id]?.click()}
                onDragOver={(e) => handleDragOver(e, category.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, category.id)}
              >
                {loading ? (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  </div>
                ) : null}
                
                {hasImage ? (
                  // Display the first image if we have one
                  <div className="w-full h-full relative">
                    <Image 
                      src={imageUrl}
                      alt={category.displayName}
                      fill
                      className="object-cover"
                      unoptimized={isBlobUrl(imageUrl)} // Ensure blob URLs are handled
                      onError={(e) => console.error("Image failed to load:", imageUrl, e)} // Debugging
                    />
                    
                    {/* Image count badge for Other category only */}
                    {category.id === "other" && images.length > 1 && (
                      <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded-full z-10">
                        {images.length} photos
                      </div>
                    )}
                    
                    {/* Remove button */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        const imageIndex = formData.images.findIndex(img => 
                          img.type === category.id && img.url === images[0]?.url
                        )
                        if (imageIndex !== -1) handleRemoveImage(imageIndex)
                      }}
                      className="absolute right-2 top-2 bg-black/70 text-white rounded-full p-1 hover:bg-black/90 transition-colors z-10"
                    >
                      <X className="h-4 w-4" />
                    </button>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {imagesByCategory["other"].map((image, index) => {
              const galleryImageUrl = image.url || PLACEHOLDER_IMAGE;
              return (
                <div key={index} className="relative aspect-square border border-gray-800 rounded-md overflow-hidden">
                  <Image 
                    src={galleryImageUrl}
                    alt={`Other ${index + 1}`}
                    fill
                    className="object-cover"
                    unoptimized={isBlobUrl(galleryImageUrl)}
                  />
                  <button 
                    onClick={() => {
                      const imageIndex = formData.images.findIndex(img => 
                        img.type === "other" && img.url === image.url
                      )
                      if (imageIndex !== -1) handleRemoveImage(imageIndex)
                    }}
                    className="absolute right-1 top-1 bg-black/70 text-white rounded-full p-1 hover:bg-black/90 z-10"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex justify-between mt-4">
        <Button variant="outline" onClick={onPrev}>
          Back
        </Button>
        <Button onClick={onNext} disabled={formData.images.length === 0}>
          Continue
        </Button>
      </div>
    </div>
  )
}