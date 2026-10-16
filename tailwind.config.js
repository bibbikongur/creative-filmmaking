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
        // "Blue hour" palette (2026-10-05): the colours of the hero still. A deep
        // slate-blue dusk stage instead of near-black — page and section backgrounds.
        ink: {
          400: '#8694A1', // meta text on dark surfaces (AA on ink-800/900/950)
          500: '#55697A', // outline-button borders
          700: '#2E3B47', // hairlines, dividers
          800: '#1B242D', // card surface
          900: '#141B22', // alternating sections, footer
          950: '#0E1318', // page
        },
        // Fog whites — text on the dark stage (never pure white)
        bone: {
          100: '#EEF1F4',
          400: '#A8B2BD',
        },
        // Headlight amber — the single accent: CTAs, kickers, active states
        gold: {
          400: '#F7BE63',
          500: '#F0A83B',
          600: '#C9862A',
        },
        // "REC" red — recording-dot motif and form errors only
        signal: {
          400: '#E8655E', // error text on dark surfaces
          500: '#D6453D',
        },
      },
      aspectRatio: {
        'card': '16 / 10',
      },
      backgroundImage: {
        // Warm gold glow in the top-right corner; keeps the hero and CTA banner from ever reading flat black
        'hero-vignette':
          'radial-gradient(120% 90% at 85% 15%, rgba(240,168,59,0.18) 0%, rgba(240,168,59,0.05) 40%, transparent 70%)',
        // Equipment photos are opaque white manufacturer cutouts, so they sit in a deliberate white "product well"
        'product-well': 'radial-gradient(circle at 50% 40%, #ffffff 0%, #f4f4f4 100%)',
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
