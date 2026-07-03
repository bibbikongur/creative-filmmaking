/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/components/**/*.{js,vue,ts}",
    "./app/layouts/**/*.vue",
    "./app/pages/**/*.vue",
    "./app/plugins/**/*.{js,ts}",
    "./app/app.vue",
    "./app/error.vue",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['Oswald', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Near-black stage — page and section backgrounds
        ink: {
          500: '#55555E',
          700: '#26262D',
          800: '#1A1A1F',
          900: '#101013',
          950: '#09090B',
        },
        // Warm off-whites — text on the dark stage (never pure white)
        bone: {
          100: '#F2F0EA',
          400: '#A6A39B',
        },
        // Gold — the single accent: CTAs, kickers, active states
        gold: {
          400: '#E3B453',
          500: '#C9962E',
          600: '#A87A1F',
        },
        // "REC" red — recording-dot motif and form errors only
        signal: {
          500: '#D6453D',
        },
      },
      aspectRatio: {
        'cinema': '2.39 / 1',
        'card': '16 / 10',
      },
    },
  },
  plugins: [
    function ({ addBase, theme }) {
      addBase({
        'h1, h2, h3, h4, h5, h6': {
          fontFamily: [].concat(theme('fontFamily.heading')).join(', '),
        },
      })
    },
  ],
}
