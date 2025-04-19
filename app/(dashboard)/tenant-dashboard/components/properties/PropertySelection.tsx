'use client'

import { useState, useEffect } from 'react';
import { FiFilter, FiX, FiHome } from 'react-icons/fi';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { motion } from 'framer-motion';
import { supabase } from '../../utils/supabase/client';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import PropertyFilters from '../navigation/Filter';
import Preferences from './Preferences';
import RecentlyAdded from './RecentlyAdded';
import AvailableProperties from './AvailableProperties';
import RentedProperties from './RentedProperties';
import MessagedProperties from './MessagedProperties'; // Import the new component
import { Property } from '@/utils/types/property'; 
import { toast } from "@/app/(dashboard)/tenant-dashboard/hooks/use-toast";

// Constants - Modified for better performance
const CACHE_KEY = 'property_cache';
const CACHE_EXPIRY = 1000 * 60 * 15; // 15 minutes
const PAGE_SIZE = 10; // Reduced from 15 to 10 for better performance
const MAX_RENTED_PROPERTIES = 15; // Limit for rented properties display
const MIN_FILTERED_RESULTS = 5; // Minimum number of properties to show after filtering

const PropertiesSection = () => {
  // State for properties
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [availableProperties, setAvailableProperties] = useState<Property[]>([]);
  const [rentedProperties, setRentedProperties] = useState<Property[]>([]);
  const [recentlyAddedProperties, setRecentlyAddedProperties] = useState<Property[]>([]);
  const [preferredProperties, setPreferredProperties] = useState<Property[]>([]);
  const [messagedProperties, setMessagedProperties] = useState<Property[]>([]); // Add new state for messaged properties
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Filter states
  const [activeFilters, setActiveFilters] = useState({
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    location: ''
  });

  // Pagination states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Check and load from cache
  const loadFromCache = () => {
    try {
      const cacheData = localStorage.getItem(CACHE_KEY);
      if (cacheData) {
        const { properties, timestamp, totalCount } = JSON.parse(cacheData);
        const now = new Date().getTime();
        
        // Check if cache is still valid (not expired)
        if (now - timestamp < CACHE_EXPIRY) {
          // console.log(`Loading ${properties.length} properties from cache (${Math.round(cacheSize / 1024)} KB)`);
          return { properties, totalCount, fromCache: true };
        } else {
          // console.log("Cache expired, will fetch fresh data");
          // Clear expired cache to free up storage
          localStorage.removeItem(CACHE_KEY);
        }
      }
    } catch {
      // Reset cache on error
      localStorage.removeItem(CACHE_KEY);
    }
    
    return { properties: [], totalCount: 0, fromCache: false };
  };
  
  // Save to cache with size optimization
  const saveToCache = (properties: Property[], totalCount: number) => {
    try {
      const cacheData = {
        properties,
        timestamp: new Date().getTime(),
        totalCount
      };
      
      const cacheStr = JSON.stringify(cacheData);
      const cacheSize = new Blob([cacheStr]).size;
      
      // Only cache if it's a reasonable size (under 2MB)
      if (cacheSize < 2 * 1024 * 1024) {
        localStorage.setItem(CACHE_KEY, cacheStr);
        // console.log(`Saved ${properties.length} properties to cache (${Math.round(cacheSize / 1024)} KB)`);
      }
    } catch {
      // ignore
    }
  };

  // Improved function to fetch messaged properties using cached conversations
  const fetchMessagedProperties = async (userId: string) => {
    if (!userId) return;
    
    // console.log('=== FETCH MESSAGED PROPERTIES ===');
    // console.log('User ID:', userId);
    
    try {
      // First check if we have cached conversations in chat system
      const CONVERSATIONS_CACHE_KEY = `conversations-${userId}`;
      let conversationsData: Array<{ property_id: string }> | null = null;
      
      try {
        // Try to get conversations from localStorage first
        const cachedConversationsData = localStorage.getItem(CONVERSATIONS_CACHE_KEY);
        if (cachedConversationsData) {
          const parsedData = JSON.parse(cachedConversationsData);
          // console.log('Found cached conversations data:', parsedData);
          
          if (parsedData?.data && Array.isArray(parsedData.data)) {
            conversationsData = parsedData.data;
            // console.log(`Using ${conversationsData.length} cached conversations`);
          }
        }
      } catch {
        // ignore
      }
      
      // If no cached conversations, fetch directly from the database
      if (!conversationsData) {
        // console.log("Fetching conversations from database");
        const { data, error } = await supabase
          .from('property_conversations')
          .select('id, property_id, tenant_id, landlord_id')
          .eq('tenant_id', userId);
          
        if (error) {
          return;
        }
        
        conversationsData = data as Array<{ property_id: string }>;
        // console.log(`Fetched ${conversationsData?.length || 0} conversations from database`);
      }
      
      if (!conversationsData || conversationsData.length === 0) {
        // console.log('No conversations found for user');
        setMessagedProperties([]);
        return;
      }
      
      // Extract unique property IDs from conversations
      const propertyIds = [...new Set(
        conversationsData.map((conv) => 
          conv.property_id || (conv as any).property?.id
        ).filter(Boolean)
      )];
      
      // console.log(`Found ${propertyIds.length} unique property IDs from conversations:`, propertyIds);
      
      // If we have no property IDs, return empty array
      if (propertyIds.length === 0) {
        // console.log('No valid property IDs found in conversations');
        setMessagedProperties([]);
        return;
      }
      
      // First try to match with already loaded properties
      let matchedProperties: Property[] = [];
      if (allProperties.length > 0) {
        matchedProperties = allProperties.filter(
          property => propertyIds.includes(property.id)
        );
        
        // console.log(`Matched ${matchedProperties.length} properties with existing data`);
      }
      
      if (matchedProperties.length > 0) {
        setMessagedProperties(matchedProperties);
        return;
      }
      
      // If we couldn't match with loaded properties, fetch them separately
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .in('id', propertyIds);
        
      if (propertiesError) {
        return;
      }
      
      if (!propertiesData || propertiesData.length === 0) {
        setMessagedProperties([]);
        return;
      }
      
      // Transform properties to match our format
      const transformedProperties: Property[] = (propertiesData as Array<Record<string, unknown>>).map((item) => {
        // Make sure we have a valid image URL
        const imageUrl = Array.isArray(item.images) && item.images.length > 0 
          ? item.images[0] as string
          : (item.image as string) || '/placeholder-property.jpg';
          
        return {
          id: item.id as string,
          landlord_id: item.landlord_id as string,
          name: (item.name as string) || 'Unnamed Property',
          location: (item.location as string) || 'Unknown Location',
          property_type: (item.property_type as string) || 'apartment',
          bedrooms: Number(item.bedrooms) || 0,
          bathrooms: Number(item.bathrooms) || 0,
          description: (item.description as string) || '',
          monthly_rent: Number(item.monthly_rent) || 0,
          security_deposit: Number(item.security_deposit) || 0,
          utilities: (item.utilities as Property['utilities']) || {
            water: false,
            electricity: false,
            internet: false,
            gas: false,
            trash: false,
            cable: false
          },
          images: Array.isArray(item.images) ? item.images as string[] : ['/placeholder-property.jpg'],
          image: imageUrl,
          available: !!item.available,
          status: (item.status as 'active' | 'archived' | 'pending' | 'rented') || 'active',
          created_at: item.created_at as string,
          updated_at: item.updated_at as string,
          amenities: parseAmenities(item.amenities as string[]),
          rules: (item.rules as string[]) || [],
          next_available_date: item.next_available_date as string,
          availability: getAvailabilityLabel(!!item.available, (item.status as string) || ''),
          imageErrorHandler: (e: React.SyntheticEvent<HTMLImageElement>) => {
            e.currentTarget.src = '/placeholder-property.jpg';
          }
        };
      });
      
      setMessagedProperties(transformedProperties);
      
    } catch {
      setMessagedProperties([]);
    }
  };

  // Get the current user
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function getCurrentUser() {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
      }
    }
    
    getCurrentUser();
  }, []);
  
  // Extract fetchProperties to a named function to avoid duplication
  const fetchProperties = async (pageNum = 1, refresh = false) => {
    try {
      // Check if we should use cached data for first page
      if (pageNum === 1 && !refresh) {
        const { properties, totalCount, fromCache } = loadFromCache();
        if (fromCache && properties.length > 0) {
          processProperties(properties, totalCount);
          return;
        }
      }
      
      setLoading(pageNum === 1);
      if (pageNum > 1) setIsLoadingMore(true);
      
      // Calculate pagination
      const from = (pageNum - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      
      // Get properties with pagination
      const { data, error, count } = await supabase
        .from('properties')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);
        
      if (error) {
        setError(error.message || 'Failed to load properties');
        toast({
          title: 'Error fetching properties',
          description: error.message || 'Failed to load properties. Please try again.'
        });
        setLoading(false);
        setIsLoadingMore(false);
        return;
      }
      
      if (!data || data.length === 0) {
        if (pageNum === 1) {
          setAllProperties([]);
          setPreferredProperties([]);
          setHasMore(false);
        } else {
          setHasMore(false);
        }
        setLoading(false);
        setIsLoadingMore(false);
        return;
      }
      
      // Create a function to handle image errors
      const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        // Use default fallback image
        e.currentTarget.src = '/placeholder-property.jpg';
        // If the fallback also fails, remove the image element and show a div with error icon
        e.currentTarget.onerror = () => {
          const parent = e.currentTarget.parentElement;
          if (parent) {
            e.currentTarget.style.display = 'none';
            const fallbackDiv = document.createElement('div');
            fallbackDiv.className = 'absolute inset-0 bg-gray-900 flex items-center justify-center';
            fallbackDiv.innerHTML = `
              <div class="flex flex-col items-center text-white/60">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-8 h-8 mb-2">
                  <path d="M2 12s1-3 5-3 5 3 8 3 5-3 5-3"></path>
                  <line x1="2" y1="20" x2="22" y2="20"></line>
                </svg>
                <span class="text-xs">Image unavailable</span>
              </div>
            `;
            parent.appendChild(fallbackDiv);
          }
        };
      };

      // Transform database properties to match our Property interface
      const transformedProperties: Property[] = (data as Array<Record<string, unknown>>).map((item) => {
        // Get first image or fallback
        const imageUrl = Array.isArray(item.images) && item.images.length > 0 
          ? item.images[0] as string
          : '/placeholder-property.jpg';
          
        return {
          id: item.id as string,
          landlord_id: item.landlord_id as string,
          name: (item.name as string) || 'Unnamed Property',
          location: (item.location as string) || 'Unknown Location',
          property_type: (item.property_type as string) || 'apartment',
          bedrooms: Number(item.bedrooms) || 0,
          bathrooms: Number(item.bathrooms) || 0,
          description: (item.description as string) || '',
          monthly_rent: Number(item.monthly_rent) || 0,
          security_deposit: Number(item.security_deposit) || 0,
          utilities: (item.utilities as Property['utilities']) || {
            water: false,
            electricity: false,
            internet: false,
            gas: false,
            trash: false,
            cable: false
          },
          images: Array.isArray(item.images) ? item.images as string[] : ['/placeholder-property.jpg'], // Ensure this is always a non-empty array
          image: imageUrl,
          available: !!item.available,
          status: (item.status as 'active' | 'archived' | 'pending' | 'rented') || 'active',
          created_at: item.created_at as string,
          updated_at: item.updated_at as string,
          amenities: parseAmenities(item.amenities as string[]),
          rules: (item.rules as string[]) || [],
          next_available_date: item.next_available_date as string,
          availability: getAvailabilityLabel(!!item.available, (item.status as string) || ''),
          imageErrorHandler: handleImageError
        };
      });
      
      // If this is the first page, save to cache
      if (pageNum === 1) {
        saveToCache(transformedProperties, count || 0);
      }
      
      // Process fetched properties
      processProperties(
        pageNum === 1 ? transformedProperties : [...allProperties, ...transformedProperties],
        count || 0
      );
      
      // After loading properties, fetch messaged properties if we have a user ID
      if (userId && pageNum === 1) {
        fetchMessagedProperties(userId);
      }
      
    } catch (err) {
      console.error('Unexpected error fetching properties:', err);
      setError('An unexpected error occurred while fetching properties.');
      toast({
        title: 'Unexpected error',
        description: 'An unexpected error occurred while fetching properties. Please try again.'
      });
      setLoading(false);
      setIsLoadingMore(false);
    }
  };
  
  const processProperties = (properties: Property[], count: number) => {
    setAllProperties(properties);
    setHasMore(properties.length < count);
    
    // 1. Your Preferences - based on filters (initially empty)
    applyFilters(properties, activeFilters);
    
    // 2. Recently Added Properties - available properties from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 1);
    const recent = properties.filter(p => {
      const createdDate = new Date(p.created_at);
      return createdDate > sevenDaysAgo && p.available === true && p.status === 'active';
    });
    setRecentlyAddedProperties(recent);
    
    // 3. Available Properties - all available properties
    const available = properties.filter(p => p.available === true && p.status === 'active');
    setAvailableProperties(available);
    
    // 4. Rented Properties - limited to MAX_RENTED_PROPERTIES
    const rented = properties
      .filter(p => p.status === 'rented' || p.available === false)
      .slice(0, MAX_RENTED_PROPERTIES); // Limit to maximum display count
    setRentedProperties(rented);
    
    // 5. After processing properties, also refresh messaged properties
    if (userId) {
      fetchMessagedProperties(userId);
    }
    
    setLoading(false);
    setIsLoadingMore(false);
  };

  // Load more properties
  const loadMore = () => {
    if (hasMore && !loading && !isLoadingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProperties(nextPage);
    }
  };

  // Refresh properties (force fetch from API)
  const refreshProperties = () => {
    setPage(1);
    fetchProperties(1, true);
  };

  // Use fetchProperties in your useEffect
  useEffect(() => {
    fetchProperties();
  }, []);

  // Filter handlers - with optimization to avoid unnecessary fetch
  const handleFilterChange = (filters: Record<string, string>) => {
    setActiveFilters({
      minPrice: filters.minPrice || '',
      maxPrice: filters.maxPrice || '',
      bedrooms: filters.bedrooms || '',
      location: filters.location || ''
    });
    
    // Apply filters to currently loaded properties
    const filteredResults = applyFiltersToProperties(allProperties, filters);
    
    // Check if we need to fetch more properties based on filter results
    if (filteredResults.length < MIN_FILTERED_RESULTS && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProperties(nextPage);
    }
    
    setIsFilterOpen(false);
  };

  // Separate filter application from state updates for better control
  const applyFiltersToProperties = (properties: Property[], filters: Record<string, string>): Property[] => {
    // Start with a deep copy of properties to avoid reference issues
    let filtered = [...properties];
    
    // First, filter for available properties only
    filtered = filtered.filter(p => p.available === true && p.status === 'active');
    
    // Apply price filters
    if (filters.minPrice) {
      const minPriceValue = parseInt(filters.minPrice);
      filtered = filtered.filter(p => p.monthly_rent >= minPriceValue);
    }
    
    if (filters.maxPrice) {
      const maxPriceValue = parseInt(filters.maxPrice);
      filtered = filtered.filter(p => p.monthly_rent <= maxPriceValue);
    }
    
    // Apply bedroom filter with exact matching for bedrooms
    if (filters.bedrooms) {
      if (filters.bedrooms === '5+') {
        // For 5+ bedrooms, use >= 5
        filtered = filtered.filter(p => p.bedrooms >= 5);
      } else {
        // For 1-4 bedrooms, use exact match with parseInt
        const bedroomValue = parseInt(filters.bedrooms);
        filtered = filtered.filter(p => p.bedrooms === bedroomValue);
      }
    }
    
    // Apply location filter
    if (filters.location) {
      const locationLower = filters.location.toLowerCase();
      filtered = filtered.filter(p => 
        p.location.toLowerCase().includes(locationLower));
    }
    
    // Return only the filtered results
    return filtered;
  };

  const applyFilters = (properties: Property[], filters: Record<string, string>) => {
    // Only run filter logic if there are active filters
    if (hasActiveFilters()) {
      const filtered = applyFiltersToProperties(properties, filters);
      setPreferredProperties(filtered);
    } else {
      // No active filters, clear preferred properties
      setPreferredProperties([]);
    }
  };

  // Force preferred properties to update when filters change
  useEffect(() => {
    applyFilters(allProperties, activeFilters);
  }, [activeFilters]);

  const clearFilters = () => {
    setActiveFilters({
      minPrice: '',
      maxPrice: '',
      bedrooms: '',
      location: ''
    });
    
    // Clear preferences by setting to empty array
    setPreferredProperties([]);
  };
  
  // Improved hasActiveFilters function to check filters properly
  const hasActiveFilters = () => {
    return activeFilters.minPrice !== '' || 
           activeFilters.maxPrice !== '' || 
           activeFilters.bedrooms !== '' || 
           activeFilters.location !== '';
  };
  
  // Calculate active filter count
  const activeFilterCount = Object.values(activeFilters).filter(val => val !== '').length;

  // Helper functions
  function parseAmenities(amenitiesArray: string[] | null): { name: string; icon: string }[] {
    if (!amenitiesArray || !Array.isArray(amenitiesArray)) return [];
    
    return amenitiesArray.map(amenity => ({
      name: amenity.charAt(0).toUpperCase() + amenity.slice(1),
      icon: mapAmenityToIcon(amenity)
    }));
  }
  
  function mapAmenityToIcon(amenity: string): string {
    const iconMap: Record<string, string> = {
      'wifi': 'wifi',
      'parking': 'car',
      'gym': 'dumbbell',
      'pool': 'droplet',
      'security': 'shield',
      'ac': 'thermometer',
      'laundry': 'shirt',
      'dishwasher': 'utensils',
      'elevator': 'arrow-up',
      'balcony': 'home',
      'garden': 'flower',
      'furniture': 'sofa',
    };
    
    const lowerCaseAmenity = amenity.toLowerCase();
    return iconMap[lowerCaseAmenity] || 'check';
  }
  
  function getAvailabilityLabel(available: boolean, status: string): 'Available' | 'Rented' | 'Coming Soon' {
    return status === 'pending' 
      ? 'Coming Soon' 
      : (status === 'rented' || !available) 
        ? 'Rented' 
        : 'Available';
  }

  // Simple loading skeleton components
  const PropertySectionSkeleton = () => (
    <div className="mb-16">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-8 w-48 bg-white/5" />
        <Skeleton className="h-8 w-24 bg-white/5" />
      </div>
      <div className="flex gap-5 overflow-x-hidden">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-72 min-w-[280px] md:min-w-[320px] rounded-xl bg-white/5" />
        ))}
      </div>
    </div>
  );

  // Simplify animation variant
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } }
  };

  // Update the useEffect to ensure we call fetchMessagedProperties with userId
  useEffect(() => {
    if (userId) {
      fetchMessagedProperties(userId);
    }
  }, [userId]);

  // Also make sure we fetch/refresh messaged properties when all properties change
  useEffect(() => {
    if (userId && allProperties.length > 0) {
      fetchMessagedProperties(userId);
    }
  }, [allProperties, userId]);

  // Add a listener for conversation updates
  useEffect(() => {
    const handleConversationUpdate = () => {
      if (userId) {
        fetchMessagedProperties(userId);
      }
    };
    
    window.addEventListener('conversationUpdated', handleConversationUpdate);
    
    return () => {
      window.removeEventListener('conversationUpdated', handleConversationUpdate);
    };
  }, [userId]);

  return (
    <section className="py-16 bg-black relative overflow-hidden">
      {/* Background grid pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white to-transparent"></div>
        {[...Array(10)].map((_, i) => (
          <div 
            key={i} 
            className="absolute w-px h-full bg-white/5"
            style={{ left: `${i * 10}%` }}
          ></div>
        ))}
      </div>
      
      <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10">
        <motion.div 
          className="max-w-7xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Discover Properties</h2>
            
            <div className="flex items-center gap-2">
              {/* Refresh button */}
              <button
                onClick={refreshProperties}
                className="md:ml-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white transition hidden md:flex items-center gap-1.5"
                disabled={loading}
              >
                <svg className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-sm">Refresh</span>
              </button>
              
              {/* Filter button and sheet */}
              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <button 
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white transition"
                  >
                    <FiFilter className="h-3.5 w-3.5" />
                    
                    {activeFilterCount > 0 && (
                      <span className="h-5 w-5 flex items-center justify-center bg-white text-black text-xs rounded-full font-medium">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                </SheetTrigger>
                <SheetContent 
                  side="right" 
                  className="w-[300px] sm:w-[400px] bg-black/95 backdrop-blur-xl border-l border-white/20 text-white"
                >
                  <SheetHeader className="border-b border-white/10 pb-4">
                    <SheetTitle className="text-white">Property Filters</SheetTitle>
                  </SheetHeader>
                  
                  <div className="py-6 space-y-6">
                    {/* Integrate PropertyFilters component */}
                    <div className="text-white">
                      <PropertyFilters 
                        onFilterChange={handleFilterChange}
                        initialFilters={activeFilters} 
                      />
                    </div>
                    
                    <div className="pt-4 flex justify-end">
                      <button
                        onClick={clearFilters}
                        className="py-2 px-4 bg-transparent border border-white/20 text-white rounded-lg hover:bg-white/10 transition-all flex items-center justify-center"
                      >
                        <FiX className="h-4 w-4 mr-2" />
                        Clear All
                      </button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
              
              {/* Active filters indicator */}
              {hasActiveFilters() && (
                <button 
                  onClick={clearFilters}
                  className="ml-3 md:flex items-center hidden text-xs text-white/70 hover:text-white underline underline-offset-2 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>
          
         
          
          {loading && page === 1 ? (
            // Loading skeleton for initial load
            <>
              <PropertySectionSkeleton />
              <PropertySectionSkeleton />
            </>
          ) : error ? (
            // Error state
            <div className="bg-red-900/30 border border-red-400/20 text-red-200 rounded-xl p-6 mb-10">
              <h3 className="font-medium text-lg mb-2">Error Loading Properties</h3>
              <p>{error}</p>
              <button 
                onClick={refreshProperties}
                className="mt-4 px-4 py-2 bg-red-800/50 hover:bg-red-700/50 rounded-lg text-sm"
              >
                Try Again
              </button>
            </div>
          ) : (
            // Property sections with improved styling
            <>
              <Preferences 
                preferredProperties={preferredProperties} 
                hasActiveFilters={hasActiveFilters()}
                clearFilters={clearFilters}
              />

              <RecentlyAdded 
                recentlyAddedProperties={recentlyAddedProperties}
              />
              
    
              <AvailableProperties 
                availableProperties={availableProperties}
              />

               {/* Explicitly check if messagedProperties has length before rendering */}
               {messagedProperties.length > 0 && (
                <div className="mt-8">
                  <MessagedProperties 
                    messagedProperties={messagedProperties} 
                    className="mt-4" 
                  />
                </div>
              )}
              
              <RentedProperties 
                rentedProperties={rentedProperties}
              />
              
              {/* No properties message */}
              {allProperties.length === 0 && !loading && (
                <div className="text-center py-16 bg-white/5 rounded-xl border border-white/10">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                    <FiHome className="h-8 w-8 text-white/30" />
                  </div>
                  <h3 className="text-xl font-medium text-white mb-2">No properties available</h3>
                  <p className="text-white/60 max-w-md mx-auto">
                    There are currently no properties in our database. Please check back later.
                  </p>
                </div>
              )}
              
              {/* Load more button - only for available properties */}
              {hasMore && !loading && !isLoadingMore && (
                <div className="mt-12 flex justify-center">
                  <Button
                    onClick={loadMore}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Load More Properties
                  </Button>
                </div>
              )}
              
              {/* Loading more indicator */}
              {isLoadingMore && (
                <div className="mt-12 flex justify-center">
                  <div className="flex items-center justify-center space-x-2 text-white/70">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Loading more properties...</span>
                  </div>
                </div>
              )}
             
            </>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default PropertiesSection;