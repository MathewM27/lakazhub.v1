export interface Property {
    id: string;
    name: string;
    location: string;
    price: number;
    imageUrl: string;
    bedrooms: number;
    bathrooms: number;
    area: number;
    type: 'Apartment' | 'House' | 'Villa';
    isAvailable: boolean; // Add this property
  }
  