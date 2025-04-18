// 'use client';

// import { useEffect, useRef } from 'react';

// export const BackgroundCanvas = () => {
//   const canvasRef = useRef<HTMLCanvasElement | null>(null);

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;

//     const context = canvas.getContext('2d');
//     if (!context) return;
    
//     // Now TypeScript knows context is not null
//     const ctx = context;

//     const width = canvas.width = window.innerWidth;
//     const height = canvas.height = window.innerHeight;
    
//     // Simplified particle system with fewer particles and less computation
//     const particles: {x: number, y: number, size: number}[] = [];
//     const particleCount = Math.floor((width * height) / 40000); // Reduced count by 50%
    
//     for (let i = 0; i < particleCount; i++) {
//       particles.push({
//         x: Math.random() * width,
//         y: Math.random() * height,
//         size: Math.random() * 1.5 + 0.5, // Smaller particles
//       });
//     }

//     function draw() {
//       ctx.clearRect(0, 0, width, height);
      
//       // Draw static particles instead of animated ones
//       particles.forEach(particle => {
//         ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
//         ctx.beginPath();
//         ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
//         ctx.closePath();
//         ctx.fill();
//       });
      
//       // Draw fewer connections (only every 3rd particle connects)
//       for (let i = 0; i < particles.length; i += 3) {
//         for (let j = i + 3; j < particles.length; j += 3) {
//           const dx = particles[i].x - particles[j].x;
//           const dy = particles[i].y - particles[j].y;
//           const distance = Math.sqrt(dx * dx + dy * dy);
          
//           if (distance < 100) {
//             const opacity = 1 - (distance / 100);
//             ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.1})`;
//             ctx.lineWidth = 0.5;
//             ctx.beginPath();
//             ctx.moveTo(particles[i].x, particles[i].y);
//             ctx.lineTo(particles[j].x, particles[j].y);
//             ctx.stroke();
//           }
//         }
//       }
//     }

//     // Draw once instead of animating
//     draw();

//     // Simple resize handler
//     const handleResize = () => {
//       canvas.width = window.innerWidth;
//       canvas.height = window.innerHeight;
//       draw(); // Redraw on resize
//     };
    
//     window.addEventListener('resize', handleResize);
//     return () => window.removeEventListener('resize', handleResize);
//   }, []);

//   return (
//     <canvas
//       ref={canvasRef}
//       className="absolute inset-0 w-full h-full opacity-50"
//     />
//   );
// };
