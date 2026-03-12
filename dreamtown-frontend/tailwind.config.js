/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'night-sky':    '#0D1B2A',
        'star-gold':    '#FFD76A',
        'dream-purple': '#9B87F5',
        'ocean-blue':   '#2E5BFF',
        'galaxy-challenge': '#3D2B6E',
        'galaxy-growth':    '#1A4A5C',
        'galaxy-relation':  '#4A2B4A',
        'galaxy-healing':   '#1A4A3A',
      },
      fontFamily: {
        sans: ['Pretendard', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
