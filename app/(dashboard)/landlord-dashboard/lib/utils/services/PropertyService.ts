import { supabase } from "../supabase/client";
import { ImageStorage } from "../imageStorage";
import { PropertyCache } from '../cache/propertyCache';
import { Property } from '../../../types/index';

// Completely simplified service that uses only Supabase directly
export const PropertyService = {
  /**
   * Get all properties belonging to the current landlord
   */
  getAllProperties: async (forceRefresh = false): Promise<Property[]> => {
    try {
      // Check if we have a valid session
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        return [];
      }
      
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const { data: cachedData, isCached, isStale } = PropertyCache.getProperties();
        
        if (isCached && cachedData) {
          // If data exists but is stale, start background refresh
          if (isStale) {
            console.log('Stale cache found, returning cached data while refreshing in background');
            // Don't await - let this run in background with a small delay to prevent immediate execution
            setTimeout(() => {
              fetchPropertiesViaSupabase(sessionData.session!.user.id);
            }, 100); // Add a delay to prevent immediate execution
          }
          return cachedData;
        }
      }
      
      // If we get here, we need fresh data
      return await fetchPropertiesViaSupabase(sessionData.session.user.id);
    } catch (error) {
      console.error('Error fetching properties:', error);
      throw error;
    }
  },
  
  /**
   * Get a specific property by ID
   */
  getPropertyById: async (id: string, forceRefresh = false): Promise<Property> => {
    try {
      // Check cache first
      if (!forceRefresh) {
        const { data: cachedProperty, isCached, isStale } = PropertyCache.getProperty(id);
        
        if (isCached && cachedProperty) {
          // If data exists but is stale, start background refresh
          if (isStale) {
            console.log(`Stale cache found for property ${id}, returning cached data while refreshing in background`);
            // Don't await - let this run in background
            setTimeout(() => {
              fetchPropertyViaSupabase(id);
            }, 10);
          }
          return cachedProperty;
        }
      }
      
      // If we get here, we need fresh data
      return await fetchPropertyViaSupabase(id);
    } catch (error) {
      console.error(`Error fetching property ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Create a new property
   */
  createProperty: async (propertyData: Omit<Property, 'id'>): Promise<Property> => {
    try {
      // Get auth status
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        throw new Error('Authentication required');
      }
      
      // Ensure images array is present
      if (!propertyData.images) {
        propertyData.images = [];
      }
      
      // Add timestamps and landlord_id
      const completeData = {
        ...propertyData,
        landlord_id: authData.user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('properties')
        .insert(completeData)
        .select('*')
        .single();
      
      if (error) {
        throw new Error(`Failed to create property: ${error.message}`);
      }
      
      // Update cache
      PropertyCache.setProperty(data);
      
      // Invalidate properties list cache
      PropertyCache.setProperties([], undefined);
      
      return data;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Update an existing property
   */
  updateProperty: async (id: string, propertyData: Partial<Property>): Promise<Property> => {
    try {
      // Add updated timestamp
      const updateData = {
        ...propertyData,
        updated_at: new Date().toISOString()
      };
      
      // Update the property with Supabase
      const { data, error } = await supabase
        .from('properties')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();
      
      if (error) {
        throw new Error(`Failed to update property: ${error.message}`);
      }
      
      // Mark property as updated in cache
      PropertyCache.markPropertyUpdated(id);
      PropertyCache.setProperty(data);
      
      return data;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Delete a property
   */
  deleteProperty: async (id: string): Promise<boolean> => {
    try {
      // Delete images first
      await ImageStorage.deleteAllPropertyImages(id);
      
      // Delete property from database
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw new Error(`Failed to delete property: ${error.message}`);
      }
      
      // Invalidate caches
      PropertyCache.invalidatePropertyCache(id);
      PropertyCache.setProperties([], undefined);
      
      return true;
    } catch (error) {
      console.error(`Error deleting property ${id}:`, error);
      throw error;
    }
  }
};

/**
 * Fetch properties via direct Supabase query
 */
async function fetchPropertiesViaSupabase(userId: string): Promise<Property[]> {
  console.log('Fetching properties via direct Supabase query');
  
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('landlord_id', userId)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching properties via Supabase:', error);
    throw error;
  }
  
  if (!data) {
    return [];
  }
  
  // Update cache with new data
  PropertyCache.setProperties(data);
  
  // Also store each individual property in the property details cache
  if (data && Array.isArray(data)) {
    data.forEach((property: Property) => {
      PropertyCache.setProperty(property);
    });
    
    console.log(`[PROPERTY_SERVICE] Cached ${data.length} individual properties via direct query`);
  }
  
  return data;
}

/**
 * Fetch a property by ID via direct Supabase query
 */
async function fetchPropertyViaSupabase(id: string): Promise<Property> {
  console.log(`Fetching property ${id} via direct Supabase query`);
  
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) {
    console.error('Error fetching property via Supabase:', error);
    throw error;
  }
  
  if (!data) {
    throw new Error(`Property ${id} not found`);
  }
  
  // Update cache with new data
  PropertyCache.setProperty(data);
  
  return data;
}

/**
 * Delete a property and all its associated images
 */
export async function deleteProperty(propertyId: string): Promise<{ success: boolean; error?: unknown }> {
  try {
    // Step 1: Delete all images from storage
    const imageResult = await ImageStorage.deleteAllPropertyImages(propertyId);
    if (!imageResult.success) {
      console.warn(`Failed to delete some property images, continuing with property deletion`);
    }
    
    // Step 2: Delete the property data from the database
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', propertyId);
    
    if (error) {
      console.error('Error deleting property data:', error);
      return { success: false, error };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Unexpected error in deleteProperty:', error);
    return { success: false, error };
  }
}