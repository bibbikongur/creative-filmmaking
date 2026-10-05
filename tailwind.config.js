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
          400: '#8A8A94', // meta text on dark surfaces (AA on ink-800/900/950)
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
          'radial-gradient(120% 90% at 85% 15%, rgba(201,150,46,0.16) 0%, rgba(201,150,46,0.04) 40%, transparent 70%)',
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
