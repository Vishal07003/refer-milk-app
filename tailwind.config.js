/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2D5A36',
          light: '#E8F0EA',
          muted: 'rgba(45, 90, 54, 0.1)',
          border: 'rgba(45, 90, 54, 0.2)',
        },
        screen: '#F4F6F4',
        frosted: 'rgba(255, 255, 255, 0.95)',
      },
      fontFamily: {
        sans: ['Poppins-Regular'],
        medium: ['Poppins-Medium'],
        semibold: ['Poppins-SemiBold'],
        bold: ['Poppins-Bold'],
      },
    },
  },
  plugins: [
    ({ addUtilities }) => {
      addUtilities({
        '.font-sans': { fontFamily: 'Poppins-Regular' },
        '.font-medium': { fontFamily: 'Poppins-Medium' },
        '.font-semibold': { fontFamily: 'Poppins-SemiBold' },
        '.font-bold': { fontFamily: 'Poppins-Bold' },
      });
    },
  ],
};
