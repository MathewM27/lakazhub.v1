"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { PropertyService } from '../lib/utils/services/PropertyService';
import { Property } from '../types';
import { PropertyCache } from '../lib/utils/cache/propertyCache';

export const useProperties = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  // Add a ref to track refresh operations in progress
  const refreshInProgress = useRef<boolean>(false);

  const fetchProperties = useCallback(async (forceRefresh = false) => {
    // Check if a refresh operation is already in progress
    if (refreshInProgress.current) {
      console.log('[useProperties] Refresh already in progress, skipping duplicate request');
      return properties; // Return current properties to avoid triggering re-renders
    }
    
    try {
      refreshInProgress.current = true;
      setLoading(true);
      setError(null);

      // Use enhanced PropertyService that now supports stale-while-revalidate
      const result = await PropertyService.getAllProperties(forceRefresh);
      setProperties(result);
      return result;
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError(err as Error);
      return [];
    } finally {
      setLoading(false);
      // Add a small delay before allowing another refresh
      setTimeout(() => {
        refreshInProgress.current = false;
      }, 500);
    }
  }, [properties]); // Include properties in dependency array

  // Initial fetch
  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]); // Add fetchProperties to dependency array

  // Listen for cache updates
  useEffect(() => {
    const handleCacheUpdate = (data: unknown) => {
      // Only process updates if we're not already refreshing
      if (refreshInProgress.current) {
        console.log('[useProperties] Ignoring cache update while refresh in progress');
        return;
      }

      // Type guard for expected cache update structure
      if (typeof data === 'object' && data !== null && 'type' in data) {
        const update = data as { type: string; data?: Property[] };
        if (update.type === 'properties' && Array.isArray(update.data)) {
          setProperties(update.data);
        } else if (update.type === 'property') {
          setTimeout(() => {
            fetchProperties(true);
          }, 100);
        } else if (update.type === 'clear') {
          setTimeout(() => {
            fetchProperties(true);
          }, 300);
        }
      }
    };

    PropertyCache.addEventListener('update', handleCacheUpdate);

    return () => {
      PropertyCache.removeEventListener('update', handleCacheUpdate);
    };
  }, [fetchProperties]);

  return {
    properties,
    loading,
    error,
    refreshProperties: fetchProperties
  };
};