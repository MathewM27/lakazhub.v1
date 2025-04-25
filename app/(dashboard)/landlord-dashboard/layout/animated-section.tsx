// "use client";

// import { useEffect, useRef } from "react";
// import { useInView } from "react-intersection-observer";

// interface AnimatedSectionProps {
//   children: React.ReactNode;
//   className?: string;
//   delay?: number;
// }

// export function AnimatedSection({ children, className, delay = 0 }: AnimatedSectionProps) {
//   const [ref, inView] = useInView({ 
//     threshold: 0.2,
//     triggerOnce: true 
//   });
  
//   const sectionRef = useRef<HTMLDivElement>(null);
  
//   useEffect(() => {
//     if (inView && sectionRef.current) {
//       sectionRef.current.style.opacity = "1";
//       sectionRef.current.style.transform = "translateY(0)";
//     }
//   }, [inView]);

//   return (
//     <div 
//       ref={(el) => {
//         // Combine the refs
//         if (el) {
//           sectionRef.current = el;
//           ref(el);
//         }
//       }}
//       className={className}
//       style={{
//         opacity: 0,
//         transform: "translateY(30px)",
//         transition: `opacity 0.8s ease-out, transform 0.8s ease-out`,
//         transitionDelay: `${delay}s`
//       }}
//     >
//       {children}
//     </div>
//   );
// }
