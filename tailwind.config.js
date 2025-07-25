/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#4f46e5',
        'primary-hover': '#4338ca',
        'secondary': '#10b981',
        'light-bg': '#f0f9ff',
        'dark-text': '#1f2937',
        'light-text': '#f9fafb',
      },
      boxShadow: {
        'top': '0 -4px 6px -1px rgb(0 0 0 / 0.1), 0 -2px 4px -2px rgb(0 0 0 / 0.1)',
      }
    },
  },
  plugins: [],
} 