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
  // Add this line to fix the TypeScript error
  next_available_date?: string; // Date when property will be available again if rented
}

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
  images: string[];
  available: boolean;
}

export interface LandlordProperty {
  id: string;
  name: string;
  location: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  description?: string; // Optional in the dashboard
  monthly_rent: number;
  security_deposit?: number; // Optional in the dashboard
  utilities: {
    water: boolean;
    electricity: boolean;
    internet: boolean;
    gas: boolean;
    trash: boolean;
    cable: boolean;
  };
  images?: any[]; // Optional in the dashboard
  available?: boolean; // Optional in the dashboard
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

export interface Conversation {
  id: string;
  property_id: string;
  tenant_id: string;
  landlord_id: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
  tenant_unread_count: number;
  landlord_unread_count: number;
  is_archived: boolean;
  last_message_at: string;
}