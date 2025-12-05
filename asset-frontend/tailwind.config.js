/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // SentinelOne-inspired Dark Theme
        dark: {
          bg: '#0A0E27',      // Background หลัก
          card: '#141932',    // Card background
          hover: '#1E2543',   // Hover state
          border: '#2A3153',  // Border color
        },
        primary: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',   // Primary purple
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
        },
        accent: {
          cyan: '#06B6D4',
          purple: '#A855F7',
          pink: '#EC4899',
          green: '#10B981',
          yellow: '#F59E0B',
          red: '#EF4444',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-sentinel': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-cyber': 'linear-gradient(135deg, #06B6D4 0%, #8B5CF6 100%)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(139, 92, 246, 0.3)',
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.3)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}