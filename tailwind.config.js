/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
        montserrat: ['Montserrat', 'sans-serif'],
      },
      colors: {
        'bg-primary': '#0f1419',
        'bg-secondary': '#1a1f2e',
        'bg-sidebar': '#0a0f14',
        'accent-mint': '#74ecc7',
        'text-primary': '#ffffff',
        'text-secondary': '#a1a1aa',
        'border-subtle': '#2a2f3a',
        'border-focus': '#74ecc7',
        brand: {
          50: '#f0fcf9',
          100: '#ccf7e8',
          200: '#99eed1',
          300: '#74ecc7', // Primary color
          400: '#4de0b1',
          500: '#26d49b',
          600: '#1bb885',
          700: '#179c6f',
          800: '#147d59',
          900: '#116147',
          950: '#0a3d2c',
        },
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.25rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    function ({ addBase }) {
      addBase({
        '*': {
          'font-family': 'Montserrat, sans-serif',
        },
        body: {
          'background-color': '#0f1419',
          color: '#ffffff',
          'font-family': 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          'font-feature-settings': '"rlig" 1, "calt" 1',
          '-webkit-font-smoothing': 'antialiased',
          '-moz-osx-font-smoothing': 'grayscale',
        },
        'h1, h2, h3, h4, h5, h6': {
          'font-family': 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          'font-weight': '600',
        },
        code: {
          'font-family': '"JetBrains Mono", "Fira Code", "Courier New", monospace',
        },
      });
    },
  ],
};
