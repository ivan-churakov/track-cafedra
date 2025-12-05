const { fontFamily } = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./Components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: ["bg-cyan-700", "bg-gray-200", "bg-gray-800", "border-orange-500", "border-green-500", "border-red-500", "border-blue-500"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-rubik)", ...fontFamily.sans],
      },
      colors: {
        // dark: "#0A0A0A",
        // light: "#F5F5F5",
        // "red-track": "#D4D4D4",
        // "green-track": "#646464",
        // "blue-track": "#1a6bb1",
        // "orange-track": "#5DA7B5",
      },
    },
  },
  plugins: [],
};
