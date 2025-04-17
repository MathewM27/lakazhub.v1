export interface Property {
  id: string;
  name: string;
  [key: string]: unknown;
  landlord_id: string;
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
  imageMetadata?: Record<string, string>;
  available: boolean;
  status?: 'active' | 'archived' | 'pending' | 'rented';
  created_at: string;
  updated_at: string;
  next_available_date?: string;
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