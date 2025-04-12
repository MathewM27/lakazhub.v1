import { supabase } from "../utils/supabase/client";

interface UploadProgressCallback {
  (progress: number): void;
}

interface ImageDimensions {
  width: number;
  height: number;
}

// Define an interface for storage item data
interface StorageItem {
  id: string;
  name: string;
  // Add other properties you might need
}

export class ImageStorage {
  private static BUCKET_NAME = 'property-images';
  private static MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB - Supabase's limit
  private static ALLOWED_TYPES = ['image/jpeg', 'image/png']; 
  
  // Use a client-side throttling mechanism
  private static uploadThrottleMap = new Map<string, number>();

  private static log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    if (process.env.NODE_ENV !== 'production' || level === 'error') {
      console[level](message);
    }
  }

  /**
   * Validate an image file before upload
   */
  static validateImage(file: File): { valid: boolean; error?: string } {
    console.log(`Validating image: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
    
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      console.error(`Invalid file type: ${file.type}`);
      return { valid: false, error: 'Invalid file type' };
    }
    
    if (file.size > this.MAX_FILE_SIZE) {
      console.error(`File too large: ${file.size} bytes`);
      return { valid: false, error: 'File too large' };
    }
    
    console.log(`Image validation passed for: ${file.name}`);
    return { valid: true };
  }
  
  /**
   * Get dimensions of an image file
   */
  static async getImageDimensions(file: File): Promise<ImageDimensions> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ 
          width: img.naturalWidth, 
          height: img.naturalHeight 
        });
        URL.revokeObjectURL(img.src);
      };
      img.src = URL.createObjectURL(file);
    });
  }
  
  /**
   * Upload images to the property-images bucket
   */
  static async uploadImages(
    propertyId: string, 
    files: File[], 
    options: { 
      roomType?: string;
      compress?: boolean;
      onProgress?: UploadProgressCallback;
    } = {}
  ): Promise<string[]> {
    console.log(`Starting upload for property ${propertyId} with ${files.length} files`);
    console.log(`Upload options:`, options);
    
    const { roomType = 'default', compress = true, onProgress } = options;
    const uploadedUrls: string[] = [];

    try {
      // Get user auth status
      const { data: authData } = await supabase.auth.getUser();
      console.log(`Current auth user:`, authData?.user ? `ID: ${authData.user.id}` : 'No authenticated user');
      
      if (!authData?.user) {
        console.error('No authenticated user found for upload');
        throw new Error("Authentication required for uploading images");
      }

      // Make sure we have files to process
      if (!files || files.length === 0) {
        console.warn('No files provided for upload');
        return [];
      }

      // Process each file
      for (let i = 0; i < files.length; i++) {
        let file = files[i];
        
        // Validate the file
        const validation = this.validateImage(file);
        if (!validation.valid) {
          console.error(`File validation failed: ${validation.error}`);
          continue;
        }
        
        // Compress the image if it's larger than threshold (2MB for Supabase)
        if (compress && file.size > this.MAX_FILE_SIZE) {
          try {
            console.log(`Compressing image ${file.name} (${file.size} bytes) - over ${this.MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
            
            // Start with aggressive compression
            let quality = 0.6;
            let maxDimension = 1200; // Start with 1200px max dimension
            
            // Try progressively more aggressive compression until file is under limit
            while (file.size > this.MAX_FILE_SIZE && quality > 0.1) {
              file = await this.compressImage(file, {
                maxWidth: maxDimension,
                maxHeight: maxDimension,
                quality: quality
              });
              
              console.log(`Compressed to ${file.size} bytes with quality ${quality} and max dimension ${maxDimension}`);
              
              // If still too large, reduce quality and dimensions further
              if (file.size > this.MAX_FILE_SIZE) {
                quality -= 0.1;
                maxDimension = Math.max(800, maxDimension - 200); // Reduce dimensions, but not below 800px
              }
            }
            
            // Final check - if still too large, warn and skip
            if (file.size > this.MAX_FILE_SIZE) {
              console.warn(`Image ${file.name} still exceeds size limit after compression (${file.size} bytes). Skipping.`);
              continue;
            }
            
            console.log(`Final compression result: ${file.name} (${file.size} bytes)`);
          } catch (compressError) {
            console.error('Image compression failed:', compressError);
            // Skip this file if we can't compress it
            continue;
          }
        } else if (file.size > this.MAX_FILE_SIZE) {
          // If compression is disabled but file is too large
          console.warn(`Image ${file.name} exceeds size limit (${file.size} bytes) and compression is disabled. Skipping.`);
          continue;
        }
        
        // Generate a safe filename with room type and timestamp to ensure uniqueness
        const timestamp = new Date().getTime();
        const fileExt = file.name.split('.').pop();
        const safeRoomType = roomType.toLowerCase().replace(/\s+/g, '-');
        const fileName = `${propertyId}/${safeRoomType}-${timestamp}-${i}.${fileExt}`;
        
        console.log(`Uploading file with name: ${fileName}, size: ${file.size} bytes, type: ${file.type}`);
        
        try {
          const { data, error } = await supabase.storage
            .from(this.BUCKET_NAME)
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: true,
            });
            
          if (error) {
            console.error(`Storage upload error:`, error);
            
            // More user-friendly error handling
            if (error.message?.includes('413')) {
              throw new Error(`File ${file.name} is too large. Maximum file size is 2MB.`);
            }
            
            throw error;
          }
          
          console.log(`Upload successful, path: ${data?.path || 'unknown path'}`);
          
          // Get the public URL
          const { data: urlData } = supabase.storage
            .from(this.BUCKET_NAME)
            .getPublicUrl(data?.path || fileName);
            
          console.log(`Generated public URL:`, urlData);
          
          if (urlData?.publicUrl) {
            uploadedUrls.push(urlData.publicUrl);
          } else {
            console.error('Failed to get public URL');
          }
          
          // Update progress if callback provided
          if (onProgress) {
            onProgress(Math.round(((i + 1) / files.length) * 100));
          }
        } catch (uploadError) {
          console.error(`Error in upload operation:`, uploadError);
          // Continue with other files if one fails
        }
      }
      
      console.log(`Upload complete. Total successful uploads: ${uploadedUrls.length}`, uploadedUrls);
      return uploadedUrls;
    } catch (err) {
      console.error('Error in uploadImages:', err);
      throw new Error(`Failed to upload images: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  
  /**
   * Delete an image from storage
   */
  static async deleteImage(url: string, ownerId: string): Promise<void> {
    try {
      // Extract the path from the URL using a more robust approach
      const urlObject = new URL(url);
      const pathname = urlObject.pathname;
      
      // Get the path after the storage path and bucket name
      // Typical format: /storage/v1/object/public/bucket-name/path/to/file.jpg
      const storagePathPattern = /\/storage\/v\d\/object\/public\/([\w-]+)\/(.*)/;
      const match = pathname.match(storagePathPattern);
      
      if (!match || match.length < 3) {
        console.error('Invalid image URL format:', url);
        throw new Error('Invalid image URL format');
      }
      
      const bucketName = match[1];
      const filePath = match[2];
      const propertyId = filePath.split('/')[0]; // Extract property ID from first part of path
      
      // Verify ownership before deletion (if not using RLS)
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .select('landlord_id')
        .eq('id', propertyId)
        .single();
        
      if (propertyError) {
        console.error('Error verifying image ownership:', propertyError);
        throw new Error('Failed to verify image ownership');
      }
      
      if (property.landlord_id !== ownerId) {
        throw new Error('Unauthorized to delete this image');
      }
      
      // Delete the file
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([filePath]);
      
      if (error) {
        console.error('Error deleting image:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteImage:', error);
      throw error;
    }
  }
  
  /**
   * Delete all images for a property
   */
  static async deleteAllPropertyImages(propertyId: string): Promise<{ success: boolean; error?: unknown }> {
    try {
      const sanitizedPropertyId = propertyId.replace(/[^\w-]/g, '');
      
      // Get list of files in the property folder
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list(sanitizedPropertyId);
        
      if (error) {
        console.error(`Error listing property images: ${error.message}`);
        return { success: false, error };
      }
      
      if (!data || data.length === 0) {
        console.log(`No images found for property ${propertyId}`);
        return { success: true };
      }
      
      // Get paths of all property's image files
      const filesToDelete = data
        .filter((item: StorageItem) => !item.id.endsWith('/'))
        .map((item: StorageItem) => `${sanitizedPropertyId}/${item.name}`);
        
      // Delete in batches to stay within API limits
      const batchSize = 100;
      for (let i = 0; i < filesToDelete.length; i += batchSize) {
        const batch = filesToDelete.slice(i, i + batchSize);
        const { error: deleteError } = await supabase.storage
          .from(this.BUCKET_NAME)
          .remove(batch);
          
        if (deleteError) {
          console.error(`Error deleting batch ${Math.ceil(i/batchSize)}: ${deleteError.message}`);
          return { success: false, error: deleteError };
        }
      }
      
      console.log(`Successfully deleted ${filesToDelete.length} images for property ${propertyId}`);
      return { success: true };
    } catch (error) {
      console.error(`Unexpected error deleting property images: ${error}`);
      return { success: false, error };
    }
  }

  /**
   * Create an image URL from a local blob/file (for previews)
   */
  static createLocalImageUrl(file: File): string {
    return URL.createObjectURL(file);
  }
  
  /**
   * Release a local image URL to free up memory
   */
  static releaseLocalImageUrl(url: string): void {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Get an optimized URL for the image
   */
  static getOptimizedUrl(
    url: string, 
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'jpg';
      resize?: 'cover' | 'contain' | 'fill';
    }
  ): string {
    // This would integrate with a CDN or image optimization service
    // A simple implementation might look like this:
    try {
      const urlObj = new URL(url);
      
      // Only apply transformations if using a compatible service
      if (urlObj.hostname.includes('your-cdn-service.com')) {
        const params = new URLSearchParams();
        
        if (options.width) params.append('w', options.width.toString());
        if (options.height) params.append('h', options.height.toString());
        if (options.quality) params.append('q', options.quality.toString());
        if (options.format) params.append('fm', options.format);
        if (options.resize) params.append('fit', options.resize);
        
        urlObj.search = params.toString();
        return urlObj.toString();
      }
    } catch (e) {
      // If URL parsing fails, return original
      console.warn('Failed to optimize URL:', e);
    }
    
    // For now, just return the original URL
    return url;
  }
  
  /**
   * Upload with retry logic for better reliability
   */
  static async uploadWithRetry(
    path: string,
    file: File,
    options: {
      cacheControl?: string;
      contentType?: string;
      upsert?: boolean;
    } = {},
    maxRetries: number = 3
  ): Promise<unknown> {
    let attempt = 0;
    let lastError: Error | null = null;
    
    while (attempt < maxRetries) {
      try {
        // If not first attempt, add retry number to filename
        const finalPath = attempt === 0 
          ? path 
          : path.replace(/(\.\w+)$/, `-retry${attempt}$1`);
        
        console.log(`Upload attempt ${attempt+1}/${maxRetries} for ${finalPath}`);
        
        const result = await supabase.storage
          .from(this.BUCKET_NAME)
          .upload(finalPath, file, options);
          
        if (!result.error) {
          return result;
        }
        
        lastError = new Error(result.error.message);
        
        // If error is not about resource existing, don't retry
        if (!result.error.message?.includes('already exists')) {
          throw result.error;
        }
        
        console.warn(`Upload collision detected (attempt ${attempt+1}), retrying with new name`);
      } catch (error) {
        const err = error as Error;
        lastError = err;
        
        // If it's a different error that's not "already exists", don't retry
        if (!err.message?.includes('already exists')) {
          throw error;
        }
      }
      
      attempt++;
    }
    
    throw lastError || new Error("Max upload retries exceeded");
  }

  /**
   * Compress an image to reduce file size
   */
  static async compressImage(
    file: File, 
    options: { maxWidth?: number; maxHeight?: number; quality?: number } = {}
  ): Promise<File> {
    const { maxWidth = 1200, maxHeight = 1200, quality = 0.6 } = options;
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (!event.target?.result) {
          return reject(new Error('Failed to read file'));
        }
        
        const img = new Image();
        img.onload = () => {
          // Calculate new dimensions while maintaining aspect ratio
          let width = img.width;
          let height = img.height;
          
          // Calculate scale factor to fit within maxWidth and maxHeight
          const scaleFactor = Math.min(
            maxWidth / width,
            maxHeight / height,
            1 // Don't upscale
          );
          
          width = Math.floor(width * scaleFactor);
          height = Math.floor(height * scaleFactor);
          
          console.log(`Resizing image from ${img.width}x${img.height} to ${width}x${height}`);
          
          // Create canvas for compression
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return reject(new Error('Could not get canvas context'));
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // Get compressed data URL (always use jpeg for better compression)
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          
          // Convert to Blob and then to File
          fetch(dataUrl)
            .then(res => res.blob())
            .then(blob => {
              const newFile = new File(
                [blob], 
                // Keep original filename but ensure .jpg extension
                file.name.replace(/\.(png|jpg|jpeg)$/i, '.jpg'),
                { type: 'image/jpeg' }
              );
              
              console.log(`Compression: ${file.size} → ${newFile.size} bytes (${Math.round(newFile.size / file.size * 100)}%)`);
              resolve(newFile);
            })
            .catch(reject);
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = event.target.result as string;
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }
}