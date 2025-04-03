export interface Property {
  id: string;
  landlord_id: string;
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
  // An array of image URLs from the storage bucket
  images: string[];
  // Optional - to track image types for better display
  imageMetadata?: Record<string, string>;
  available: boolean;
  status?: 'active' | 'archived' | 'pending' | 'rented';
  created_at: string;
  updated_at: string;
  next_available_date?: string; // Date when property will be available again if rented
  
  // Add these optional fields for UI state
  unreadMessageCount?: number; // Number of unread messages
  lastMessageAt?: string; // Timestamp of last message (if any)
  hasConversation?: boolean; // Whether tenant has a conversation for this property
}
