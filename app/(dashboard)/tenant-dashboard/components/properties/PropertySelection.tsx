'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FiFilter, FiX, FiHome } from 'react-icons/fi';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { motion } from 'framer-motion';
import { supabase } from '../../utils/supabase/client';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import dynamic from 'next/dynamic';
import Preferences from './Preferences';
import RecentlyAdded from './RecentlyAdded';
import AvailableProperties from './AvailableProperties';
import RentedProperties from './RentedProperties';
import MessagedProperties from './MessagedProperties';
import { Property } from '@/utils/types/property'; 
import { toast } from "@/app/(dashboard)/tenant-dashboard/hooks/use-toast";

// Dynamically import rarely-used filter UI
const PropertyFilters = dynamic(() => import('../navigation/Filter'), { ssr: false });
const PropertyDetailModal = dynamic(() => import('./PropertyDetail'), { ssr: false });
const TenantMessage = dynamic(() => import('./message/messageProperty'), { ssr: false });

const CACHE_KEY = 'property_cache';
const CACHE_EXPIRY = 1000 * 60 * 30; // 30 minutes
const PAGE_SIZE = 10;
const MAX_RENTED_PROPERTIES = 15;
const MIN_FILTERED_RESULTS = 5;

// --- Helper functions moved outside component ---
function parseAmenities(amenitiesArray: string[] | null): { name: string; icon: string }[] {
  if (!amenitiesArray || !Array.isArray(amenitiesArray)) return [];
  return amenitiesArray.map(amenity => ({
    name: amenity.charAt(0).toUpperCase() + amenity.slice(1),
    icon: mapAmenityToIcon(amenity)
  }));
}
function mapAmenityToIcon(amenity: string): string {
  const iconMap: Record<string, string> = {
    'wifi': 'wifi', 'parking': 'car', 'gym': 'dumbbell', 'pool': 'droplet',
    'security': 'shield', 'ac': 'thermometer', 'laundry': 'shirt',
    'dishwasher': 'utensils', 'elevator': 'arrow-up', 'balcony': 'home',
    'garden': 'flower', 'furniture': 'sofa',
  };
  return iconMap[amenity.toLowerCase()] || 'check';
}
function getAvailabilityLabel(available: boolean, status: string): 'Available' | 'Rented' | 'Coming Soon' {
  return status === 'pending' 
    ? 'Coming Soon' 
    : (status === 'rented' || !available) 
      ? 'Rented' 
      : 'Available';
}
// --- End helpers ---

const PropertySectionSkeleton = React.memo(() => (
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
));

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } }
};

// Memoized PropertyCard import (already memoized in property-layout/PropertyCard.tsx)
import { PropertyCard } from './property-layout/PropertyCard';

