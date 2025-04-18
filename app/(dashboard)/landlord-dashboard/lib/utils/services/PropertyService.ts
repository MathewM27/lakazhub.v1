import { supabase } from "../supabase/client";
import { ImageStorage } from "../imageStorage";
import { PropertyCache } from '../cache/propertyCache';
import { Property } from '../../../types/index';

export const PropertyService = {
  /**
   * Get all properties belonging to the current landlord
   */
  getAllProperties: async (forceRefresh = false): Promise<Property[]> => {
    try {
      // console.log('getAllProperties called, forceRefresh:', forceRefresh);
      
      // Check if we have a valid session
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        // console.error('No active session found when trying to fetch properties');
        return [];
      }
      
      // console.log('User authenticated:', sessionData.session.user.id);
      
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const { data: cachedData, isCached } = PropertyCache.getProperties();
        if (isCached && cachedData) {
          // console.log('Using cached properties data, count:', cachedData.length);
          return cachedData;
        }
      }
      
      // Try direct Supabase query (uses RLS policies)
      // console.log('Fetching properties directly from database for user:', sessionData.session.user.id);
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('landlord_id', sessionData.session.user.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        // console.error('Error fetching properties from database:', error);
        throw error;
      }
      
      if (!data) {
        // console.log('No data returned from properties query');
        return [];
      }
      
      // console.log(`Fetched ${data.length} properties`);
      
      // Update cache
      PropertyCache.setProperties(data);
      
      return data;
    } catch (error) {
      // console.error('Error fetching properties:', error);
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
        const { data: cachedProperty, isCached } = PropertyCache.getProperty(id);
        if (isCached && cachedProperty) {
          // console.log(`Using cached property data for ${id}`);
          return cachedProperty;
        }
      }
      
      // Direct Supabase query
      // console.log(`Fetching property ${id} from database`);
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        // console.error(`Error fetching property ${id}:`, error);
        throw error;
      }
      
      if (!data) {
        throw new Error(`Property ${id} not found`);
      }
      
      // Update cache
      PropertyCache.setProperty(data);
      
      return data;
    } catch (error) {
      // console.error(`Error fetching property ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Create a new property
   */
  createProperty: async (propertyData: Omit<Property, 'id'>): Promise<Property> => {
    // console.log('PropertyService: Creating new property');
    // console.log('Property data:', JSON.stringify(propertyData, null, 2));
    
    try {
      // Try direct API approach first
      try {
        // Get auth session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('Not authenticated');
        }
        
        // console.log(`Creating property for user: ${session.user.id}`);
        
        // Ensure images array is present
        if (!propertyData.images) {
          // console.warn('No images array in property data, initializing empty array');
          propertyData.images = [];
        }
        
        // console.log(`Inserting property with ${propertyData.images.length} image URLs`);
        // console.log('Image URLs to save:', propertyData.images);
        
        // Make the request
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/properties`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(propertyData)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create property');
        }
        
        const result = await response.json();
        const newProperty = result.data;
        
        // console.log('Property created successfully:', newProperty);
        
        // Invalidate properties cache since we added a new one
        PropertyCache.setProperties([], undefined);
        
        return newProperty;
      } catch (_apiError) {
        // console.warn('API approach failed, falling back to direct Supabase:', _apiError);
        
        // Fallback to direct Supabase approach
        // Check auth status
        const { data: authData } = await supabase.auth.getUser();
        if (!authData?.user) {
          // console.error('Authentication required');
          throw new Error('Authentication required');
        }
        
        // console.log(`Creating property for user: ${authData.user.id}`);
        
        // Ensure images array is present
        if (!propertyData.images) {
          // console.warn('No images array in property data, initializing empty array');
          propertyData.images = [];
        }
        
        // console.log(`Inserting property with ${propertyData.images.length} image URLs`);
        // console.log('Image URLs to save:', propertyData.images);
        
        const { data, error } = await supabase
          .from('properties')
          .insert({
            ...propertyData,
            landlord_id: authData.user.id
          })
          .select('*')
          .single();
        
        if (error) {
          // console.error('Error creating property:', error);
          throw new Error(`Failed to create property: ${error.message}`);
        }
        
        // console.log('Property created successfully:', data);
        return data;
      }
    } catch (error) {
      // console.error('Error creating property:', error);
      throw error;
    }
  },
  
  /**
   * Update an existing property
   */
  updateProperty: async (id: string, propertyData: Partial<Property>): Promise<Property> => {
    // console.log(`PropertyService: Updating property ${id}`);
    // console.log('Update data:', JSON.stringify(propertyData, null, 2));
    
    try {
      // Try API approach first
      try {
        // Get auth session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('Not authenticated');
        }
        
        // Ensure images array is handled properly if present
        if (propertyData.images) {
          // console.log(`Updating property with ${propertyData.images.length} image URLs`);
          // console.log('Image URLs to save:', propertyData.images);
        }
        
        // Make the request
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/properties/${id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(propertyData)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update property');
        }
        
        const result = await response.json();
        const updatedProperty = result.data;
        
        // console.log('Property updated successfully:', updatedProperty);
        
        // Invalidate caches since data changed
        PropertyCache.invalidatePropertyCache(id);
        PropertyCache.setProperties([], undefined);
        
        return updatedProperty;
      } catch (_apiError) {
        // console.warn('API approach failed, falling back to direct Supabase:', _apiError);
        
        // Fallback to direct Supabase approach
        // Ensure images array is handled properly if present
        if (propertyData.images) {
          // console.log(`Updating property with ${propertyData.images.length} image URLs`);
          // console.log('Image URLs to save:', propertyData.images);
        }
        
        const { data, error } = await supabase
          .from('properties')
          .update(propertyData)
          .eq('id', id)
          .select('*')
          .single();
        
        if (error) {
          // console.error('Error updating property:', error);
          throw new Error(`Failed to update property: ${error.message}`);
        }
        
        // console.log('Property updated successfully:', data);
        return data;
      }
    } catch (error) {
      // console.error(`Error updating property ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Delete a property
   */
  deleteProperty: async (id: string): Promise<boolean> => {
    try {
      // Get auth session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }
      
      // Make the request
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/properties/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete property');
      }
      
      // Invalidate caches since data changed
      PropertyCache.invalidatePropertyCache(id);
      PropertyCache.setProperties([], undefined);
      
      return true;
    } catch (error) {
      // console.error(`Error deleting property ${id}:`, error);
      throw error;
    }
  }
};

/**
 * Delete a property and all its associated images
 * @param propertyId The ID of the property to delete
 * @returns Promise with success status and error if any
 */
export async function deleteProperty(propertyId: string): Promise<{ success: boolean; error?: unknown }> {
  try {
    // Step 1: Delete all images from storage
    const imageResult = await ImageStorage.deleteAllPropertyImages(propertyId);
    if (!imageResult.success) {
      // console.warn(`Failed to delete some property images, continuing with property deletion`);
    }
    
    // Step 2: Delete the property data from the database
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', propertyId);
    
    if (error) {
      // console.error('Error deleting property data:', error);
      return { success: false, error };
    }
    
    return { success: true };
  } catch (error) {
    // console.error('Unexpected error in deleteProperty:', error);
    return { success: false, error };
  }
}