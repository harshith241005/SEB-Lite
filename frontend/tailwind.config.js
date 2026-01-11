/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1e3a8a",
        secondary: "#0ea5e9",
        danger: "#ef4444",
        success: "#10b981",
      },
    },
  },
  plugins: [],
};
