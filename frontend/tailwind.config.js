/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef9ee',
          100: '#fef0d2',
          200: '#fddea5',
          300: '#fcc56d',
          400: '#faa233',
          500: '#f8840d',
          600: '#e96908',
          700: '#c2500b',
          800: '#9b4010',
          900: '#7d3611',
        },
        kinder: {
          yellow: '#FFD93D',
          orange: '#FF6B35',
          green: '#6BCB77',
          blue: '#4D96FF',
          purple: '#C77DFF',
          pink: '#FF85A2',
        },
      },
      fontFamily: {
        display: ['Nunito', 'sans-serif'],
        body: ['Nunito', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
    },
  },
  plugins: [],
}
