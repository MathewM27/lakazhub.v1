// 'use client'

// import { useState, useEffect } from "react";
// import Link from "next/link";
// import { FiArrowRight, FiCheck, FiSearch, FiMapPin } from "react-icons/fi";
// import Image from "next/image";

// const HeroSection = () => {
//   const [isLoading, setIsLoading] = useState(true);
//   const [isVisible, setIsVisible] = useState(false);

//   useEffect(() => {
//     const loadTimer = setTimeout(() => {
//       setIsLoading(false);
//       const visibilityTimer = setTimeout(() => {
//         setIsVisible(true);
//       }, 100);
//       return () => clearTimeout(visibilityTimer);
//     }, 500);
//     return () => clearTimeout(loadTimer);
//   }, []);

//   const quickFeatures = [
//     { text: 'Access curated listings', icon: FiCheck },
//     { text: 'Contact landlords directly', icon: FiCheck },
//   ];

//   return (
//     <section className="relative min-h-screen py-8 flex items-center justify-center bg-black overflow-hidden text-white pt-6">
//       <div className="container mx-auto relative z-10 px-4 sm:px-6">
//         {isLoading ? (
//           <div className="text-center max-w-4xl mx-auto">
//             {/* Loading skeleton */}
//             <div className="h-8 bg-white/20 w-1/2 mx-auto mb-4 rounded animate-pulse"></div>
//             <div className="h-4 bg-white/10 w-3/4 mx-auto mb-6 rounded animate-pulse"></div>
//             <div className="w-full h-16 bg-white/5 border border-white/10 rounded-xl animate-pulse mb-10" />
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//               <div className="space-y-4">
//                 <div className="h-6 bg-white/10 rounded-lg w-3/4 animate-pulse" />
//                 <div className="h-6 bg-white/10 rounded-lg w-1/2 animate-pulse" />
//                 <div className="h-12 bg-white/10 rounded-lg w-full animate-pulse mt-6" />
//               </div>
//               <div className="relative h-60 bg-white/5 rounded-xl animate-pulse" />
//             </div>
//           </div>
//         ) : (
//           <div className="w-full max-w-7xl mx-auto">
//             {/* Responsive grid: stack on mobile, side-by-side on md+ */}
//             <div className="flex flex-col-reverse md:grid md:grid-cols-2 gap-10 md:gap-16 items-center md:items-start pt-8 md:pt-20">
//               {/* Left column - Improved layout */}
//               <div
//                 className={`flex flex-col justify-center h-full transition-all duration-700 delay-300 ease-out ${
//                   isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
//                 }`}
//               >
//                 <div className="max-w-xl mx-auto md:mx-0 text-center md:text-left">
//                   <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight leading-tight mb-4">
//                     Find Your <span className="text-blue-400">Ideal Rental</span> Property
//                   </h1>
//                   <p className="mt-2 mb-6 text-base xs:text-lg sm:text-xl text-white/80 max-w-lg mx-auto md:mx-0">
//                     Discover homes and connect directly with property owners for a seamless rental experience.
//                   </p>
//                 </div>
//                 {/* Features */}
//                 <div className="flex flex-col sm:flex-row sm:justify-start gap-4 sm:gap-8 mt-2 mb-8 max-w-xl mx-auto md:mx-0">
//                   {quickFeatures.map((feature, index) => (
//                     <div
//                       key={index}
//                       className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-2 shadow-sm transition-all duration-500 ease-out"
//                       style={{
//                         transitionDelay: `${400 + (index * 100)}ms`,
//                         opacity: isVisible ? 1 : 0,
//                         transform: isVisible ? 'translateX(0)' : 'translateX(-10px)'
//                       }}
//                     >
//                       <div className="w-8 h-8 rounded-full bg-blue-700/20 flex items-center justify-center">
//                         <feature.icon className="w-4 h-4 text-blue-400" />
//                       </div>
//                       <span className="text-white/90 text-base font-medium">{feature.text}</span>
//                     </div>
//                   ))}
//                 </div>
//                 {/* CTA Button */}
//                 <div
//                   className={`flex justify-center md:justify-start pt-2 transition-all duration-500 delay-700 ease-out ${
//                     isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
//                   }`}
//                 >
//                   <Link
//                     href="/properties"
//                     className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-7 py-3 rounded-xl shadow-lg font-semibold text-lg transition-all group"
//                   >
//                     <span>Browse Properties</span>
//                     <FiArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
//                   </Link>
//                 </div>
//               </div>
//               {/* Right column - Featured property card */}
//               <div
//                 className={`relative rounded-2xl overflow-hidden border border-white/10 shadow-lg transition-all duration-700 delay-500 ease-out w-full max-w-md mx-auto md:mx-0 ${
//                   isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
//                 }`}
//               >
//                 {/* Explicit aspect ratio and min-height for image container */}
//                 <div className="aspect-[4/3] relative w-full min-h-[260px] sm:min-h-[320px]">
//                   <div className="absolute inset-0 z-10">
//                     <Image 
//                       src="https://qqqes0fuio.ufs.sh/f/7I9AgfULkX7rtck9gM4M5F0Eg9U6YQvHh2Gnc1e3Wr4dbuLj" 
//                       alt="Featured Property"
//                       fill
//                       className="object-cover"
//                       priority
//                       sizes="(max-width: 768px) 100vw, 400px"
//                     />
//                   </div>
//                   <div className="absolute inset-0 z-20 bg-gradient-to-b from-transparent via-transparent to-black/90"></div>
                  
