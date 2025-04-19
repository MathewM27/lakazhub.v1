import { Property } from './property';

export const properties: Property[] = [
  {
    id: "1",
    name: "Luxury Beachfront Villa",
    location: "Miami Beach, FL",
    price: 5000,
    imageUrl: "/bg1.webp", // Updated to use images in public folder
    image: "/bg1.webp",
    images: ["/bg1.webp", "/bg2.webp", "/bg3.webp"], // Using existing images in public folder
    bedrooms: 4,
    bathrooms: 3,
    area: 3200,
    type: "villa",
    isAvailable: true,
    // Added required properties
    landlord_id: "landlord-123",
    property_type: "villa",
    description: "Beautiful beachfront villa with stunning ocean views",
    monthly_rent: 5000,
    security_deposit: 10000,
    utilities: {
      water: true,
      electricity: true,
      internet: true,
      gas: true,
      trash: true,
      cable: true
    },
    available: true,
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    amenities: [
      { name: "Pool", icon: "droplet" },
      { name: "Gym", icon: "dumbbell" },
      { name: "Security", icon: "shield" }
    ]
  },
  {
    id: "2",
    name: "Downtown Apartment",
    location: "New York, NY",
    price: 3500,
    imageUrl: "/bg2.webp", // Updated to use images in public folder
    image: "/bg2.webp",
    images: ["/bg2.webp", "/bg3.webp", "/bg1.webp"], // Using existing images in public folder
    bedrooms: 2,
    bathrooms: 2,
    area: 1100,
    type: "apartment",
    isAvailable: false,
    // Added required properties
    landlord_id: "landlord-124",
    property_type: "apartment",
    description: "Modern apartment in the heart of downtown",
    monthly_rent: 3500,
    security_deposit: 7000,
    utilities: {
      water: true,
      electricity: false,
      internet: true,
      gas: false,
      trash: true,
      cable: false
    },
    available: false,
    status: "rented",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    amenities: [
      { name: "Parking", icon: "car" },
      { name: "Laundry", icon: "shirt" }
    ]
  },
  {
    id: "3",
    name: "Suburban Family Home",
    location: "Austin, TX",
    price: 2800,
    imageUrl: "/bg3.webp", // Updated to use images in public folder
    image: "/bg3.webp",
    images: ["/bg3.webp", "/bg1.webp", "/bg2.webp"], // Using existing images in public folder
    bedrooms: 3,
    bathrooms: 2,
    area: 2000,
    type: "house",
    isAvailable: true,
    // Added required properties
    landlord_id: "landlord-125",
    property_type: "house",
    description: "Spacious family home in a quiet suburb",
    monthly_rent: 2800,
    security_deposit: 5600,
    utilities: {
      water: false,
      electricity: false,
      internet: false,
      gas: false,
      trash: true,
      cable: false
    },
    available: true,
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    amenities: [
      { name: "Garden", icon: "flower" },
      { name: "Garage", icon: "car" }
    ]
  },
  {
    id: "4",
    name: "Mountain Retreat Cabin",
    location: "Aspen, CO",
    price: 4200,
    imageUrl: "/bg1.webp", // Updated to use images in public folder
    image: "/bg1.webp",
    images: ["/bg1.webp", "/bg2.webp"], // Using existing images in public folder
    bedrooms: 3,
    bathrooms: 2,
    area: 1800,
    type: "cabin",
    isAvailable: true,
    // Added required properties
    landlord_id: "landlord-126",
    property_type: "cabin",
    description: "Cozy mountain cabin with breathtaking views",
    monthly_rent: 4200,
    security_deposit: 8400,
    utilities: {
      water: true,
      electricity: true,
      internet: true,
      gas: true,
      trash: false,
      cable: false
    },
    available: true,
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    amenities: [
      { name: "Fireplace", icon: "flame" },
      { name: "Hot Tub", icon: "droplet" }
    ]
  },
  {
    id: "5",
    name: "Lakeside Cottage",
    location: "Lake Tahoe, CA",
    price: 3800,
    imageUrl: "/bg2.webp", // Updated to use images in public folder
    image: "/bg2.webp",
    images: ["/bg2.webp", "/bg3.webp", "/bg1.webp"], // Using existing images in public folder
    bedrooms: 2,
    bathrooms: 1,
    area: 1500,
    type: "cottage",
    isAvailable: true,
    // Added required properties
    landlord_id: "landlord-127",
    property_type: "cottage",
    description: "Charming cottage with private lake access",
    monthly_rent: 3800,
    security_deposit: 7600,
    utilities: {
      water: true,
      electricity: true,
      internet: true,
      gas: false,
      trash: true,
      cable: true
    },
    available: true,
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    amenities: [
      { name: "Deck", icon: "home" },
      { name: "Boat Dock", icon: "anchor" }
    ]
  }
];
