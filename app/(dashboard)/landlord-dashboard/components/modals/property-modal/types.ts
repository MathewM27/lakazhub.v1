export interface FormData {
  name: string;
  location: string;
  property_type: string;  // Changed from 'type' to match DB schema
  bedrooms: string;
  bathrooms: string;
  description: string;
  monthly_rent: string;   // Changed from 'price' to match DB schema
  security_deposit: string; // Changed from 'deposit' to match DB schema
  utilities: {
    water: boolean;
    electricity: boolean;
    internet: boolean;
    gas: boolean;
    trash: boolean;
    cable: boolean;
  };
  images: ImageItem[];
  existingImages?: string[];
  available: boolean;
  status: string;
  phone_number: string; // Added contact phone number field
}

// Add this line to see what fields PropertyData has
export interface PropertyData {
  id: string;
  name: string;
  location: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  description: string;
  monthly_rent: number;
  security_deposit: number;
  images: string[];
  utilities: {
    water: boolean;
    electricity: boolean;
    internet: boolean;
    gas: boolean;
    trash: boolean;
    cable: boolean;
  };
  available: boolean;
  status: string;
  created_at: string;
  user_id: string;
  existingImages?: string[];
  phone_number?: string; // Added phone_number property
}

// Define the ImageItem interface with existingUrl property
export interface ImageItem {
  file?: File;
  url?: string;
  type: string;
  existingUrl?: boolean;
}

// Room types for organizing images
export const ROOM_TYPES = ["Living Room", "Bedroom", "Kitchen", "Bathroom", "Exterior"];

// For converting between form data and database data
export function convertPropertyToFormData(property: PropertyData): FormData {
  return {
    name: property.name || '',
    location: property.location || '',
    property_type: property.property_type || 'apartment', // Changed field name
    bedrooms: property.bedrooms?.toString() || '1',
    bathrooms: property.bathrooms?.toString() || '1',
    description: property.description || '',
    monthly_rent: property.monthly_rent ? property.monthly_rent.toString() : '', // Changed field name
    security_deposit: property.security_deposit ? property.security_deposit.toString() : '', // Changed field name
    utilities: {
      water: property.utilities?.water || false,
      electricity: property.utilities?.electricity || false,
      internet: property.utilities?.internet || false,
      gas: property.utilities?.gas || false,
      trash: property.utilities?.trash || false,
      cable: property.utilities?.cable || false,
    },
    images: [], // Will be populated with processed image objects
    existingImages: property.images || [], // Store original URLs
    available: property.available ?? true,
    status: property.status || 'active',
    phone_number: property.phone_number || '', // Initialize phone number field
  };
}