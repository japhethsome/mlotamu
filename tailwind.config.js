/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff3e0',
          100: '#ffe0b2',
          200: '#ffcc80',
          300: '#ffb74d',
          400: '#ffa726',
          500: '#ff9800',
          600: '#fb8c00',
          700: '#f57c00',
          800: '#ef6c00',
          900: '#e65100',
        },
        savori: {
          green: '#4CAF50',
          greenDark: '#388E3C',
          orange: '#FF6B00',
          yellow: '#FFC107',
          brown: '#4A2311',
          brownLight: '#733A18',
          cream: '#FFF8F0',
        }
      },
      boxShadow: {
        soft: "0 20px 40px rgba(74, 35, 17, 0.12)",
      },
    },
  },
  plugins: [],
};
