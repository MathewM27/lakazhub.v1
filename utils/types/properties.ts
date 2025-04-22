import { Property } from './property';

export const properties: Property[] = [
  {
    id: "1",
    name: "Luxury Beachfront Villa",
    location: "Grand Baie, Mauritius",
    price: 30000,
    imageUrl: "https://qqqes0fuio.ufs.sh/f/7I9AgfULkX7r2wDOOlgxMUVO4urzl6ogWXn2Iw7tGeQHA1dF",
    image: "https://qqqes0fuio.ufs.sh/f/7I9AgfULkX7r2wDOOlgxMUVO4urzl6ogWXn2Iw7tGeQHA1dF",
    images: [
      "https://qqqes0fuio.ufs.sh/f/7I9AgfULkX7r2wDOOlgxMUVO4urzl6ogWXn2Iw7tGeQHA1dF",
      "https://qqqes0fuio.ufs.sh/f/7I9AgfULkX7rRFj4G1SlLNzXApxSFmHkvhiPbJeaI9VT0D67",
      "https://qqqes0fuio.ufs.sh/f/7I9AgfULkX7ryAzQCyH8qp9b1uSxPEIaiwV4FOrWDsKhdC3M"
    ],
    bedrooms: 4,
    bathrooms: 3,
    area: 3200,
    type: "villa",
    isAvailable: true,
    landlord_id: "landlord-123",
    property_type: "villa",
    description: "Beautiful beachfront villa with stunning ocean views",
    monthly_rent: 30000,
    security_deposit: 100000,
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
    location: "Port Louis, Mauritius",
    price: 25000,
    imageUrl: "https://qqqes0fuio.ufs.sh/f/7I9AgfULkX7rRFj4G1SlLNzXApxSFmHkvhiPbJeaI9VT0D67",
    image: "https://qqqes0fuio.ufs.sh/f/7I9AgfULkX7rRFj4G1SlLNzXApxSFmHkvhiPbJeaI9VT0D67",
    images: [
      "https://qqqes0fuio.ufs.sh/f/7I9AgfULkX7rRFj4G1SlLNzXApxSFmHkvhiPbJeaI9VT0D67",
      "https://qqqes0fuio.ufs.sh/f/7I9AgfULkX7ryAzQCyH8qp9b1uSxPEIaiwV4FOrWDsKhdC3M",
      "https://qqqes0fuio.ufs.sh/f/7I9AgfULkX7r2wDOOlgxMUVO4urzl6ogWXn2Iw7tGeQHA1dF"
    ],
    bedrooms: 2,
    bathrooms: 2,
    area: 1100,
    type: "apartment",
    isAvailable: false,
    landlord_id: "landlord-124",
    property_type: "apartment",
    description: "Modern apartment in the heart of downtown",
    monthly_rent: 35000,
    security_deposit: 70000,
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
    location: "Quatre Bornes, Mauritius",
    price: 28000,
    imageUrl: "https://qqqes0fuio.ufs.sh/f/7I9AgfULkX7ryAzQCyH8qp9b1uSxPEIaiwV4FOrWDsKhdC3M",
    image: "https://qqqes0fuio.ufs.sh/f/7I9AgfULkX7ryAzQCyH8qp9b1uSxPEIaiwV4FOrWDsKhdC3M",
    images: [
      "https://qqqes0fuio.ufs.sh/f/7I9AgfULkX7ryAzQCyH8qp9b1uSxPEIaiwV4FOrWDsKhdC3M",
      "https://qqqes0fuio.ufs.sh/f/7I9AgfULkX7r2wDOOlgxMUVO4urzl6ogWXn2Iw7tGeQHA1dF",
      "https://qqqes0fuio.ufs.sh/f/7I9AgfULkX7rRFj4G1SlLNzXApxSFmHkvhiPbJeaI9VT0D67"
    ],
    bedrooms: 3,
    bathrooms: 2,
    area: 2000,
    type: "house",
    isAvailable: true,
    landlord_id: "landlord-125",
    property_type: "house",
    description: "Spacious family home in a quiet suburb",
    monthly_rent: 28000,
    security_deposit: 56000,
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
    location: "Chamarel, Mauritius",
    price: 42000,
    imageUrl: "https://qqqes0fuio.ufs.sh/f/7I9AgfULkX7r2wDOOlgxMUVO4urzl6ogWXn2Iw7tGeQHA1dF",
    image: "https://qqqes0fuio.ufs.sh/f/7I9AgfULkX7r2wDOOlgxMUVO4urzl6ogWXn2Iw7tGeQHA1dF",
    images: [
      "https://qqqes0fuio.ufs.sh/f/7I9AgfULkX7r2wDOOlgxMUVO4urzl6ogWXn2Iw7tGeQHA1dF",
      "https://qqqes0fuio.ufs.sh/f/7I9AgfULkX7rRFj4G1SlLNzXApxSFmHkvhiPbJeaI9VT0D67"
    ],
    bedrooms: 3,
    bathrooms: 2,
    area: 1800,
    type: "cabin",
    isAvailable: true,
    landlord_id: "landlord-126",
    property_type: "cabin",
    description: "Cozy mountain cabin with breathtaking views",
    monthly_rent: 42000,
    security_deposit: 84000,
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
    location: "Mahebourg, Mauritius",
    price: 38000,
    imageUrl: "https://qqqes0fuio.ufs.sh/f/7I9AgfULkX7rRFj4G1SlLNzXApxSFmHkvhiPbJeaI9VT0D67",
    image: "https://qqqes0fuio.ufs.sh/f/7I9AgfULkX7rRFj4G1SlLNzXApxSFmHkvhiPbJeaI9VT0D67",
    images: [
      "https://qqqes0fuio.ufs.sh/f/7I9AgfULkX7rRFj4G1SlLNzXApxSFmHkvhiPbJeaI9VT0D67",
      "https://qqqes0fuio.ufs.sh/f/7I9AgfULkX7ryAzQCyH8qp9b1uSxPEIaiwV4FOrWDsKhdC3M",
      "https://qqqes0fuio.ufs.sh/f/7I9AgfULkX7r2wDOOlgxMUVO4urzl6ogWXn2Iw7tGeQHA1dF"
    ],
    bedrooms: 2,
    bathrooms: 1,
    area: 1500,
    type: "cottage",
    isAvailable: true,
    landlord_id: "landlord-127",
    property_type: "cottage",
    description: "Charming cottage with private lake access",
    monthly_rent: 38000,
    security_deposit: 76000,
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
