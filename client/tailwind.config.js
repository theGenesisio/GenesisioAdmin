/** @type {import('tailwindcss').Config} */
const withMT = require("@material-tailwind/react/utils/withMT");

module.exports = withMT({
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          mild: '#616161',
          light: '#a3a3a3',
          default: '#424242',
          dark: '#262626',
        },
        text: {
          dark: '#262626',
          light: '#d8d8d8'
        },
        accent: '#FFD700', // Gold tone inspired by the sun
        warning: {
          light: '#fff3cd', // A gentle, sunlit yellow
          dark: '#e0a800', // A deeper gold-orange for emphasis
        },
        success: {
          light: '#c8e6c9',
          dark: '#388e3c',
        },
        error: {
          light: '#ffcdd2',
          dark: '#d32f2f',
        },
      },
    },
  },
  plugins: [],
});