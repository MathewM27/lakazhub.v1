export interface FormData {
  name: string;
  location: string;
  type: string;
  bedrooms: string;
  bathrooms: string;
  description: string;
  price: string;
  deposit: string;
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
}

// Add this line to see what fields PropertyData has
export interface PropertyData {
  id: string;
  name: string;
  location: string;
  property_type: string; // This is likely the correct field name, not "type"
  bedrooms: number;
  bathrooms: number;
  description: string;
  monthly_rent: number; // This is likely instead of "price"
  security_deposit: number; // This is likely instead of "deposit"
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
    type: property.property_type || 'apartment',
    bedrooms: property.bedrooms?.toString() || '1',
    bathrooms: property.bathrooms?.toString() || '1',
    description: property.description || '',
    price: property.monthly_rent ? property.monthly_rent.toString() : '',
    deposit: property.security_deposit ? property.security_deposit.toString() : '',
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
    status: property.status || 'active'
  };
}