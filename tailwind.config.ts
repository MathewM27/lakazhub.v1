import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,jsx,ts,tsx,html}"
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      spacing: {
        '4.5': '1.125rem',
        '128': '32rem',
        '144': '36rem',
      },
      screens: {
        'xs': '400px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '4rem',
          xl: '5rem',
        },
        screens: {
          sm: '640px',
          md: '768px',
          lg: '1024px',
          xl: '1280px',
          '2xl': '1536px',
        },
      },
      fontSize: {
        'fluid-sm': 'clamp(0.875rem, 0.8rem + 0.25vw, 1rem)',
        'fluid-base': 'clamp(1rem, 0.9rem + 0.3vw, 1.25rem)',
        'fluid-lg': 'clamp(1.125rem, 1rem + 0.5vw, 1.5rem)',
        'fluid-xl': 'clamp(1.25rem, 1.1rem + 0.75vw, 1.875rem)',
        'fluid-2xl': 'clamp(1.5rem, 1.25rem + 1.25vw, 2.5rem)',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fadeIn': 'fadeIn 0.8s ease-out forwards',
        'fadeInUp': 'fadeInUp 0.5s ease-out forwards',
        'slowZoom': 'slowZoom 10s infinite linear',
        'float': 'float 5s ease-in-out infinite',
        'fade-in': 'fadeIn 0.7s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
      },
      transitionTimingFunction: {
        'bounce-start': 'cubic-bezier(0.36, 0, 0.66, -0.56)',
        'bounce-end': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      aspectRatio: {
        'square': '1 / 1',
        'portrait': '3 / 4',
        'landscape': '4 / 3',
        'widescreen': '16 / 9',
        'ultrawide': '21 / 9',
      },
      minHeight: {
        'touch-target': '44px',
      },
      minWidth: {
        'touch-target': '44px',
        '32': '8rem',
      },
      boxShadow: {
        'focus-ring': '0 0 0 3px rgba(var(--ring-rgb), 0.5)',
      },
      zIndex: {
        'behind': '-1',
        'dropdown': '1000',
        'sticky': '1020',
        'fixed': '1030',
        'modal': '1040',
        'popover': '1050',
        'tooltip': '1060',
      },
      gridTemplateColumns: {
        'auto-fill-xs': 'repeat(auto-fill, minmax(240px, 1fr))',
        'auto-fill-sm': 'repeat(auto-fill, minmax(320px, 1fr))',
        'auto-fill-md': 'repeat(auto-fill, minmax(384px, 1fr))',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slowZoom: {
          '0%': { transform: 'scale(1.25)' },
          '50%': { transform: 'scale(1.3)' },
          '100%': { transform: 'scale(1.25)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(15px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    }
  },
  plugins: [
    require("tailwindcss-animate"),
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/typography'),
    function({ addComponents, theme }: { addComponents: Function, theme: Function }) {
      addComponents({
        '.touch-safe': {
          minHeight: theme('minHeight.touch-target'),
          minWidth: theme('minWidth.touch-target'),
        },
        '.transition-standard': {
          transition: 'all 300ms ease-in-out',
        },
      });
    },
    plugin(({ addUtilities }) => {
      const newUtilities: Record<string, Record<string, string>> = {};
      for (let i = 1; i <= 10; i++) {
        newUtilities[`.animation-delay-${i*100}`] = {
          'animation-delay': `${i*0.1}s`,
        };
      }
      addUtilities(newUtilities);
    }),
    plugin(({ addUtilities }) => {
      const delayUtilities: Record<string, Record<string, string>> = {};
      for (let i = 1; i <= 10; i++) {
        delayUtilities[`.delay-${i*100}`] = {
          'animation-delay': `${i*0.1}s`,
        };
      }
      addUtilities(delayUtilities);
    })
  ],
} satisfies Config;