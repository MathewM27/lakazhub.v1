// Keep "use client" directive as this component has interactive elements and state
"use client";

import { Property } from "../../types";
import { usePropertyImages } from "../../hooks/usePropertyImages";
// Remove Framer Motion import
import { Calendar, Bell, Bath, Bed, MapPin, ChevronRight, Home, Building, MoreVertical } from "lucide-react";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { format } from "date-fns";
import { supabase } from "../../lib/utils/supabase/client";

// Define the type for conversation payload
interface ConversationPayload {
  landlord_id: string;
  property_id: string;
  landlord_unread_count?: number;
  is_archived: boolean;
}

// Add type definition for window.readConversations
declare global {
  interface Window {
    readConversations?: Set<string>;
  }
}

interface PropertyCardProps {
  property: Property;
  onDetailsAction: () => void;
  onAvailabilityAction: () => void;
  onNotificationsAction: (property: Property) => void; // Update to pass property
  onDeleteAction: (propertyId: string) => void;
  isDeleting?: boolean;
}

// Dynamically import AlertDialog and DropdownMenu components
const AlertDialog = dynamic(() => import("@/components/ui/alert-dialog").then(mod => mod.AlertDialog), { ssr: false });
const AlertDialogAction = dynamic(() => import("@/components/ui/alert-dialog").then(mod => mod.AlertDialogAction), { ssr: false });
const AlertDialogCancel = dynamic(() => import("@/components/ui/alert-dialog").then(mod => mod.AlertDialogCancel), { ssr: false });
const AlertDialogContent = dynamic(() => import("@/components/ui/alert-dialog").then(mod => mod.AlertDialogContent), { ssr: false });
const AlertDialogDescription = dynamic(() => import("@/components/ui/alert-dialog").then(mod => mod.AlertDialogDescription), { ssr: false });
const AlertDialogFooter = dynamic(() => import("@/components/ui/alert-dialog").then(mod => mod.AlertDialogFooter), { ssr: false });
const AlertDialogHeader = dynamic(() => import("@/components/ui/alert-dialog").then(mod => mod.AlertDialogHeader), { ssr: false });
const AlertDialogTitle = dynamic(() => import("@/components/ui/alert-dialog").then(mod => mod.AlertDialogTitle), { ssr: false });

const DropdownMenu = dynamic(() => import("@/components/ui/dropdown-menu").then(mod => mod.DropdownMenu), { ssr: false });
const DropdownMenuContent = dynamic(() => import("@/components/ui/dropdown-menu").then(mod => mod.DropdownMenuContent), { ssr: false });
const DropdownMenuItem = dynamic(() => import("@/components/ui/dropdown-menu").then(mod => mod.DropdownMenuItem), { ssr: false });
const DropdownMenuTrigger = dynamic(() => import("@/components/ui/dropdown-menu").then(mod => mod.DropdownMenuTrigger), { ssr: false });