const PropertiesSection = () => {
  // ...existing code...
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({ minPrice: '', maxPrice: '', bedrooms: '', location: '' });
  const [userId, setUserId] = useState<string | null>(null);
  const [messagedProperties, setMessagedProperties] = useState<Property[]>([]);
  const [isUsingCache, setIsUsingCache] = useState(false);

  // --- Property cache helpers ---
  function loadPropertiesFromCache(): Property[] | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      const { data, timestamp } = JSON.parse(cached);
      if (!data || !timestamp) return null;
      if (Date.now() - timestamp > CACHE_EXPIRY) return null;
      return data as Property[];
    } catch {
      return null;
    }
  }
  function savePropertiesToCache(data: Property[]) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
    } catch {}
  }
  function clearPropertiesCache() {
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch {}
  }
  // --- End cache helpers ---

  // --- Fetch all properties with cache ---
  const fetchAllProperties = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      let useCache = !forceRefresh;
      let cached = null;
      if (useCache) {
        cached = loadPropertiesFromCache();
        if (cached && Array.isArray(cached)) {
          setAllProperties(cached);
          setIsUsingCache(true); // <-- Set cache indicator
          setLoading(false);
          // Stale-while-revalidate: fetch in background
          (async () => {
            const { data, error } = await supabase
              .from('properties')
              .select('*')
              .order('created_at', { ascending: false });
            if (!error && data && Array.isArray(data)) {
              setAllProperties(data as Property[]);
              setIsUsingCache(false); // <-- Reset cache indicator
              savePropertiesToCache(data as Property[]);
            }
          })();
          return;
        }
      }
      // No valid cache, fetch from Supabase
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        setError(error.message);
        setAllProperties([]);
        clearPropertiesCache();
        setIsUsingCache(false);
      } else {
        setAllProperties((data as Property[]) || []);
        setIsUsingCache(false);
        savePropertiesToCache((data as Property[]) || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch properties');
      setAllProperties([]);
      clearPropertiesCache();
      setIsUsingCache(false);
    } finally {
      setLoading(false);
    }
  }, []);
  // --- End fetch all properties with cache ---

  // --- useEffect: fetch user and properties on mount ---
  useEffect(() => {
    let mounted = true;
    async function getUserAndProperties() {
      const { data } = await supabase.auth.getUser();
      if (mounted && data?.user) setUserId(data.user.id);
      fetchAllProperties();
    }
    getUserAndProperties();
    return () => { mounted = false; };
  }, [fetchAllProperties]);
  // --- End useEffect ---

  // --- Memoized filtered lists ---
  const preferredProperties = useMemo(() => {
    if (!hasActiveFilters(activeFilters)) return [];
    // Ensure .availability is set for filtered properties
    return applyFiltersToProperties(allProperties, activeFilters).map(p => ({
      ...p,
      availability: getAvailabilityLabel(p.available, p.status || ''),
    }));
  }, [allProperties, activeFilters]);

  const recentlyAddedProperties = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 1);
    return allProperties.filter(p => {
      const createdDate = new Date(p.created_at);
      return createdDate > sevenDaysAgo && p.available === true && p.status === 'active';
    });
  }, [allProperties]);

  const availableProperties = useMemo(() => (
    allProperties.filter(p => p.available === true && p.status === 'active')
  ), [allProperties]);

  const rentedProperties = useMemo(() => (
    allProperties.filter(p => p.status === 'rented' || p.available === false).slice(0, MAX_RENTED_PROPERTIES)
  ), [allProperties]);

  const filteredProperties = useMemo(() => {
    if (!hasActiveFilters(activeFilters)) return allProperties;
    return applyFiltersToProperties(allProperties, activeFilters);
  }, [allProperties, activeFilters]);

  const paginatedProperties = useMemo(() => {
    const start = 0;
    const end = start + PAGE_SIZE;
    return filteredProperties.slice(start, end);
  }, [filteredProperties]);

  // --- End memoized lists ---

  // ...existing code for cache helpers...

  // --- useEffect: fetch user and properties on mount ---
  useEffect(() => {
    let mounted = true;
    async function getUserAndProperties() {
      const { data } = await supabase.auth.getUser();
      if (mounted && data?.user) setUserId(data.user.id);
      refreshProperties();
    }
    getUserAndProperties();
    return () => { mounted = false; };
  }, []);
  // --- End useEffect ---

  // --- Fetch messaged properties (memoized) ---
  const fetchMessagedProperties = useCallback(async (uid: string) => {
    if (!uid) {
      setMessagedProperties([]);
      return;
    }
    try {
      // Always fetch latest conversations for accuracy
      const { data: conversations, error: convError } = await supabase
        .from('property_conversations')
        .select('property_id')
        .eq('tenant_id', uid);
  
      if (convError || !conversations || conversations.length === 0) {
        setMessagedProperties([]);
        return;
      }
  
      const propertyIds = [...new Set(conversations.map((conv: { property_id: string }) => conv.property_id).filter(Boolean))];
      if (propertyIds.length === 0) {
        setMessagedProperties([]);
        return;
      }
  
      // Fetch property details directly from Supabase for these IDs
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .in('id', propertyIds);
  
      if (propertiesError || !propertiesData || propertiesData.length === 0) {
        setMessagedProperties([]);
        return;
      }
  
      // Transform properties for carousel
      const transformedProperties: Property[] = (propertiesData as Array<Record<string, any>>).map((item) => {
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
          price: Number(item.price) || 0, // Ensure price is included
          area: Number(item.area) || 0,  // Ensure area is included
        };
      });
  
      setMessagedProperties(transformedProperties);
    } catch {
      setMessagedProperties([]);
    }
  }, []);
  // --- End fetchMessagedProperties ---

  // --- Filter logic helpers (outside render) ---
  function hasActiveFilters(filters: typeof activeFilters) {
    return filters.minPrice !== '' || filters.maxPrice !== '' || filters.bedrooms !== '' || filters.location !== '';
  }
  function applyFiltersToProperties(properties: Property[], filters: Record<string, string>): Property[] {
    let filtered = [...properties].filter(p => p.available === true && p.status === 'active');
    if (filters.minPrice) filtered = filtered.filter(p => p.monthly_rent >= parseInt(filters.minPrice));
    if (filters.maxPrice) filtered = filtered.filter(p => p.monthly_rent <= parseInt(filters.maxPrice));
    if (filters.bedrooms) {
      if (filters.bedrooms === '5+') filtered = filtered.filter(p => p.bedrooms >= 5);
      else filtered = filtered.filter(p => p.bedrooms === parseInt(filters.bedrooms));
    }
    if (filters.location) {
      const locationLower = filters.location.toLowerCase();
      filtered = filtered.filter(p => p.location.toLowerCase().includes(locationLower));
    }
    return filtered;
  }
  // --- End filter helpers ---

  // Debounce utility
  function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
    let timer: NodeJS.Timeout;
    return ((...args: any[]) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    }) as T;
  }

  // Use debounce for filter changes
  const handleFilterChange = useCallback(
    debounce((filters: Record<string, string>) => {
      setActiveFilters({
        minPrice: filters.minPrice || '',
        maxPrice: filters.maxPrice || '',
        bedrooms: filters.bedrooms || '',
        location: filters.location || ''
      });
      setIsFilterOpen(false);
    }, 400),
    []
  );

  // --- Clear filters ---
  const clearFilters = useCallback(() => {
    setActiveFilters({ minPrice: '', maxPrice: '', bedrooms: '', location: '' });
  }, []);
  // --- End clear filters ---

  // --- Refresh handler ---
  const refreshProperties = useCallback(() => {
    fetchAllProperties(true); // force refresh, ignore cache
  }, [fetchAllProperties]);
  // --- End refresh ---

  // --- Conversation update event listener ---
  useEffect(() => {
    const handleConversationUpdate = () => {
      if (userId) fetchMessagedProperties(userId);
    };
    window.addEventListener('conversationUpdated', handleConversationUpdate);
    return () => window.removeEventListener('conversationUpdated', handleConversationUpdate);
  }, [userId, fetchMessagedProperties]);
  // --- End event listener ---

  // --- Fetch messaged properties on userId or allProperties change ---
  useEffect(() => {
    if (userId) fetchMessagedProperties(userId);
  }, [userId, fetchMessagedProperties]);
  // --- End fetch on userId change ---

  // --- Render ---
  return (
    <section className="py-16 md:py-24 bg-black relative overflow-hidden">
      {/* ...existing background grid... */}
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 relative z-10">
        <motion.div 
          className="space-y-8"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          {/* Error Handling UI */}
          {error && (
            <div className="mb-8 p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-200 text-center">
              <div className="flex flex-col items-center gap-2">
                <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
                <span>
                  Failed to load properties. Please try refreshing the page or check your connection.
                </span>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                >
                  Reload Page
                </button>
              </div>
            </div>
          )}
          {/* Placeholder for empty state */}
          {allProperties.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-20 sm:py-32">
              <div className="relative mb-6">
                <span className="inline-block animate-bounce">
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="mx-auto">
                    <rect x="8" y="28" width="48" height="24" rx="4" fill="#222" className="stroke-white/10" />
                    <rect x="16" y="36" width="32" height="16" rx="2" fill="#333" />
                    <path d="M32 16L16 28H48L32 16Z" fill="#2563eb" className="animate-pulse" />
                    <circle cx="24" cy="52" r="2.5" fill="#2563eb" />
                    <circle cx="40" cy="52" r="2.5" fill="#2563eb" />
                  </svg>
                </span>
                <span className="absolute -top-4 -right-8 animate-pulse">
                  <svg width="32" height="32" fill="none">
                    <circle cx="16" cy="16" r="16" fill="#2563eb" fillOpacity="0.15" />
                  </svg>
                </span>
                <span className="absolute -bottom-4 -left-8 animate-pulse">
                  <svg width="24" height="24" fill="none">
                    <circle cx="12" cy="12" r="12" fill="#fff" fillOpacity="0.07" />
                  </svg>
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 text-center">We're just getting started!</h2>
              <p className="text-white/80 text-center max-w-md mb-4 text-base sm:text-lg">
                We just launched <span className="text-blue-400 font-semibold">LakazHub</span> and there are no properties listed yet.<br />
                New homes and apartments will be available soon.<br />
                <span className="inline-block mt-2 animate-pulse text-blue-400">Please check back regularly!</span>
              </p>
            </div>
          )}
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-fluid-h2 font-bold text-white">Discover Properties</h2>
            <div className="flex items-center gap-2">
              {/* Visual indicator for cache */}
              {/* 
              {isUsingCache && (
                <span className="flex items-center px-2 py-1 bg-yellow-900/80 text-yellow-300 text-xs rounded-full mr-2">
                  <svg className="h-3 w-3 mr-1 fill-yellow-300" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" /></svg>
                  Using cached data
                </span>
              )}
              */}
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
              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <button 
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white transition"
                  >
                    <FiFilter className="h-3.5 w-3.5" />
                    {Object.values(activeFilters).filter(val => val !== '').length > 0 && (
                      <span className="h-5 w-5 flex items-center justify-center bg-white text-black text-xs rounded-full font-medium">
                        {Object.values(activeFilters).filter(val => val !== '').length}
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
              {hasActiveFilters(activeFilters) && (
                <button 
                  onClick={clearFilters}
                  className="ml-3 md:flex items-center hidden text-xs text-white/70 hover:text-white underline underline-offset-2 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>
          {/* --- Preferences Carousel (if filters active) --- */}
          <div className="space-y-8">
            <Preferences 
              preferredProperties={preferredProperties}
              hasActiveFilters={hasActiveFilters(activeFilters)}
              clearFilters={clearFilters}
            />
            {/* Messaged Properties */}
            <div className="space-y-8">
              <MessagedProperties messagedProperties={messagedProperties} />
            </div>
            {/* Recently Added */}
            <div className="space-y-8" id="recently-added">
              <RecentlyAdded 
                allProperties={allProperties} 
                loading={loading} 
              />
            </div>
            {/* Available Properties */}
            <div className="space-y-8">
              <AvailableProperties 
                allProperties={allProperties} 
                loading={loading} 
              />
            </div>
            {/* Rented Properties */}
            <div className="space-y-8">
              <RentedProperties 
                allProperties={allProperties} 
                loading={loading} 
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default React.memo(PropertiesSection);