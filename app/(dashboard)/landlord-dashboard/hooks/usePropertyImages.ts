import { useState, useEffect, useCallback } from 'react';
import { Property } from '../types/index';
import { PropertyService } from '../lib/utils/services/PropertyService';

export function useProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Load properties with caching
  const loadProperties = useCallback(async (forceRefresh = false) => {
    console.log('loadProperties called, forceRefresh:', forceRefresh);
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading properties, forceRefresh:', forceRefresh);
      const propertiesData = await PropertyService.getAllProperties(forceRefresh);
      console.log('Properties loaded successfully:', propertiesData.length);
      setProperties(propertiesData);
      return propertiesData;
    } catch (err) {
      console.error('Error loading properties:', err);
      setError(err instanceof Error ? err : new Error('Failed to load properties'));
      // Return empty array to prevent further errors
      return [];
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  }, []);
  
  // Load properties on mount
  useEffect(() => {
    console.log('useProperties useEffect running');
    loadProperties();
  }, [loadProperties]);
  
  // Refresh properties
  const refreshProperties = useCallback(() => {
    return loadProperties(true);
  }, [loadProperties]);
  
  // Create a property
  const createProperty = useCallback(async (property: Omit<Property, 'id'>) => {
    try {
      const newProperty = await PropertyService.createProperty(property);
      
      // Update local state
      setProperties(prev => [...prev, newProperty]);
      
      return newProperty;
    } catch (err) {
      console.error('Error creating property:', err);
      throw err;
    }
  }, []);
  
  // Update a property
  const updateProperty = useCallback(async (id: string, property: Partial<Property>) => {
    try {
      const updatedProperty = await PropertyService.updateProperty(id, property);
      
      // Update state
      setProperties(prev => 
        prev.map(p => p.id === id ? updatedProperty : p)
      );
      
      return updatedProperty;
    } catch (err) {
      console.error('Error updating property:', err);
      throw err;
    }
  }, []);
  
  // Delete a property
  const deleteProperty = useCallback(async (id: string) => {
    try {
      const success = await PropertyService.deleteProperty(id);
      
      if (success) {
        // Update state
        setProperties(prev => prev.filter(p => p.id !== id));
      }
      
      return success;
    } catch (err) {
      console.error('Error deleting property:', err);
      throw err;
    }
  }, []);
  
  return {
    properties,
    loading,
    error,
    refreshProperties,
    createProperty,
    updateProperty,
    deleteProperty
  };
}

export function usePropertyImages(_: string) {
  // Function to get optimized URL for images
  const getOptimizedUrl = useCallback((imageUrl: string) => {
    // If the URL is already optimized or is a relative path, return it as is
    if (!imageUrl || imageUrl.startsWith('/')) {
      return imageUrl;
    }

    // Log if the URL is a blob URL (usually from local file preview)
    if (imageUrl.startsWith('blob:')) {
      return imageUrl;
    }

    // Here you could add logic to transform the URL for optimization
    // For example, if using a CDN or image optimization service
    
    return imageUrl;
  }, []);

  return {
    getOptimizedUrl
  };
}