// 'use client';

// import React, { useRef, useState, useEffect } from 'react';
// import { Home, ChevronLeft, ChevronRight } from 'lucide-react';
// import { properties } from '@/utils/types/properties';
// import { PropertyCard } from '../ui/property-card';

// export const PropertySlider = () => {
//   const [activeFilters, setActiveFilters] = useState('all');
//   const containerRef = useRef<HTMLDivElement>(null);
//   const [scrollPosition, setScrollPosition] = useState(0);
//   const [maxScroll, setMaxScroll] = useState(0);

//   // Filter properties based on active filter
//   const filteredProperties = activeFilters === 'all'
//     ? properties
//     : properties.filter((p) => p.type === activeFilters);

//   // Update scroll position info and check if we're at the end
//   useEffect(() => {
//     if (!containerRef.current) return;
//     const container = containerRef.current;
//     const handleScrollEvent = () => {
//       setScrollPosition(container.scrollLeft);
//       setMaxScroll(container.scrollWidth - container.clientWidth);
//     };
//     handleScrollEvent();
//     container.addEventListener('scroll', handleScrollEvent);
//     window.addEventListener('resize', handleScrollEvent);
//     return () => {
//       container.removeEventListener('scroll', handleScrollEvent);
//       window.removeEventListener('resize', handleScrollEvent);
//     };
//   }, [filteredProperties.length]);

//   // Scroll navigation
//   const handleScroll = (direction: 'left' | 'right') => {
//     if (!containerRef.current) return;
//     const container = containerRef.current;
//     const scrollAmount = direction === 'left' ? -320 : 320;
//     container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
//   };

//   // Card click handler (scroll to signup section)
//   const handlePropertyClick = () => {
//     const signupSection = document.getElementById('signup');
//     if (!signupSection) return;
//     const offsetTop = signupSection.offsetTop;
//     const offset = typeof window !== 'undefined' && window.innerWidth < 768 ? -70 : 0;
//     window.scrollTo({ top: offsetTop + offset, behavior: 'smooth' });
//   };

//   // Drag state
//   const isDragging = useRef(false);
//   const startX = useRef(0);
//   const scrollLeft = useRef(0);

//   // Mouse/touch drag handlers
//   const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
//     if (!containerRef.current) return;
//     isDragging.current = true;
//     containerRef.current.classList.add('dragging');
//     startX.current =
//       'touches' in e
//         ? e.touches[0].pageX
//         : (e as React.MouseEvent).pageX;
//     scrollLeft.current = containerRef.current.scrollLeft;
//   };

//   const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
//     if (!isDragging.current || !containerRef.current) return;
//     const x =
//       'touches' in e
//         ? e.touches[0].pageX
//         : (e as React.MouseEvent).pageX;
//     const walk = x - startX.current;
//     containerRef.current.scrollLeft = scrollLeft.current - walk;
//   };

//   const handleDragEnd = () => {
//     isDragging.current = false;
//     if (containerRef.current) {
//       containerRef.current.classList.remove('dragging');
//     }
//   };

//   // Prevent click events while dragging
//   useEffect(() => {
//     const container = containerRef.current;
//     if (!container) return;
//     let moved = false;
//     const onClick = (e: MouseEvent) => {
//       if (moved) {
//         e.stopPropagation();
//         e.preventDefault();
//         moved = false;
//       }
//     };
//     const onMouseMove = () => {
//       if (isDragging.current) moved = true;
//     };
//     container.addEventListener('mousemove', onMouseMove);
//     container.addEventListener('click', onClick, true);
//     return () => {
//       container.removeEventListener('mousemove', onMouseMove);
//       container.removeEventListener('click', onClick, true);
//     };
//   }, []);

