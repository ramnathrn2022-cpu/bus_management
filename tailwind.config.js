/** @type {import('tailwindcss').Config} */
import daisyui from 'daisyui'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f4f6fe',
          100: '#e9edfd',
          200: '#d2dafa',
          300: '#acbbf6',
          400: '#7e93f0',
          500: '#5268e8',
          600: '#3e4edb',
          700: '#313cb9',
          800: '#2c3498',
          900: '#29307b',
          950: '#181b49',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: ["dark"],
  },
}
