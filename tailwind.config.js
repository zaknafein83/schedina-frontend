/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Palette "RoleFootball": dark navy + ciano/blu.
        // I nomi gds.* sono mantenuti per compatibilità con le classi esistenti,
        // ma rimappati ai colori del nuovo tema (pink → accent ciano).
        gds: {
          pink: '#29AECE',        // accent (ex rosa) → ciano
          'pink-dark': '#1A6BB5', // blu (hover/variante scura dell'accent)
          'pink-light': '#13294A',// superficie hover scura (ex rosa chiaro)
          dark: '#0B0F1A',        // base più scura (header tabelle, footer)
          'dark-2': '#0D1E35',    // superficie
          surface: '#0D1E35',     // superficie card
          gray: '#A3B5C6',        // testo secondario (muted)
          'gray-light': '#13294A',// superficie sottile
          border: '#1C3A55',      // bordi
          white: '#EAF2FA',       // testo forte (quasi bianco)
          hover: '#2FC4E8',       // ciano brillante (hover)
        },
        pg: {
          dark: '#0B0F1A',
          surface: '#0D1E35',
          blue: '#1A6BB5',
          cyan: '#29AECE',
          hover: '#2FC4E8',
          border: '#1C3A55',
          text: '#A3B5C6',
          white: '#EAF2FA',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Montserrat', 'system-ui', 'sans-serif'],
        mono: ['"Roboto Mono"', 'monospace'],
      },
      backgroundImage: {
        'pg-gradient': 'linear-gradient(135deg, #1A6BB5, #29AECE)',
      },
      boxShadow: {
        'pg-glow': '0 0 18px rgba(41,174,206,.35)',
        'pg-glow-blue': '0 0 18px rgba(26,107,181,.4)',
      },
    },
  },
  plugins: [],
}
