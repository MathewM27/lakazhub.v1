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
  private static MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
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
    // Implementation of file validation logic
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return { valid: false, error: 'Invalid file type' };
    }
    
    if (file.size > this.MAX_FILE_SIZE) {
      return { valid: false, error: 'File too large' };
    }
    
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
   * Assumes the bucket already exists on Supabase
   */
  static async uploadImages(
    propertyId: string, 
    files: File[], 
    options: { 
      roomType?: string;
      propertyName?: string;
      compress?: boolean;
      onProgress?: UploadProgressCallback;
    } = {}
  ): Promise<string[]> {
    // Ensure Supabase is initialized
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    // Check if user has uploaded too many files recently
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('User not authenticated');
    
    const now = Date.now();
    const lastUpload = this.uploadThrottleMap.get(userId) || 0;
    
    if (now - lastUpload < 5000 && files.length > 3) { // Prevent rapid multi-file uploads
      throw new Error('Please wait a moment before uploading more files');
    }
    
    this.uploadThrottleMap.set(userId, now);

    // Get property name for better organization
    let propertyName = options.propertyName || '';
    if (!propertyName) {
      try {
        const { data: property } = await supabase
          .from('properties')
          .select('name')
          .eq('id', propertyId)
          .single();
        
        if (property?.name) {
          propertyName = property.name;
        }
      } catch (error) {
        console.warn('Failed to get property name, using ID instead:', error);
      }
    }
    
    // Sanitize property name for folder use
    const sanitizedPropertyName = propertyName 
      ? propertyName.replace(/[^\w-]/g, '-').toLowerCase()
      : `property-${propertyId}`;

    console.log(`Starting upload for ${sanitizedPropertyName} with room type: ${options.roomType || 'unknown'}`);
    console.log(`Number of files: ${files.length}`);
    
    const uploadedUrls: string[] = [];
    const { compress = true, onProgress, roomType = 'unknown' } = options;
    
    try {
      // Create folder path with property name and room type
      const sanitizedPropertyId = propertyId.replace(/[^\w-]/g, ''); // Only allow safe characters
      const sanitizedRoomType = roomType.toLowerCase().replace(/[^\w-]/g, '-');
      const folderPath = `${sanitizedPropertyName}/${sanitizedPropertyId}/${sanitizedRoomType}`;
      
      // Upload each file with progress tracking
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      let uploadedSize = 0;
      
      for (let i = 0; i < files.length; i++) {
        let file = files[i];
        
        // Validate the file
        const validation = this.validateImage(file);
        if (!validation.valid) {
          console.error(`File validation failed: ${validation.error}`);
          continue;
        }
        
        // Compress if needed and option is enabled
        if (compress && file.size > 2 * 1024 * 1024) {
          try {
            const compressedFile = await this.compressImage(file);
            if (compressedFile) {
              file = compressedFile;
              console.log(`Compressed image ${i+1}, new size: ${Math.round(file.size/1024)}KB`);
            }
          } catch (compressError) {
            console.warn(`Image compression failed, using original: ${compressError}`);
          }
        }
        
        // Generate unique filename
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 10);
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `${timestamp}-${randomId}.${fileExt}`;
        const filePath = `${folderPath}/${fileName}`;
        
        try {
          // Upload the file with retry mechanism
          const result = await this.uploadWithRetry(
            filePath,
            file,
            {
              cacheControl: '3600',
              contentType: file.type,
              upsert: false
            }
          );
          
          if (result && typeof result === 'object' && !("error" in result)) {
            // Get the public URL
            const { data: publicUrlData } = supabase.storage
              .from(this.BUCKET_NAME)
              .getPublicUrl((result as any).data?.path || filePath);
              
            if (publicUrlData?.publicUrl) {
              console.log(`File uploaded successfully: ${publicUrlData.publicUrl}`);
              uploadedUrls.push(publicUrlData.publicUrl);
            }
          }
        } catch (uploadError) {
          console.error(`Error uploading file ${i+1}:`, uploadError);
          // Continue with other files instead of failing the whole batch
        }
        
        // Update progress
        uploadedSize += file.size;
        if (onProgress) {
          const percentComplete = Math.round((uploadedSize / totalSize) * 100);
          onProgress(percentComplete);
        }
      }
      
      return uploadedUrls;
    } catch (error) {
      console.error('Error in uploadImages:', error);
      throw error;
    }
  }
  
  /**
   * Delete an image from storage
   */
  static async deleteImage(url: string, ownerId: string): Promise<void> {
    try {
      const parts = url.split(`/public/${this.BUCKET_NAME}/`);
      if (parts.length !== 2) {
        throw new Error('Invalid image URL format');
      }
      
      const filePath = parts[1];
      const propertyId = filePath.split('/')[0]; // Extract property ID from path
      
      // Verify ownership before deletion (if not using RLS)
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .select('landlord_id')
        .eq('id', propertyId)
        .single();
        
      if (propertyError || property.landlord_id !== ownerId) {
        throw new Error('Unauthorized to delete this image');
      }
      
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
      // Get list of all files in the property folder
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list(propertyId);
        
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
        .filter((item: StorageItem) => !item.id.endsWith('/')) // Filter out folders
        .map((item: StorageItem) => `${propertyId}/${item.name}`);
        
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
  static async compressImage(file: File, maxSizeMB = 1): Promise<File | null> {
    try {
      // Create a canvas element for image processing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return file; // Fall back to original file if no context
      
      // Load the image
      const img = new Image();
      const loadPromise = new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
      });
      
      await loadPromise;
      
      // Original dimensions
      let { width, height } = img;
      
      // Calculate target size to maintain aspect ratio
      const aspectRatio = width / height;
      
      // Target max dimension (maintain aspect ratio)
      const MAX_DIMENSION = 1920; // Resize if larger than this
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          width = MAX_DIMENSION;
          height = Math.round(MAX_DIMENSION / aspectRatio);
        } else {
          height = MAX_DIMENSION;
          width = Math.round(MAX_DIMENSION * aspectRatio);
        }
      }
      
      // Set canvas size
      canvas.width = width;
      canvas.height = height;
      
      // Draw image with smoothing
      ctx.drawImage(img, 0, 0, width, height);
      
      // Clean up the object URL
      URL.revokeObjectURL(img.src);
      
      // Start with high quality
      let quality = 0.9;
      let compressedBlob: Blob | null = null;
      
      // Try with progressively lower quality until we get under the size limit
      // or hit a minimum quality threshold
      while (quality >= 0.5) {
        const blob = await new Promise<Blob | null>(resolve => {
          canvas.toBlob(blob => resolve(blob), 'image/jpeg', quality);
        });
        
        if (!blob) break;
        
        compressedBlob = blob;
        
        // If size is under limit, we're done
        if (blob.size <= maxSizeMB * 1024 * 1024) {
          break;
        }
        
        // Reduce quality for next iteration
        quality -= 0.1;
      }
      
      if (!compressedBlob) return file;
      
      // Convert blob back to File object with original name
      const compressedFile = new File(
        [compressedBlob], 
        file.name.replace(/\.\w+$/, '.jpg'), // Change extension to jpg
        { 
          type: 'image/jpeg',
          lastModified: file.lastModified 
        }
      );
      
      return compressedFile;
    } catch (error) {
      console.error('Image compression failed:', error);
      return file; // Return original file if compression fails
    }
  }
}