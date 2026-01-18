/** @type {import('tailwindcss').Config} */
const withMT = require("@material-tailwind/react/utils/withMT");

module.exports = withMT({
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // The Config Chunk
      colors: {
        primary: {
          mild: '#fffbeb',  // Amber 50 - Warm white
          light: '#fde68a', // Amber 200 - Muted gold
          default: '#2c241b', // Dark Brownish Grey - Sunset night
          dark: '#15100d',   // Deepest warm black
        },
        text: {
          dark: '#1c1917', // Stone 900
          light: '#fffbf0' // Warm White
        },
        accent: '#f59e0b', // Amber 500 - Sunset Gold
        warning: {
          light: '#FEF9C3',
          dark: '#A16207',
        },
        success: { light: '#c8e6c9', dark: '#388e3c' },
        error: { light: '#ffcdd2', dark: '#d32f2f' },
      },
    },
  },
  plugins: [],
});