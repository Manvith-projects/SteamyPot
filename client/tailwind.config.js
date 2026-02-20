/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f7f8ff",
          100: "#eef0ff",
          200: "#d9ddff",
          300: "#b4bbff",
          400: "#8e99ff",
          500: "#6977ff",
          600: "#4b59e6",
          700: "#3945b4",
          800: "#2c368c",
          900: "#222a6c"
        }
      }
    }
  },
  plugins: []
};
