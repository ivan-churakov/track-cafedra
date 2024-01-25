const { fontFamily } = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-rubik)', ...fontFamily.sans],
      },
      colors: {
        "red-track": "#D4D4D4",
        "green-track": "#646464",
        "blue-track": "#1a6bb1",
        "orange-track": "#5DA7B5",
      }
    },
  },
  plugins: [],
}