/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/renderer/**/*.{tsx,ts,html}'],
  theme: {
    extend: {
      colors: {
        'bili-blue': '#00A1D6',
        'bili-pink': '#FB7299',
        'bili-bg': '#F4F5F7',
        'bili-bg-dark': '#1A1A2E',
      },
    },
  },
  plugins: [],
};
