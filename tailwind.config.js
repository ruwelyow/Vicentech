/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./resources/**/*.blade.php",
    "./resources/**/*.js",
    "./resources/**/*.jsx",
    "./resources/**/*.vue",
    "./public/**/*.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#CD8B3E',
        secondary: '#B77B35',
        accent: '#FFEBB8',
      },
    },
  },
  plugins: [],
}