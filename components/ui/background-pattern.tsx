'use client';

export const BackgroundPattern = () => {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      <svg
        className="absolute w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          <linearGradient id="dotGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: 'white', stopOpacity: 0.4 }}>
              <animate
                attributeName="stop-opacity"
                values="0.4;0.2;0.4"
                dur="4s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="50%" style={{ stopColor: '#FFFFFF', stopOpacity: 0.3 }}>
              <animate
                attributeName="stop-opacity"
                values="0.3;0.15;0.3"
                dur="4s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" style={{ stopColor: '#FFFFFF', stopOpacity: 0.4 }}>
              <animate
                attributeName="stop-opacity"
                values="0.4;0.2;0.4"
                dur="4s"
                repeatCount="indefinite"
              />
            </stop>
          </linearGradient>
          <pattern
            id="dotPattern"
            x="0"
            y="0"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="1" fill="url(#dotGradient)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dotPattern)" />
      </svg>
    </div>
  );
};

// Optionally, only render this after main content is loaded
