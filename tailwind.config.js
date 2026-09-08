/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Prompt', 'sans-serif'],
      },
      colors: {
        arcade: {
          dark: '#0f172a',
          card: 'rgba(30, 41, 59, 0.7)',
        },
      },
    },
  },
  plugins: [],
}
