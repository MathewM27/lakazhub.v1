import { supabase } from './client';

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
  private static API_URL = process.env.NEXT_PUBLIC_API_URL;
  private static cache: { 
    properties?: { data: any[], timestamp: number },
    propertyDetails?: { [id: string]: { data: any, timestamp: number } }
  } = {};
  
  // Cache time in milliseconds (5 minutes)
  private static CACHE_TIME = 5 * 60 * 1000;

  /**
   * Get all properties for the current landlord with caching
   */
  static async getProperties(forceRefresh = false): Promise<any[]> {
    try {
      // Check cache first if not forcing refresh
      const now = Date.now();
      if (!forceRefresh && 
          this.cache.properties && 
          (now - this.cache.properties.timestamp) < this.CACHE_TIME) {
        console.log("Using cached properties data");
        return this.cache.properties.data;
      }

      console.log("Fetching fresh properties data from API");
      
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      console.log("Making direct Supabase query instead of API call");
      
      // IMPORTANT FIX: Let's directly query Supabase instead of the API endpoint
      const { data: propertiesData, error } = await supabase
        .from('properties')
        .select('*')
        .eq('landlord_id', session.user.id);
      
      if (error) {
        console.error("Supabase query error:", error);
        throw new Error(error.message);
      }
      
      console.log("Raw Supabase properties result:", propertiesData);
      
      // Update cache with direct Supabase data
      this.cache.properties = {
        data: propertiesData || [],
        timestamp: now
      };
      
      return propertiesData || [];
    } catch (error) {
      console.error('Error fetching properties:', error);
      return []; // Return empty array on error
    }
  }

  /**
   * Get a single property by ID with caching
   */
  static async getProperty(id: string, forceRefresh = false): Promise<any> {
    try {
      // Check cache first if not forcing refresh
      const now = Date.now();
      if (!forceRefresh && 
          this.cache.propertyDetails && 
          this.cache.propertyDetails[id] && 
          (now - this.cache.propertyDetails[id].timestamp) < this.CACHE_TIME) {
        console.log(`Using cached property data for id: ${id}`);
        return this.cache.propertyDetails[id].data;
      }

      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${this.API_URL}/api/properties/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Server responded with status: ${response.status}`);
      }

      const data = await response.json();
      const property = data.property;
      
      // Initialize propertyDetails cache if it doesn't exist
      if (!this.cache.propertyDetails) {
        this.cache.propertyDetails = {};
      }
      
      // Update cache
      this.cache.propertyDetails[id] = {
        data: property,
        timestamp: now
      };
      
      return property;
    } catch (error) {
      console.error(`Error fetching property ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new property
   */
  static async createProperty(propertyData: PropertyFormData): Promise<any> {
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

      console.log('Creating property with data:', completePropertyData);
      
      // Direct database insert
      const { data, error } = await supabase
        .from('properties')
        .insert([completePropertyData])
        .select()
        .single();
        
      if (error) {
        console.error('Error creating property:', error);
        throw new Error(`Failed to create property: ${error.message}`);
      }
      
      console.log('Property created successfully:', data);
      
      // Clear cache to ensure fresh data on next fetch
      this.invalidateCache();
      
      return data;
    } catch (error) {
      console.error('Error in property creation:', error);
      throw error;
    }
  }

  /**
   * Update an existing property
   */
  static async updateProperty(id: string, propertyData: Partial<PropertyFormData>): Promise<any> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      console.log(`Updating property ${id} with data:`, propertyData);
      
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
        console.error(`Error updating property ${id}:`, error);
        throw new Error(`Failed to update property: ${error.message}`);
      }
      
      console.log('Property updated successfully:', data);
      
      // Clear cache to ensure fresh data on next fetch
      this.invalidateCache();
      
      return data;
    } catch (error) {
      console.error(`Error in property update for ${id}:`, error);
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

      const response = await fetch(`${this.API_URL}/api/properties/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete property');
      }
      
      // Invalidate properties cache
      if (this.cache.properties) {
        this.cache.properties.timestamp = 0;
      }
      
      // Remove from property details cache if exists
      if (this.cache.propertyDetails && this.cache.propertyDetails[id]) {
        delete this.cache.propertyDetails[id];
      }
      
    } catch (error) {
      console.error(`Error deleting property ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Upload property images
   */
  static async uploadPropertyImages(propertyId: string, files: File[]): Promise<any> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }
      
      // Create form data
      const formData = new FormData();
      
      // Add all files
      files.forEach((file, index) => {
        formData.append(`images`, file);
      });
      
      const response = await fetch(`${this.API_URL}/api/properties/${propertyId}/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload images');
      }
      
      const data = await response.json();
      
      // Invalidate both caches
      if (this.cache.properties) {
        this.cache.properties.timestamp = 0;
      }
      
      if (this.cache.propertyDetails && this.cache.propertyDetails[propertyId]) {
        this.cache.propertyDetails[propertyId].timestamp = 0;
      }
      
      return data.images;
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    }
  }
  
  /**
   * Update property availability
   */
  static async updateAvailability(id: string, available: boolean): Promise<any> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${this.API_URL}/api/properties/${id}/availability`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ available })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update property availability');
      }

      const data = await response.json();
      
      // Invalidate both caches
      if (this.cache.properties) {
        this.cache.properties.timestamp = 0;
      }
      
      if (this.cache.propertyDetails && this.cache.propertyDetails[id]) {
        this.cache.propertyDetails[id].timestamp = 0;
      }
      
      return data.property;
    } catch (error) {
      console.error(`Error updating property availability ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Clear all cached data
   */
  static clearCache(): void {
    this.cache = {};
    console.log("API cache cleared");
  }

  /**
   * Invalidate all cached data
   */
  static invalidateCache(): void {
    if (this.cache.properties) {
      this.cache.properties.timestamp = 0;
    }
    console.log("API cache invalidated");
  }
}