// 'use client';

// import Image from 'next/image';
// import { Bed, Bath, Square, Home } from 'lucide-react';
// import React, { memo } from 'react';

// export interface PropertyCardProps {
//   id: string;
//   name: string;
//   location: string;
//   price: number;
//   monthly_rent?: number;
//   bedrooms: number;
//   bathrooms: number;
//   area: number;
//   type?: string;
//   imageUrl?: string;
//   isAvailable?: boolean;
//   onClick?: () => void;
//   fallbackImage?: React.ComponentType<{
//     src: string;
//     alt: string;
//     className?: string;
//     width?: number;
//     height?: number;
//     [key: string]: unknown;
//   }>;
// }

// // Memoized feature item
// const FeatureItem = memo(function FeatureItem({
//   icon,
//   label,
// }: {
//   icon: React.ReactNode;
//   label: string;
// }) {
//   return (
//     <div className="flex flex-col items-center gap-1 transition-all duration-200 hover:-translate-y-1">
//       <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
//         {icon}
//       </div>
//       <span className="text-xs">{label}</span>
//     </div>
//   );
// });

// export const PropertyCard: React.FC<PropertyCardProps> = memo(
//   ({
//     name,
//     location,
//     price,
//     monthly_rent,
//     bedrooms,
//     bathrooms,
//     area,
//     type,
//     imageUrl,
//     isAvailable,
//     onClick,
//     fallbackImage: FallbackImage,
//   }) => {
//     return (
//       <div
//         className="bg-black rounded-xl overflow-hidden border border-white/10 shadow-lg cursor-pointer group relative h-full flex flex-col"
//         onClick={onClick}
//       >
//         {/* Availability indicator at top left */}
//         <div className="absolute top-4 left-4 z-10">
//           {isAvailable !== false ? (
//             <div className="flex items-center gap-1.5 rounded-full bg-black/80 backdrop-blur-sm px-3 py-1">
//               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
//               <span className="text-xs font-medium text-white">Available</span>
//             </div>
//           ) : (
//             <div className="flex items-center gap-1.5 rounded-full bg-black/80 backdrop-blur-sm px-3 py-1">
//               <div className="w-2 h-2 rounded-full bg-orange-500"></div>
//               <span className="text-xs font-medium text-white">Rented</span>
//             </div>
//           )}
//         </div>

//         {/* Property Status Tag */}
//         <div className="absolute top-4 right-4 z-10">
//           <div className="px-3 py-1 bg-black/50 backdrop-blur-md text-white text-xs font-medium rounded-full border border-white/20">
//             {type || 'For Rent'}
//           </div>
//         </div>

//         <div className="relative h-52 w-full overflow-hidden">
//           {/* Use fallbackImage if provided, otherwise default to Next.js Image */}
//           {FallbackImage ? (
//             <FallbackImage
//               src={imageUrl || '/bg1.jpg'}
//               alt={name}
//               className="object-cover w-full h-52"
//               width={800}
//               height={208}
//             />
//           ) : (
//             <Image
//               src={imageUrl || '/bg1.jpg'}
//               alt={name}
//               fill
//               sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
//               priority={false}
//               className="object-cover"
//               onError={(e) => {
//                 const target = e.target as HTMLImageElement;
//                 target.src = '/images/property-placeholder.jpg';
//               }}
//             />
//           )}
//           <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/60" />
//         </div>

//         {/* Content Container */}
//         <div className="p-5 flex-1 flex flex-col">
//           <div className="flex justify-between items-start mb-3">
//             <div className="max-w-[60%]">
//               <h3 className="text-lg font-semibold text-white truncate">
//                 {name}
//               </h3>
//               <p className="text-white/70 flex items-center gap-1 text-sm mt-1 truncate">
//                 <Home className="w-3.5 h-3.5 flex-shrink-0" />
//                 <span className="truncate">{location}</span>
//               </p>
//             </div>

//             <div className="text-right flex-shrink-0">
//               <div className="bg-white/10 rounded-lg px-3 py-1 backdrop-blur-sm">
//                 <p className="text-white font-bold whitespace-nowrap">
//                   Rs {(price || monthly_rent || 0).toLocaleString()}
//                 </p>
//                 <p className="text-white/60 text-xs">per month</p>
//               </div>
//             </div>
//           </div>

//           {/* Divider */}
//           <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent my-3"></div>

//           {/* Features */}
//           <div className="flex justify-between mt-3 text-white/70">
//             <FeatureItem icon={<Bed className="w-4 h-4" />} label={`${bedrooms} Beds`} />
//             <FeatureItem icon={<Bath className="w-4 h-4" />} label={`${bathrooms} Baths`} />
//             <FeatureItem icon={<Square className="w-4 h-4" />} label={`${area}m²`} />
//           </div>

//           {/* View Details Button */}
//           <div className="mt-auto pt-4 w-full">
//             <button className="w-full h-10 bg-transparent border border-white/20 rounded-lg text-white text-sm">
//               View Details
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }
// );
// PropertyCard.displayName = 'PropertyCard';