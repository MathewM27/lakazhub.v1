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
  images: {
    file?: File;
    url?: string;
    type: string;
  }[];
  available: boolean;
  status?: 'active' | 'archived' | 'pending' | 'rented';
}

// Define property from database format
export interface PropertyData {
  id?: string;
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
  landlord_id: string;
  updated_at: string;
  status: 'active' | 'archived' | 'pending' | 'rented';
}

// Room types for organizing images
export const ROOM_TYPES = ["Living Room", "Bedroom", "Kitchen", "Bathroom", "Exterior"];

// For converting between form data and database data
export function convertPropertyToFormData(property: PropertyData): FormData {
  return {
    name: property.name,
    location: property.location,
    type: property.property_type,
    bedrooms: property.bedrooms.toString(),
    bathrooms: property.bathrooms.toString(),
    description: property.description,
    price: property.monthly_rent.toString(),
    deposit: property.security_deposit.toString(),
    utilities: property.utilities || {
      water: false,
      electricity: false,
      internet: false,
      gas: false,
      trash: false,
      cable: false,
    },
    images: property.images ? property.images.map(url => ({
      url,
      type: determineRoomTypeFromUrl(url) 
    })) : [],
    available: property.available,
    status: property.status
  };
}

// Helper function to determine room type from URL
function determineRoomTypeFromUrl(url: string): string {
  const lowercaseUrl = url.toLowerCase();
  
  for (const roomType of ROOM_TYPES) {
    if (lowercaseUrl.includes(roomType.toLowerCase().replace(' ', '-'))) {
      return roomType;
    }
  }
  
  return "Exterior"; // Default room type
}