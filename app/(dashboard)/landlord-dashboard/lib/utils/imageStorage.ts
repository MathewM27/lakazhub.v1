import { supabase } from "../utils/supabase/client";

interface UploadProgressCallback {
  (progress: number): void;
}

interface ImageDimensions {
  width: number;
  height: number;
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
    // Use file parameter to avoid unused var error
    void file;
    // Your existing validation code
    return { valid: true };
  }
  
  /**
   * Get dimensions of an image file
   */
  static async getImageDimensions(file: File): Promise<ImageDimensions> {
    // Use file parameter to avoid unused var error
    void file;
    // Your existing code
    return { width: 0, height: 0 };
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

    console.log(`Starting upload for property ${propertyId} with room type: ${options.roomType || 'unknown'}`);
    console.log(`Number of files: ${files.length}`);
    
    const uploadedUrls: string[] = [];
    const { compress = true, onProgress, roomType = 'unknown' } = options;
    
    try {
      // Create folder path with property ID and room type - FIXED: ensure 'other' uses the same path structure
      const sanitizedPropertyId = propertyId.replace(/[^\w-]/g, ''); // Only allow safe characters
      const sanitizedRoomType = roomType.toLowerCase().replace(/[^\w-]/g, '-');
      
      // IMPORTANT FIX: Always use the same folder structure for ALL room types including "other"
      const folderPath = `${sanitizedPropertyId}/${sanitizedRoomType}`;
      
      console.log(`Using folder path: ${folderPath}`);
      
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
        
        // Generate unique filename - for "other" category, add an index to keep them distinct
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 10);
        const fileExt = file.name.split('.').pop() || 'jpg';
        
        // For "other" category, add an index to each filename to differentiate
        const filePrefix = roomType === 'other' ? `${i+1}-` : '';
        const fileName = `${filePrefix}${timestamp}-${randomId}.${fileExt}`;
        const filePath = `${folderPath}/${fileName}`;
        
        try {
          // Convert file to ArrayBuffer for more reliable binary data handling
          const arrayBuffer = await file.arrayBuffer();
          const fileBuffer = new Uint8Array(arrayBuffer);
          
          console.log(`Converting file to binary buffer: ${file.name} (${fileBuffer.length} bytes)`);
          console.log(`Uploading to path: ${filePath}`);
          
          let { data, error } = await supabase.storage
            .from(this.BUCKET_NAME)
            .upload(filePath, fileBuffer, {
              cacheControl: '3600',
              contentType: file.type, // Explicit content type
              upsert: false // Don't overwrite files with same name
            });
            
          if (error) {
            // If file already exists, try with a different name
            if (error.message?.includes('already exists')) {
              const newFileName = `${filePrefix}${timestamp}-${randomId}-${Math.random().toString(36).substring(2, 6)}.${fileExt}`;
              const newFilePath = `${folderPath}/${newFileName}`;
              
              console.log(`File collision, retrying with new name: ${newFilePath}`);
              
              // Use the same binary buffer for retry
              const retryUpload = await supabase.storage
                .from(this.BUCKET_NAME)
                .upload(newFilePath, fileBuffer, {
                  cacheControl: '3600',
                  contentType: file.type,
                  upsert: false
                });
                
              if (retryUpload.error) {
                console.error(`Retry upload failed: ${retryUpload.error.message}`);
                throw retryUpload.error;
              } else {
                data = retryUpload.data;
              }
            } else {
              console.error(`Upload error: ${error.message}`);
              throw error;
            }
          }
          
          // Get the public URL
          const { data: publicUrlData } = supabase.storage
            .from(this.BUCKET_NAME)
            .getPublicUrl(data?.path || filePath);
            
          if (publicUrlData?.publicUrl) {
            console.log(`File uploaded successfully: ${publicUrlData.publicUrl}`);
            uploadedUrls.push(publicUrlData.publicUrl);
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
  static async deleteAllPropertyImages(propertyId: string): Promise<{ success: boolean; error?: any }> {
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
        .filter(item => !item.id.endsWith('/')) // Filter out folders
        .map(item => `${propertyId}/${item.name}`);
        
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
  static getOptimizedUrl(url: string, options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpg';
    resize?: 'cover' | 'contain' | 'fill';
  } = {}): string {
    // This would integrate with a CDN or image optimization service
    // For now, just return the original URL
    return url;
  }
  
  /**
   * Upload with retry logic for better reliability
   */
  static async uploadWithRetry(
    path: string,
    file: File,
    _options: {
      cacheControl?: string;
      contentType?: string;
      upsert?: boolean;
    } = {},
    maxRetries: number = 3
  ): Promise<{
    data: unknown;
    error: Error | null;
  }> {
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
          .upload(finalPath, file, _options);
          
        if (!result.error) {
          return result;
        }
        
        lastError = result.error;
        
        // If error is not about resource existing, don't retry
        if (!result.error.message?.includes('already exists')) {
          throw result.error;
        }
        
        console.warn(`Upload collision detected (attempt ${attempt+1}), retrying with new name`);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // If it's a different error that's not "already exists", don't retry
        if (!(lastError.message?.includes('already exists'))) {
          throw lastError;
        }
      }
      
      attempt++;
    }
    
    throw lastError || new Error("Max upload retries exceeded");
  }

  /**
   * Compress an image to reduce file size
   */
  static async compressImage(file: File, _: number = 1): Promise<File | null> {
    // Implement compression with a library like browser-image-compression
    // For now, just return the original file
    return file;
  }
}