export type Property = {
  id: string;
  name: string;
  location: string;
  price: number; // ensure not optional
  imageUrl?: string; // For backward compatibility
  image: string;
  images: string[]; // Changed from optional to required
  bedrooms: number; // ensure not optional
  bathrooms: number; // ensure not optional
  area: number; // ensure not optional
  type?: string; // Kept for backward compatibility
  isAvailable?: boolean; // For backward compatibility
  
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
  status: 'active' | 'archived' | 'pending' | 'rented';
  created_at: string;
  updated_at: string;
  amenities: { name: string; icon: string }[];
  rules?: string[];
  next_available_date?: string;
  availability?: 'Available' | 'Rented' | 'Coming Soon';
};
