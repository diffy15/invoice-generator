/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand green — replaces the old blue "primary"
        primary: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // Brand background gradient stops (for CSS vars / arbitrary values)
        brand: {
          light:  '#D8F8E0',
          mid:    '#C0E8D0',
          lower:  '#B0D8C0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(160deg, #D8F8E0 0%, #C0E8D0 50%, #B0D8C0 100%)',
      },
    },
  },
  plugins: [],
}