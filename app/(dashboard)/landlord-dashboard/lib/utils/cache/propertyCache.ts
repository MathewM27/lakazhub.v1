import { Property, ImageMetadata } from "../../../types/index";

// Define cache structure to include ETags and image metadata
interface CacheData {
  propertyDetails: { [id: string]: { data: Property, timestamp: number, etag?: string, version?: number } };
  properties?: { data: Property[], timestamp: number, etag?: string };
  imageMetadata?: { [imageUrl: string]: { type: string, propertyId: string } };
}

// Cache stats for monitoring
export interface CacheStats {
  hits: number;
  misses: number;
  size: number; // in bytes
  lastAccessed: number;
  itemCount: number;
}

// Increased cache expiry for properties list (7 days)
// Since landlords are the only ones changing their properties, we can use the same expiration as property details
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

// Extended cache expiry for individual properties (7 days)
// Property details rarely change, so we can cache them for much longer
const PROPERTY_DETAILS_EXPIRY = 7 * 24 * 60 * 60 * 1000; 

// Max cache size (3MB)
const MAX_CACHE_SIZE = 3 * 1024 * 1024;

// Enable or disable detailed logging
const ENABLE_DETAILED_LOGS = true;

export class PropertyCache {
  private static CACHE_KEY = 'property_cache_v1';
  private static cache: CacheData = { propertyDetails: {} };
  private static stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    lastAccessed: Date.now(),
    itemCount: 0
  };
  
  // Track versions of each property to detect changes
  private static propertyVersions: { [id: string]: number } = {};
  
  // Event listeners for cache updates
  private static listeners: { [key: string]: Array<(data: any) => void> } = {};

  // Add a flag to track when cache is being cleared to prevent re-entrant behavior
  private static isClearingCache = false;

  /**
   * Log a message with the [PROPERTY_CACHE] prefix
   */
  private static log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    // No-op for production: remove all logs
  }
  
  /**
   * Summarize property data for logging (to avoid huge logs)
   */
  private static summarizeProperty(property: Property): string {
    return `[ID: ${property.id.substring(0, 6)}... | ${property.name} | ${property.images?.length || 0} images]`;
  }
  
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
        const propertyCount = Object.keys(this.cache.propertyDetails).length;
        const propertiesListCached = this.cache.properties?.data ? 'yes' : 'no';
        
        this.log(`Initialized property cache from localStorage with ${propertyCount} properties`);
        this.log(`Properties list cached: ${propertiesListCached}, ${this.cache.properties?.data?.length || 0} items`);
        
        if (propertyCount > 0) {
          this.log('Cached property IDs: ' + 
            Object.keys(this.cache.propertyDetails)
              .map(id => id.substring(0, 6) + '...')
              .join(', ')
          );
        }
        
        // Initialize property versions from cached data
        Object.keys(this.cache.propertyDetails).forEach(id => {
          const version = this.cache.propertyDetails[id].version || 0;
          this.propertyVersions[id] = version;
        });
        
        // Initialize stats
        const savedStats = localStorage.getItem(this.CACHE_KEY + '_stats');
        if (savedStats) {
          this.stats = JSON.parse(savedStats);
          this.log(`Cache stats loaded: ${this.stats.hits} hits, ${this.stats.misses} misses, ${Math.round(this.stats.size/1024)}KB size`);
        } else {
          // Calculate initial cache stats
          this.updateCacheStats();
        }
      } else {
        this.log('No existing cache found in localStorage, starting with empty cache');
      }
    } catch (error) {
      this.log(`Failed to load cache from localStorage: ${error}`, 'error');
      this.cache = { propertyDetails: {} };
      this.stats = {
        hits: 0,
        misses: 0,
        size: 0,
        lastAccessed: Date.now(),
        itemCount: 0
      };
      this.propertyVersions = {};
    }
  }
  
  /**
   * Update and save cache statistics
   */
  private static updateCacheStats() {
    try {
      const cacheString = JSON.stringify(this.prepareForStorage());
      this.stats.size = cacheString.length;
      this.stats.lastAccessed = Date.now();
      this.stats.itemCount = Object.keys(this.cache.propertyDetails).length + 
        (this.cache.properties ? 1 : 0);
      
      // Save stats to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.CACHE_KEY + '_stats', JSON.stringify(this.stats));
      }
    } catch (error) {
      // Removed: console.error('Error updating cache stats:', error);
    }
  }
  
  /**
   * Get current cache statistics
   */
  static getCacheStats(): CacheStats {
    this.updateCacheStats();
    return { ...this.stats };
  }
  
  /**
   * Register a listener for cache updates
   */
  static addEventListener(event: 'update', callback: (data: any) => void): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }
  
  /**
   * Remove a listener
   */
  static removeEventListener(event: 'update', callback: (data: any) => void): void {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }
  
  /**
   * Notify listeners of cache updates
   */
  private static notifyListeners(event: 'update', data: any): void {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          // Removed: console.error('Error in cache listener callback:', error);
        }
      });
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
        this.log(`Cache size (${Math.round(cacheString.length/1024)}KB) exceeds limit (${Math.round(MAX_CACHE_SIZE/1024)}KB), clearing older entries`, 'warn');
        this.pruneCache();
        return this.saveToStorage(); // Try saving again after pruning
      }
      
      localStorage.setItem(this.CACHE_KEY, cacheString);
      this.updateCacheStats();
      this.log(`Saved cache to localStorage (${Math.round(cacheString.length/1024)}KB)`);
    } catch (error) {
      this.log(`Failed to save cache to localStorage: ${error}`, 'error');
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
    
    // Preserve image metadata if it exists
    if (optimizedProperty.imageMetadata) {
      // Only keep metadata for the images we're keeping
      const keptMetadata: Record<string, ImageMetadata> = {};
      optimizedProperty.images.forEach(url => {
        if (optimizedProperty.imageMetadata?.[url]) {
          keptMetadata[url] = optimizedProperty.imageMetadata[url];
        }
      });
      optimizedProperty.imageMetadata = keptMetadata;
    }
    
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
    const removedIds = propertyIds.slice(0, removeCount);
    
    this.log(`Pruning ${removeCount} oldest entries from cache: ${removedIds.map(id => id.substring(0, 6) + '...').join(', ')}`);
    
    for (let i = 0; i < removeCount; i++) {
      delete this.cache.propertyDetails[propertyIds[i]];
    }
    
    this.updateCacheStats();
  }
  
  /**
   * Get all properties from cache with stale-while-revalidate support
   */
  static getProperties(): { 
    data: Property[] | null, 
    isCached: boolean, 
    isStale: boolean, 
    etag?: string 
  } {
    const now = Date.now();
    const cachedData = this.cache.properties;
    
    if (!cachedData) {
      this.stats.misses++;
      this.log('Properties list MISS - not found in cache', 'warn');
      return { data: null, isCached: false, isStale: false };
    }
    
    const isExpired = now - cachedData.timestamp > CACHE_EXPIRY;
    const ageInMinutes = Math.round((now - cachedData.timestamp) / (60 * 1000));
    
    if (isExpired) {
      // Data exists but is stale
      this.stats.hits++;
      this.log(`Properties list HIT (stale) - ${cachedData.data.length} properties, ${ageInMinutes} minutes old`);
      return { 
        data: cachedData.data, 
        isCached: true, 
        isStale: true,
        etag: cachedData.etag
      };
    }
    
    // Data is fresh
    this.stats.hits++;
    this.log(`Properties list HIT (fresh) - ${cachedData.data.length} properties, ${ageInMinutes} minutes old`);
    return { 
      data: cachedData.data, 
      isCached: true, 
      isStale: false,
      etag: cachedData.etag
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
    
    this.log(`Stored ${properties.length} properties in cache ${etag ? `with ETag: ${etag}` : '(no ETag)'}`);
    if (properties.length > 0) {
      this.log('First few properties: ' + 
        properties.slice(0, 3).map(p => this.summarizeProperty(p)).join(', ') + 
        (properties.length > 3 ? ` and ${properties.length - 3} more` : '')
      );
    }
    
    this.saveToStorage();
    this.notifyListeners('update', { type: 'properties', data: properties });
  }
  
  /**
   * Get a property from cache with stale-while-revalidate support
   * Uses longer expiration time for individual properties
   */
  static getProperty(id: string): { 
    data: Property | null, 
    isCached: boolean,
    isStale: boolean,
    etag?: string,
    version?: number
  } {
    const now = Date.now();
    const cachedProperty = this.cache.propertyDetails[id];
    
    if (!cachedProperty) {
      this.stats.misses++;
      this.log(`Property ${id.substring(0, 6)}... MISS - not found in cache`, 'warn');
      return { data: null, isCached: false, isStale: false };
    }
    
    // Use the much longer expiration time for property details
    const isExpired = now - cachedProperty.timestamp > PROPERTY_DETAILS_EXPIRY;
    const ageInMinutes = Math.round((now - cachedProperty.timestamp) / (60 * 1000));
    const ageInHours = Math.round(ageInMinutes / 60);
    const ageInDays = Math.round(ageInHours / 24);
    
    let ageDisplay = `${ageInMinutes}m`;
    if (ageInDays > 0) {
      ageDisplay = `${ageInDays}d`;
    } else if (ageInHours > 0) {
      ageDisplay = `${ageInHours}h`;
    }
    
    // Check if we have a version mismatch (property was updated elsewhere)
    const currentVersion = this.propertyVersions[id] || 0;
    const cachedVersion = cachedProperty.version || 0;
    const isVersionMismatch = currentVersion > cachedVersion;
    
    // If expired or version mismatch, mark as stale
    const isStale = isExpired || isVersionMismatch;
    
    if (isStale) {
      // Data exists but is stale
      this.stats.hits++;
      if (isVersionMismatch) {
        this.log(`Property ${id.substring(0, 6)}... HIT (stale) - version mismatch: ${cachedVersion} vs ${currentVersion}`);
      } else {
        this.log(`Property ${id.substring(0, 6)}... HIT (stale) - ${ageDisplay} old`);
      }
      this.log(`Property details: ${this.summarizeProperty(cachedProperty.data)}`);
      
      return { 
        data: cachedProperty.data, 
        isCached: true,
        isStale: true,
        etag: cachedProperty.etag,
        version: cachedVersion
      };
    }
    
    // Data is fresh
    this.stats.hits++;
    this.log(`Property ${id.substring(0, 6)}... HIT (fresh) - ${ageDisplay} old`);
    this.log(`Property details: ${this.summarizeProperty(cachedProperty.data)}`);
    
    return { 
      data: cachedProperty.data, 
      isCached: true,
      isStale: false,
      etag: cachedProperty.etag,
      version: cachedVersion
    };
  }
  
  /**
   * Set a property in cache with version tracking
   */
  static setProperty(property: Property, etag?: string): void {
    // Increment the property version
    const currentVersion = this.propertyVersions[property.id] || 0;
    const newVersion = currentVersion + 1;
    this.propertyVersions[property.id] = newVersion;
    
    // Store in cache with version
    this.cache.propertyDetails[property.id] = {
      data: property,
      timestamp: Date.now(),
      etag,
      version: newVersion
    };
    
    this.log(`Stored property ${property.id.substring(0, 6)}... in cache, version ${newVersion} ${etag ? `with ETag: ${etag}` : '(no ETag)'}`);
    this.log(`Property details: ${this.summarizeProperty(property)}`);
    
    // Save to storage and notify listeners
    this.saveToStorage();
    this.notifyListeners('update', { 
      type: 'property', 
      id: property.id, 
      data: property,
      version: newVersion
    });
    
    // Also update the properties list if it contains this property
    if (this.cache.properties?.data) {
      const propertyIndex = this.cache.properties.data.findIndex(p => p.id === property.id);
      if (propertyIndex >= 0) {
        // Replace the property in the array
        this.cache.properties.data = [
          ...this.cache.properties.data.slice(0, propertyIndex),
          property,
          ...this.cache.properties.data.slice(propertyIndex + 1)
        ];
        // Update timestamp to show it's been refreshed
        this.cache.properties.timestamp = Date.now();
        this.log(`Updated property in properties list cache as well`);
      }
    }
  }
  
  /**
   * Force update a property version to indicate it has changed
   * Use this when property is modified outside the cache
   */
  static markPropertyUpdated(id: string): void {
    // Skip marking during cache clearing
    if (this.isClearingCache) {
      return;
    }
    
    // Increment the version number to mark the property as changed
    const currentVersion = this.propertyVersions[id] || 0;
    this.propertyVersions[id] = currentVersion + 1;
    
    this.log(`Marked property ${id.substring(0, 6)}... as updated, new version: ${currentVersion + 1}`);
    
    // If the property is in cache, mark it as stale by setting an old timestamp
    if (this.cache.propertyDetails[id]) {
      this.cache.propertyDetails[id].timestamp = 0;
      this.log(`Set property cache timestamp to 0 to force refresh on next access`);
    }
    
    // Also update any occurrence in the properties collection
    if (this.cache.properties?.data) {
      const propertyIndex = this.cache.properties.data.findIndex(p => p.id === id);
      if (propertyIndex >= 0) {
        // Mark the entire properties collection for refresh
        this.cache.properties.timestamp = 0;
        this.log(`Also invalidated properties list cache due to property update`);
      }
    }
    
    this.saveToStorage();
    this.notifyListeners('update', { 
      type: 'property_version_change',
      id: id, 
      version: this.propertyVersions[id]
    });
  }
  
  /**
   * Update a specific property timestamp to force refresh
   */
  static invalidatePropertyCache(id: string): void {
    // Skip invalidation during cache clearing
    if (this.isClearingCache) {
      return;
    }
    
    if (this.cache.propertyDetails[id]) {
      this.cache.propertyDetails[id].timestamp = 0;
      this.log(`Invalidated cache for property ${id.substring(0, 6)}...`);
      
      // Also increment version to ensure any other components see the change
      this.markPropertyUpdated(id);
    }
  }
  
  /**
   * Clear all cache
   */
  static clearCache(): void {
    // Check if we're already in the process of clearing the cache
    if (this.isClearingCache) {
      this.log("Cache clear operation already in progress, skipping", 'warn');
      return;
    }
    
    try {
      this.isClearingCache = true;
      
      const propertyCount = Object.keys(this.cache.propertyDetails).length;
      this.log(`Clearing entire cache with ${propertyCount} properties`);
      
      // Clear memory cache first
      this.cache = { propertyDetails: {} };
      this.propertyVersions = {};
      this.stats = {
        hits: 0,
        misses: 0,
        size: 0,
        lastAccessed: Date.now(),
        itemCount: 0
      };
      
      // Then clear localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem(this.CACHE_KEY);
          localStorage.removeItem(this.CACHE_KEY + '_stats');
        } catch (error) {
          this.log(`Failed to clear cache from localStorage: ${error}`, 'error');
        }
      }
      
      // Finally notify listeners with a slight delay to prevent immediate reactions
      setTimeout(() => {
        this.notifyListeners('update', { type: 'clear' });
      }, 50);
      
      this.log("Cache successfully cleared");
    } finally {
      // Make sure the flag is reset even if an error occurs
      setTimeout(() => {
        this.isClearingCache = false;
      }, 500); // Add significant delay to ensure any pending operations complete
    }
  }
  
  /**
   * Get cache expiry settings
   */
  static getCacheSettings() {
    return {
      listExpiryMs: CACHE_EXPIRY,
      propertyExpiryMs: PROPERTY_DETAILS_EXPIRY,
      maxCacheSize: MAX_CACHE_SIZE
    };
  }

  /**
   * Get a detailed report of what's in the cache
   */
  static getDetailedCacheReport(): string {
    const propertyCount = Object.keys(this.cache.propertyDetails).length;
    const propertiesListCached = this.cache.properties?.data ? 'yes' : 'no';
    const propertiesListAge = this.cache.properties 
      ? Math.round((Date.now() - this.cache.properties.timestamp) / (60 * 1000))
      : 'n/a';
    
    let report = `===== PROPERTY CACHE REPORT =====\n`;
    report += `Total properties cached: ${propertyCount}\n`;
    report += `Properties list cached: ${propertiesListCached} (${propertiesListAge} minutes old)\n`;
    report += `Cache size: ${Math.round(this.stats.size/1024)}KB\n`;
    report += `Hits/Misses: ${this.stats.hits}/${this.stats.misses}\n\n`;
    
    if (propertyCount > 0) {
      report += `Individual Properties:\n`;
      Object.entries(this.cache.propertyDetails).forEach(([id, propData]) => {
        const ageInMinutes = Math.round((Date.now() - propData.timestamp) / (60 * 1000));
        const ageInHours = Math.round(ageInMinutes / 60);
        const ageInDays = Math.round(ageInHours / 24);
        
        let ageDisplay = `${ageInMinutes}m`;
        if (ageInDays > 0) {
          ageDisplay = `${ageInDays}d`;
        } else if (ageInHours > 0) {
          ageDisplay = `${ageInHours}h`;
        }
        
        report += `- ${id.substring(0, 8)}... | "${propData.data.name}" | ${ageDisplay} old | v${propData.version || 0}\n`;
      });
    }
    
    return report;
  }
  
  /**
   * Log a detailed report of what's in the cache
   */
  static logCacheContents(): void {
    // No-op for production: do not log cache contents
  }
}

// Initialize cache on module load
if (typeof window !== 'undefined') {
  PropertyCache.init();
}