//   return (
//     <section id="properties" className="py-16 md:py-24 bg-black relative overflow-hidden">
//       {/* ...existing background grid... */}
//       <div className="absolute inset-0 opacity-20">
//         {/* ...existing code... */}
//         {[...Array(10)].map((_, i) => (
//           <div 
//             key={i} 
//             className="absolute w-px h-full bg-white/5" 
//             style={{ left: `${i * 10}%` }}
//           ></div>
//         ))}
//       </div>
//       <div className="max-w-screen-xl mx-auto px-4 md:px-8 relative z-10">
//         <div className="gap-y-8 flex flex-col">
//           <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16">
//             <div className="max-w-2xl">
//               <div className="flex items-center gap-2 mb-4">
//                 <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
//                   <Home className="w-4 h-4 text-black" />
//                 </div>
//                 <span className="text-white/70 text-sm font-medium">Lakaz-Hub</span>
//               </div>
//               <h2 className="font-bold mb-4 text-white text-fluid-h2">
//                 Discover & List Properties
//               </h2>
//               <p className="text-base md:text-lg text-white/70">
//                 Explore a diverse selection of rental properties tailored to your needs.
//               </p>
//             </div>
//             {/* Property filters */}
//             <div className="flex items-center gap-3 mt-6 md:mt-0">
//               {['all', 'apartment', 'house', 'villa'].map((filter) => (
//                 <button
//                   key={filter}
//                   onClick={() => setActiveFilters(filter)}
//                   className={`px-4 py-2 text-sm rounded-full transition-all duration-300 ${
//                     activeFilters === filter
//                       ? 'bg-white text-black font-medium'
//                       : 'bg-white/10 text-white/70 '
//                   }`}
//                 >
//                   {filter.charAt(0).toUpperCase() + filter.slice(1)}
//                 </button>
//               ))}
//             </div>
//           </div>
//           {/* Carousel */}
//           <div className="relative">
//             <div className="relative">
//               <div
//                 ref={containerRef}
//                 className="flex gap-5 overflow-x-auto hide-scrollbar pb-6 snap-x snap-mandatory select-none"
//                 style={{ scrollBehavior: 'smooth', cursor: isDragging.current ? 'grabbing' : 'grab' }}
//                 onMouseDown={handleDragStart}
//                 onMouseMove={handleDragMove}
//                 onMouseUp={handleDragEnd}
//                 onMouseLeave={handleDragEnd}
//                 onTouchStart={handleDragStart}
//                 onTouchMove={handleDragMove}
//                 onTouchEnd={handleDragEnd}
//               >
//                 {filteredProperties.length > 0 ? (
//                   filteredProperties.map((property, idx) => (
//                     <div
//                       key={property.id}
//                       className="min-w-[280px] md:min-w-[320px] max-w-xs md:max-w-sm snap-start"
//                     >
//                       <PropertyCard
//                         id={property.id}
//                         name={property.name}
//                         location={property.location}
//                         price={property.price ?? 0}
//                         monthly_rent={property.monthly_rent}
//                         bedrooms={property.bedrooms ?? 0}
//                         bathrooms={property.bathrooms ?? 0}
//                         area={property.area ?? 0}
//                         type={property.type}
//                         imageUrl={property.imageUrl}
//                         isAvailable={property.isAvailable}
//                         onClick={handlePropertyClick}
//                       />
//                     </div>
//                   ))
//                 ) : (
//                   <div className="w-full py-12 text-center text-white/60">
//                     No properties found with the selected filters.
//                   </div>
//                 )}
//               </div>
//               {/* Left/Right navigation buttons */}
//               <button
//                 onClick={() => handleScroll('left')}
//                 className={`absolute -left-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white transition-all duration-300 border border-white/20 group ${
//                   scrollPosition <= 0 ? 'opacity-30 cursor-not-allowed' : ''
//                 }`}
//                 disabled={scrollPosition <= 0}
//                 aria-label="Scroll left"
//               >
//                 <ChevronLeft className="w-5 h-5 group-hover:scale-95 transition-transform" />
//               </button>
//               <button
//                 onClick={() => handleScroll('right')}
//                 className={`absolute -right-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white transition-all duration-300 border border-white/20 group ${
//                   scrollPosition >= maxScroll - 5 ? 'opacity-30 cursor-not-allowed' : ''
//                 }`}
//                 disabled={scrollPosition >= maxScroll - 5}
//                 aria-label="Scroll right"
//               >
//                 <ChevronRight className="w-5 h-5 group-hover:scale-95 transition-transform" />
//               </button>
//             </div>
//             {/* Progress bar */}
//             {filteredProperties.length > 0 && (
//               <div className="mt-3 h-0.5 bg-white/5 rounded-full overflow-hidden">
//                 <div
//                   className="h-full bg-white/40 transition-all duration-300"
//                   style={{
//                     width:
//                       maxScroll > 0
//                         ? `${Math.min((scrollPosition / maxScroll) * 100, 100)}%`
//                         : '0%',
//                   }}
//                 ></div>
//               </div>
//             )}
//           </div>
//           {/* Premium features coming soon banner */}
//           <div
//             className="mt-16 flex flex-col items-center justify-center p-6 md:p-8 rounded-2xl bg-black border border-white/10 backdrop-blur-sm relative overflow-hidden"
//           >
//             {/* ...existing premium banner content... */}
//             <div className="absolute inset-0 overflow-hidden">
//               <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
//               <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
//             </div>
//             <div className="relative z-10 text-center max-w-2xl mx-auto">
//               <div className="flex items-center justify-center gap-2 mb-2">
//                 <Home className="w-5 h-5 text-white" />
//                 <div className="bg-white/20 text-white text-xs font-medium px-2 py-0.5 rounded-full">
//                   Coming Soon
//                 </div>
//               </div>
//               <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
//                 Premium Features in Development
//               </h3>
//               <p className="text-white/70 text-sm md:text-base">
//                 We&apos;re working to enhance your experience with premium subscription services. 
//                 Soon you&apos;ll enjoy exclusive listings, virtual tours, and priority access to new properties.
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>
//       <style jsx global>{`
//         .hide-scrollbar::-webkit-scrollbar {
//           display: none;
//         }
//         .hide-scrollbar {
//           -ms-overflow-style: none;
//           scrollbar-width: none;
//         }
//         .dragging {
//           cursor: grabbing !important;
//         }
//       `}</style>
//     </section>
//   );
// };