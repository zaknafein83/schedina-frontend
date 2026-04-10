/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        gds: {
          pink: '#E8003D',
          'pink-dark': '#B8002F',
          'pink-light': '#FFF0F3',
          dark: '#1A1A1A',
          'dark-2': '#2A2A2A',
          gray: '#6B6B6B',
          'gray-light': '#F5F5F5',
        },
      },
    },
  },
  plugins: [],
}