//                   {/* Property tag - positioned at top-left */}
//                   <div className="absolute top-4 left-4 z-30">
//                     <div className="bg-blue-700/90 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full border border-blue-400/30">
//                       New Listing
//                     </div>
//                   </div>
                  
//                   {/* Search indicator - positioned at top-right, similar to the connection indicator in landlord dashboard */}
//                   <div className="absolute top-4 right-4 p-2 bg-black/60 backdrop-blur-sm rounded-full z-30">
//                     <FiSearch className="h-4 w-4 text-blue-400" />
//                   </div>
                  
//                   {/* Small decorative elements at corners - consistent with landlord dashboard */}
//                   <div className="absolute top-4 right-16 w-2 h-2 rounded-full bg-white/40"></div>
//                   <div className="absolute top-4 right-20 w-1 h-1 rounded-full bg-white/30"></div>
//                   <div className="absolute bottom-20 left-4 w-2 h-2 rounded-full bg-white/40"></div>
//                   <div className="absolute bottom-16 left-8 w-1 h-1 rounded-full bg-white/30"></div>
                  
//                   {/* Pre-allocate space for property info overlay */}
//                   <div className="absolute bottom-0 left-0 right-0 p-5 z-30 min-h-[70px]">
//                     <div className="flex items-start justify-between">
//                       <div>
//                         <h3 className="text-lg font-bold text-white">Modern Lakeside Apartment</h3>
//                         <div className="flex items-center gap-1 text-white/70 text-sm mt-1">
//                           <FiMapPin className="w-3 h-3" />
//                           <span>Flic en Flac, Mauritius</span>
//                         </div>
//                       </div>
//                       <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1">
//                         <span className="text-white font-bold">Rs 28,000</span>
//                         <span className="text-white/70 text-xs">/month</span>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
                
//                 {/* Property features - maintaining the same layout as landlord dashboard */}
//                 <div className="bg-white/5 backdrop-blur-md p-4 flex justify-between">
//                   <div className="text-center">
//                     <span className="text-white/70 text-xs">Bedrooms</span>
//                     <p className="text-white font-medium">2</p>
//                   </div>
//                   <div className="text-center">
//                     <span className="text-white/70 text-xs">Bathrooms</span>
//                     <p className="text-white font-medium">1</p>
//                   </div>
//                   <div className="text-center">
//                     <span className="text-white/70 text-xs">Area</span>
//                     <p className="text-white font-medium">95m²</p>
//                   </div>
//                   <div className="text-center">
//                     <span className="text-white/70 text-xs">Type</span>
//                     <p className="text-white font-medium">Apartment</p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </section>
//   );
// };

// export default HeroSection;
