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
        "red-track": "#FD7C93",
        "green-track": "#66E4B7",
        "blue-track": "#6673E4",
        "orange-track": "#FB9257",
      }
    },
  },
  plugins: [],
}