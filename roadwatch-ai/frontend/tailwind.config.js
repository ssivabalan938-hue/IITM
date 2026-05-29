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
        brand: {
          bg: '#0B0F19',
          card: '#151D30',
          border: '#23304A',
          primary: '#3B82F6',
          secondary: '#10B981',
          accent: '#8B5CF6',
          muted: '#94A3B8',
          text: '#F8FAFC',
          highlight: '#F59E0B',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'premium': '0 4px 20px 0 rgba(59, 130, 246, 0.15)',
      }
    },
  },
  plugins: [],
}
