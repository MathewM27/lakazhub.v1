import { supabase } from './client';
import { PropertyCache } from '../cache/propertyCache';

export interface PropertyFormData {
  name: string;
  location: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  description: string;
  monthly_rent: number;
  security_deposit: number;
  utilities: {
    water: boolean;
    electricity: boolean;
    internet: boolean;
    gas: boolean;
    trash: boolean;
    cable: boolean;
  };
  images: string[]; // Array of image URLs
  available: boolean;
  status?: 'active' | 'archived' | 'pending' | 'rented';
}

export class PropertyAPI {
  private static cache: { 
    properties?: { data: PropertyFormData[], timestamp: number },
    propertyDetails?: { [id: string]: { data: PropertyFormData, timestamp: number } }
  } = {};
  
  // Cache time in milliseconds (5 minutes)
  private static CACHE_TIME = 5 * 60 * 1000;

  /**
   * Get all properties for the current landlord with caching
   */
  static async getProperties(forceRefresh = false): Promise<PropertyFormData[]> {
    try {
      // Check cache first if not forcing refresh
      const now = Date.now();
      if (!forceRefresh && 
          this.cache.properties && 
          (now - this.cache.properties.timestamp) < this.CACHE_TIME) {
        return this.cache.properties.data;
      }
      
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data: propertiesData, error } = await supabase
        .from('properties')
        .select('*')
        .eq('landlord_id', session.user.id);
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Update cache with direct Supabase data
      this.cache.properties = {
        data: (propertiesData as PropertyFormData[]) || [],
        timestamp: now
      };
      
      return (propertiesData as PropertyFormData[]) || [];
    } catch (error) {
      return []; // Return empty array on error
    }
  }

  /**
   * Get a single property by ID with caching
   */
  static async getProperty(id: string, forceRefresh = false): Promise<PropertyFormData> {
    try {
      // Check cache first if not forcing refresh
      const now = Date.now();
      if (!forceRefresh && 
          this.cache.propertyDetails && 
          this.cache.propertyDetails[id] && 
          (now - this.cache.propertyDetails[id].timestamp) < this.CACHE_TIME) {
        return this.cache.propertyDetails[id].data;
      }

      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Direct Supabase query
      const { data: property, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }
      
      // Initialize propertyDetails cache if it doesn't exist
      if (!this.cache.propertyDetails) {
        this.cache.propertyDetails = {};
      }
      
      // Update cache
      this.cache.propertyDetails[id] = {
        data: property as PropertyFormData,
        timestamp: now
      };
      
      return property as PropertyFormData;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new property
   */
  static async createProperty(propertyData: PropertyFormData): Promise<PropertyFormData> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Add landlord_id to the property data
      const completePropertyData = {
        ...propertyData,
        landlord_id: session.user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Direct database insert
      const { data, error } = await supabase
        .from('properties')
        .insert([completePropertyData])
        .select()
        .single();
        
      if (error) {
        throw new Error(`Failed to create property: ${error.message}`);
      }
      
      // Clear cache to ensure fresh data on next fetch
      this.invalidateCache();
      
      return data as PropertyFormData;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update an existing property
   */
  static async updateProperty(id: string, propertyData: Partial<PropertyFormData>): Promise<PropertyFormData> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }
      
      // Direct database update
      const { data, error } = await supabase
        .from('properties')
        .update({
          ...propertyData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        throw new Error(`Failed to update property: ${error.message}`);
      }
      
      // Clear cache to ensure fresh data on next fetch
      this.invalidateCache();
      
      // Also update in PropertyCache
      if (data) {
        PropertyCache.markPropertyUpdated(id);
        PropertyCache.setProperty(data);
      }
      
      return data as PropertyFormData;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a property
   */
  static async deleteProperty(id: string): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete property: ${error.message}`);
      }
      
      // Invalidate properties cache
      if (this.cache.properties) {
        this.cache.properties.timestamp = 0;
      }
      
      // Remove from property details cache if exists
      if (this.cache.propertyDetails && this.cache.propertyDetails[id]) {
        delete this.cache.propertyDetails[id];
      }
      
      // Also update PropertyCache
      PropertyCache.invalidatePropertyCache(id);
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Clear all cached data
   */
  static clearCache(): void {
    this.cache = {};
  }

  /**
   * Invalidate all cached data
   */
  static invalidateCache(): void {
    if (this.cache.properties) {
      this.cache.properties.timestamp = 0;
    }
  }
}