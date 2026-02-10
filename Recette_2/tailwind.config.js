/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bio-primary': '#0075c9',
        'bio-dark': '#4a4f56',
        'bio-gray': '#626262',
        'bio-bg': '#f5f6f8',
        'bio-card': '#fafafa',
        'bio-border': '#e5e5e5',
        'phase-start': '#55b479',
        'phase-param': '#84b3ff',
        'phase-prompt': '#ffc35e',
        'phase-instrument': '#b08efd',
        'phase-wait': '#9a9b9e',
        'phase-profile': '#50be9a',
        'phase-end': '#fb6a6a',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
