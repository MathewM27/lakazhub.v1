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

const CACHE_KEY = 'property_cache';
const CACHE_EXPIRY = 1000 * 60 * 15;
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

const PropertiesSection = () => {
  // ...existing code...
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({ minPrice: '', maxPrice: '', bedrooms: '', location: '' });
  const [userId, setUserId] = useState<string | null>(null);
  const [messagedProperties, setMessagedProperties] = useState<Property[]>([]);

  // --- Fetch all properties in parent ---
  useEffect(() => {
    let mounted = true;
    async function fetchAllProperties() {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) {
          setError(error.message);
          setAllProperties([]);
        } else if (mounted) {
          setAllProperties((data as Property[]) || []);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch properties');
        setAllProperties([]);
      } finally {
        setLoading(false);
      }
    }
    fetchAllProperties();
    return () => { mounted = false; };
  }, []);
  // --- End fetch all properties ---

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
      const CONVERSATIONS_CACHE_KEY = `conversations-${uid}`;
      let conversationsData: Array<{ property_id: string }> | null = null;

      try {
        const cachedConversationsData = localStorage.getItem(CONVERSATIONS_CACHE_KEY);
        if (cachedConversationsData) {
          const parsedData = JSON.parse(cachedConversationsData);
          if (parsedData?.data && Array.isArray(parsedData.data)) {
            conversationsData = parsedData.data;
          }
        }
      } catch {}

      if (!conversationsData) {
        const { data, error } = await supabase
          .from('property_conversations')
          .select('id, property_id, tenant_id, landlord_id')
          .eq('tenant_id', uid);
        if (error) {
          setMessagedProperties([]);
          return;
        }
        conversationsData = data as Array<{ property_id: string }>;
      }

      if (!conversationsData || conversationsData.length === 0) {
        setMessagedProperties([]);
        return;
      }

      const propertyIds = [...new Set(
        conversationsData.map((conv) => 
          conv.property_id || (conv as any).property?.id
        ).filter(Boolean)
      )];

      if (propertyIds.length === 0) {
        setMessagedProperties([]);
        return;
      }

      // Try to match with already loaded properties
      let matchedProperties: Property[] = [];
      if (allProperties.length > 0) {
        matchedProperties = allProperties.filter(
          property => propertyIds.includes(property.id)
        );
      }

      if (matchedProperties.length > 0) {
        setMessagedProperties(matchedProperties);
        return;
      }

      // Fetch properties if not already loaded
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .in('id', propertyIds);

      if (propertiesError) {
        setMessagedProperties([]);
        return;
      }

      if (!propertiesData || propertiesData.length === 0) {
        setMessagedProperties([]);
        return;
      }

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
          price: typeof item.price === 'number' ? item.price : Number(item.monthly_rent) || 0,
          area: typeof item.area === 'number' ? item.area : 0,
          imageErrorHandler: (e: React.SyntheticEvent<HTMLImageElement>) => {
            e.currentTarget.src = '/placeholder-property.jpg';
          }
        };
      });

      setMessagedProperties(transformedProperties);
    } catch {
      setMessagedProperties([]);
    }
  }, [allProperties]);
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
   
  }, []);
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

  // --- Render ---
  return (
    <section className="py-16 bg-black relative overflow-hidden">
      {/* ...existing background grid... */}
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
          {/* --- FIX: Show Preferences carousel if filters are active --- */}
          <Preferences 
            preferredProperties={preferredProperties}
            hasActiveFilters={hasActiveFilters(activeFilters)}
            clearFilters={clearFilters}
          />
          <MessagedProperties messagedProperties={messagedProperties} />
          <RecentlyAdded allProperties={allProperties} loading={loading} />
          <AvailableProperties allProperties={allProperties} loading={loading} />
          <RentedProperties allProperties={allProperties} loading={loading} />
        </motion.div>
      </div>
    </section>
  );
};

export default React.memo(PropertiesSection);