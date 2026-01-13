/** @type {import('tailwindcss').Config} */
const withMT = require("@material-tailwind/react/utils/withMT");

module.exports = withMT({
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // The Config Chunk
      colors: {
        primary: {
          mild: '#ECFDF5',  // Very pale mint grey
          light: '#A7F3D0', // Light teal-grey
          default: '#115E59', // Deep teal-grey
          dark: '#042F2E',   // Near black teal
        },
        text: {
          dark: '#042F2E',
          light: '#F0FDFA'
        },
        accent: '#0D9488', // Vibrant Teal (Tailwind Teal 600)
        warning: {
          // Kept yellowish, but cooler
          light: '#FEF9C3',
          dark: '#A16207',
        },
        success: { light: '#c8e6c9', dark: '#388e3c' }, // Existing green works well
        error: { light: '#ffcdd2', dark: '#d32f2f' },   // Existing red works well
      },
    },
  },
  plugins: [],
});