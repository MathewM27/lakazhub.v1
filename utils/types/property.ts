export type Property = {
  id: string;
  name: string;
  location: string;
  bedrooms: number;
  bathrooms: number;
  image: string;
  images: string[]; // Changed from optional to required
  imageUrl?: string; // For backward compatibility
  
  // Additional properties needed
  landlord_id: string;
  property_type: string;
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
  available: boolean;
  isAvailable?: boolean; // For backward compatibility
  status: 'active' | 'archived' | 'pending' | 'rented';
  created_at: string;
  updated_at: string;
  amenities: { name: string; icon: string }[];
  rules?: string[];
  next_available_date?: string;
  availability?: 'Available' | 'Rented' | 'Coming Soon';
  area?: number; // Kept for backward compatibility
  type?: string; // Kept for backward compatibility
  price?: number; // Kept for backward compatibility
};
