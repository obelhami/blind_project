/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        darkGreen: '#0E3B2E',
        primaryGreen: '#1FA67A',
        medicalWhite: '#F7FAF9',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(14 59 46 / 0.04), 0 1px 2px -1px rgb(14 59 46 / 0.04)',
        'card-hover': '0 4px 6px -1px rgb(14 59 46 / 0.05), 0 2px 4px -2px rgb(14 59 46 / 0.05)',
      },
    },
  },
  plugins: [],
}