export default function PropertyCard({ 
  property, 
  onDetailsAction, 
  onAvailabilityAction, 
  onNotificationsAction,
  onDeleteAction,
  isDeleting = false
}: PropertyCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Use the custom hook for optimized images
  const { getOptimizedUrl } = usePropertyImages(property.id);
  
  // Fetch unread message count for this property
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return;

        // Use the property_conversations table to get unread count
        const { data, error: unreadError } = await supabase
          .from('property_conversations')
          .select('id, landlord_unread_count')
          .eq('property_id', property.id)
          .eq('landlord_id', userData.user.id)
          .eq('is_archived', false);

        if (unreadError) {
          // Only log if there is a real error message
          if (unreadError.message) {
            console.error('Error fetching unread count:', unreadError.message);
          } else {
            // Optionally, comment out or remove this line to avoid empty error logs
            // console.error('Error fetching unread count');
          }
          return;
        }

        // Check if any of these conversations are in the global read list
        if (window.readConversations && data) {
          // Filter out conversations that have been marked as read globally
          const filteredData = data.filter((conv: { id: string }) => 
            !window.readConversations?.has(conv.id)
          );
          
          // Calculate total unread count
          const totalUnread = filteredData.reduce((sum: number, conv: { landlord_unread_count?: number }) => sum + (conv.landlord_unread_count || 0), 0);
          setUnreadCount(totalUnread);
        } else {
          // Calculate total unread count
          const totalUnread = data?.reduce((sum: number, conv: { landlord_unread_count?: number }) => sum + (conv.landlord_unread_count || 0), 0) || 0;
          setUnreadCount(totalUnread);
        }
      } catch (error) {
        console.error('Error in unread count fetch:', error);
      }
    };

    fetchUnreadCount();

    // Set up real-time subscription for conversation updates
    const conversationUpdateSubscription = supabase
      .channel('property_conversations_update')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'property_conversations',
        filter: `property_id=eq.${property.id}`,
      }, (payload: { new: ConversationPayload }) => {
        const updatedConversation = payload.new;
        
        // Fix the type issue by properly handling the response
        supabase.auth.getUser().then(({ data, error }) => {
          if (!error && data?.user && updatedConversation.landlord_id === data.user.id) {
            // Update unread count when a conversation is updated
            fetchUnreadCount();
          }
        });
      })
      .subscribe();
      
    // Listen for the custom event when messages are marked as read in other components
    const handleMessagesRead = (event: CustomEvent) => {
      const { propertyId } = event.detail;
      
      // If this event is for this property, update the unread count
      if (propertyId === property.id || !propertyId) {
        fetchUnreadCount();
      }
    };
    
    // Add event listener for the custom event
    window.addEventListener('messagesMarkedAsRead', handleMessagesRead as EventListener);

    return () => {
      conversationUpdateSubscription.unsubscribe();
      window.removeEventListener('messagesMarkedAsRead', handleMessagesRead as EventListener);
    };
  }, [property.id]);
  
  // Function to get the best image for display
  const getBestPropertyImage = () => {
    if (!property.images || property.images.length === 0) {
      return "/bg1.jpg"; // Default fallback
    }

    // Check if we have any URLs with "exterior" in them
    const exteriorImage = property.images.find(url => 
      url.toLowerCase().includes('exterior')
    );
    
    if (exteriorImage) {
      return getOptimizedUrl(exteriorImage);
    }
    
    // If no exterior image, check for images with "outside" or "front"
    const outsideImage = property.images.find(url => 
      url.toLowerCase().includes('outside') || 
      url.toLowerCase().includes('front')
    );
    
    if (outsideImage) {
      return getOptimizedUrl(outsideImage);
    }
    
    // Otherwise use the first image
    return getOptimizedUrl(property.images[0]);
  };
  
  // Get the best image for this property
  const propertyImage = getBestPropertyImage();

  // Location name formatting
  const formatLocation = (location: string) => {
    if (!location) return "Unknown Location";
    return location.charAt(0).toUpperCase() + location.slice(1);
  }

  // Determine status color based on availability
  const getStatusColor = (available: boolean) => {
    return available ? 'bg-emerald-500' : 'bg-amber-500';
  };

 
  const getStatusText = (available: boolean) => {
    return available ? 'Available' : 'Rented';
  };


  const formatDate = (dateString?: string | null) => {
    if (!dateString) return null;
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch {
      // Comment out console error
      // console.error("Error formatting date:", error);
      return null;
    }
  };

  return (
    <div
      className="bg-black border border-white/10 rounded-lg overflow-hidden h-full shadow-lg transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      {/* Property Image Section - Now with prioritized exterior image */}
      <div className="relative aspect-[16/9] overflow-hidden">
        <div 
          className="w-full h-full bg-cover bg-center transition-all duration-500 hover:scale-105" 
          style={{ backgroundImage: `url(${propertyImage})` }}
        ></div>

        {/* Status Badge - Slightly larger */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-sm px-2.5 py-0.5 rounded-full">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(property.available)}`}></div>
            <span className="text-white text-[11px] font-medium">
              {getStatusText(property.available)}
            </span>
          </div>
          
          {/* Show next available date badge if property is rented and has a next available date */}
          {!property.available && property.next_available_date && (
            <div className="flex items-center gap-1 bg-black/70 backdrop-blur-sm px-2.5 py-0.5 rounded-full ml-1">
              <Calendar className="w-2.5 h-2.5 text-white/70" />
              <span className="text-white text-[11px] font-medium">
                Available {formatDate(property.next_available_date)}
              </span>
            </div>
          )}
        </div>
        
        {/* Three-dots menu in the top right corner */}
        <div className="absolute top-2.5 right-2.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="flex items-center justify-center w-8 h-8 rounded-full bg-black/70 backdrop-blur-sm text-white hover:bg-black/80 transition-colors"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <MoreVertical className="w-4 h-4" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-black/90 backdrop-blur-md border border-white/10 text-white p-1 min-w-[150px]">
              <DropdownMenuItem 
                className="text-red-400 hover:text-red-300 focus:text-red-300 cursor-pointer px-3 py-2 hover:bg-red-900/20 focus:bg-red-900/20 rounded-sm"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete Property
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Property Details - Adjusted padding */}
      <div className="p-3.5">
        <div className="flex justify-between items-start mb-1.5">
          <h3 className="text-white font-semibold truncate max-w-[70%]">{property.name}</h3>
          <div className="text-white font-semibold">
            Rs {property.monthly_rent}
          </div>
        </div>

        <div className="flex items-center text-[11px] text-white/70 mb-2.5">
          <MapPin className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
          <span className="truncate">{formatLocation(property.location)}</span>
        </div>

        {/* Property Features - Slightly larger */}
        <div className="grid grid-cols-3 gap-1.5 mb-3.5">
          <div className="bg-white/5 rounded-md p-1.5 flex justify-between items-center">
            <Bed className="w-4.5 h-4 text-white/70" />
            <p className="text-white text-[13px] font-medium">{property.bedrooms}</p>
          </div>
          
          <div className="bg-white/5 rounded-md p-1.5 flex justify-between items-center">
            <Bath className="w-4.5 h-4 text-white/70" />
            <p className="text-white text-[13px] font-medium">{property.bathrooms}</p>
          </div>
          
          <div className="bg-white/5 rounded-md p-1.5 flex justify-between items-center">
            {property.name.includes('Apartment') ? 
              <Building className="w-4.5 h-4 text-white/70" /> : 
              <Home className="w-3.5 h-3.5 text-white/70" />}
            <p className="text-white text-[13px] font-medium">
              {property.name.includes('Apartment') ? 'Apt' : 'House'}
            </p>
          </div>
        </div>

        {/* Action Buttons - Without delete button */}
        <div className="flex flex-col gap-2">
          <button 
            onClick={onDetailsAction}
            className="w-full py-3 px-3 flex justify-between items-center text-white text-[13px] font-medium bg-white/10 rounded-md hover:bg-white/15 transition-colors group"
          >
            Property Details
            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 duration-200" />
          </button>
          
          <div className="flex gap-2">
            <button 
              onClick={onAvailabilityAction}
              className="flex-1 py-3 px-2.5 flex justify-center items-center gap-1.5 text-[13px] font-medium text-white bg-white/5 rounded-md hover:bg-white/10 transition-colors"
            >
              <Calendar className="w-4.5 h-4" />
              Availability
            </button>
            
            <button 
              onClick={() => {
                // Clear the green dot
                setUnreadCount(0);

                // Trigger the notifications action
                onNotificationsAction(property);
              }}
              className="flex-1 py-3 px-2.5 flex justify-center items-center gap-1.5 text-[13px] font-medium text-white bg-white/5 rounded-md hover:bg-white/10 transition-colors relative"
            >
              <Bell className="w-4.5 h-4" />
              Messages
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-500 rounded-full h-3 w-3 animate-pulse"></span>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Dialog - Keep this unchanged */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-black border border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Property</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Are you sure you want to delete this property? This will permanently remove all property data and images. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border border-white/10 text-white hover:bg-white/5">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => onDeleteAction(property.id)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}