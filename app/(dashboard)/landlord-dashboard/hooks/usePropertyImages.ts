import { useState } from 'react';
import { ImageStorage } from '../lib/utils/imageStorage';

export function usePropertyImages(propertyId: string) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  
  /**
   * Upload multiple images
   */
  const uploadImages = async (files: File[]): Promise<string[]> => {
    try {
      setUploading(true);
      setProgress(0);
      setError(null);
      
      // Create an array of uploads
      const totalFiles = files.length;
      const processedFiles = [];
      const urls = [];
      
      // Process files in batches of 3
      const BATCH_SIZE = 3;
      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, i + BATCH_SIZE);
        const batchUrls = await ImageStorage.uploadImages(propertyId, batch);
        urls.push(...batchUrls);
        
        // Update progress
        processedFiles.push(...batch);
        setProgress(Math.floor((processedFiles.length / totalFiles) * 100));
      }
      
      setProgress(100);
      return urls;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to upload images'));
      throw err;
    } finally {
      setUploading(false);
    }
  };
  
  /**
   * Delete an image 
   */
  const deleteImage = async (url: string): Promise<void> => {
    try {
      const ownerId = 'your-owner-id'; // Replace with the actual ownerId
      await ImageStorage.deleteImage(url, ownerId);
    } catch (err) {
      console.error('Failed to delete image:', err);
      throw err;
    }
  };
  
  /**
   * Get optimized version of an image
   */
  const getOptimizedUrl = (url: string, size: number = 600) => {
    return ImageStorage.getOptimizedUrl(url, {
      width: size,
      format: 'webp',
      quality: 80
    });
  };
  
  /**
   * Get thumbnail version of an image
   */
  const getThumbnailUrl = (url: string) => {
    return ImageStorage.getOptimizedUrl(url, {
      width: 200,
      height: 150,
      format: 'webp',
      quality: 70
    });
  };
  
  return {
    uploadImages,
    deleteImage,
    getOptimizedUrl,
    getThumbnailUrl,
    uploading,
    progress,
    error
  };
}