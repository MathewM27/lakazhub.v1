import { Property } from "../../../types/index";

// Define cache structure to include ETags
interface CacheData {
  propertyDetails: { [id: string]: { data: Property, timestamp: number } };
  properties?: { data: Property[], timestamp: number, etag?: string };
}


const CACHE_EXPIRY = 5 * 60 * 1000;
// Max cache size (3MB)
const MAX_CACHE_SIZE = 3 * 1024 * 1024;

export class PropertyCache {
  private static CACHE_KEY = 'property_cache_v1';
  private static cache: CacheData = { propertyDetails: {} };
  
  /**
   * Initialize cache from localStorage
   */
  static init() {
    // Only run in browser environment
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      const savedCache = localStorage.getItem(this.CACHE_KEY);
      if (savedCache) {
        this.cache = JSON.parse(savedCache);
        console.log('Initialized property cache from localStorage');
      }
    } catch (error) {
      console.error('Failed to load cache from localStorage:', error);
      this.cache = { propertyDetails: {} };
    }
  }
  
  
  private static saveToStorage(): void {
    // Only run in browser environment
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      const cacheString = JSON.stringify(this.prepareForStorage());
      
      // Check if cache size is too large
      if (cacheString.length > MAX_CACHE_SIZE) {
        console.warn('Cache size exceeds limit, clearing older entries');
        this.pruneCache();
        return this.saveToStorage(); // Try saving again after pruning
      }
      
      localStorage.setItem(this.CACHE_KEY, cacheString);
    } catch (error) {
      console.error('Failed to save cache to localStorage:', error);
    }
  }
  
  /**
   * Prepare cache for storage by removing unnecessary data
   */
  private static prepareForStorage(): CacheData {
    // Deep clone the cache to avoid modifying the original
    const preparedCache: CacheData = JSON.parse(JSON.stringify(this.cache));
    
    // Optimize property details
    for (const id in preparedCache.propertyDetails) {
      if (preparedCache.propertyDetails[id].data) {
        preparedCache.propertyDetails[id].data = 
          this.optimizePropertyForCache(preparedCache.propertyDetails[id].data);
      }
    }
    
    // Optimize properties list
    if (preparedCache.properties?.data) {
      preparedCache.properties.data = 
        this.optimizePropertiesForCache(preparedCache.properties.data);
    }
    
    return preparedCache;
  }
  
  /**
   * Optimize properties array for cache
   */
  private static optimizePropertiesForCache(properties: Property[]): Property[] {
    return properties.map(property => this.optimizePropertyForCache(property));
  }
  
  /**
   * Optimize a single property for cache by stripping large data
   */
  private static optimizePropertyForCache(property: Property): Property {
    // Clone the property to avoid modifying the original
    const optimizedProperty = { ...property };
    
    // Make sure we don't store excessive image data in cache
    if (optimizedProperty.images && optimizedProperty.images.length > 0) {
      // Keep only the first few images in the cache to save space
      optimizedProperty.images = optimizedProperty.images.slice(0, 3);
    }
    
    // No need to remove non-existent properties
    
    return optimizedProperty;
  }
  
  /**
   * Prune old entries from cache when it gets too large
   */
  private static pruneCache() {
    // Reset properties list cache
    if (this.cache.properties) {
      this.cache.properties.timestamp = 0;
    }
    
    // Remove older property details
    const propertyIds = Object.keys(this.cache.propertyDetails);
    
    // Sort by timestamp (oldest first)
    propertyIds.sort((a, b) => 
      this.cache.propertyDetails[a].timestamp - this.cache.propertyDetails[b].timestamp
    );
    
    // Remove oldest 50% of entries
    const removeCount = Math.floor(propertyIds.length / 2);
    for (let i = 0; i < removeCount; i++) {
      delete this.cache.propertyDetails[propertyIds[i]];
    }
    
    console.log(`Pruned ${removeCount} old cache entries`);
  }
  
  /**
   * Get all properties from cache
   */
  static getProperties(): { data: Property[] | null, isCached: boolean, etag?: string } {
    if (!this.cache.properties || 
        Date.now() - this.cache.properties.timestamp > CACHE_EXPIRY) {
      return { data: null, isCached: false };
    }
    
    return { 
      data: this.cache.properties.data, 
      isCached: true,
      etag: this.cache.properties.etag
    };
  }
  
  /**
   * Set properties in cache
   */
  static setProperties(properties: Property[], etag?: string): void {
    this.cache.properties = {
      data: properties,
      timestamp: Date.now(),
      etag
    };
    
    this.saveToStorage();
  }
  
  /**
   * Get a property from cache
   */
  static getProperty(id: string): { data: Property | null, isCached: boolean } {
    const cachedProperty = this.cache.propertyDetails[id];
    
    if (!cachedProperty || Date.now() - cachedProperty.timestamp > CACHE_EXPIRY) {
      return { data: null, isCached: false };
    }
    
    return { data: cachedProperty.data, isCached: true };
  }
  
  /**
   * Set a property in cache
   */
  static setProperty(property: Property): void {
    this.cache.propertyDetails[property.id] = {
      data: property,
      timestamp: Date.now()
    };
    
    this.saveToStorage();
  }
  
  /**
   * Update all properties timestamp to force refresh
   */
  static invalidatePropertiesCache(): void {
    if (this.cache.properties) {
      this.cache.properties.timestamp = 0;
    }
  }
  
  /**
   * Update a specific property timestamp to force refresh
   */
  static invalidatePropertyCache(id: string): void {
    if (this.cache.propertyDetails[id]) {
      this.cache.propertyDetails[id].timestamp = 0;
    }
  }
  
  /**
   * Clear all cache
   */
  static clearCache(): void {
    this.cache = { propertyDetails: {} };
    
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(this.CACHE_KEY);
      } catch (error) {
        console.error('Failed to clear cache from localStorage:', error);
      }
    }
  }
}

// Initialize cache on module load
if (typeof window !== 'undefined') {
  PropertyCache.init();
}