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
        /* Warm Storybook section washes — pastel in light, nebula tint in dark (CSS vars in index.css).
           Usage: bg-wash-sky / text-ink-sky. See docs/design/warm-storybook/README.md */
        wash: {
          sky: 'rgb(var(--wash-sky) / <alpha-value>)',
          mint: 'rgb(var(--wash-mint) / <alpha-value>)',
          butter: 'rgb(var(--wash-butter) / <alpha-value>)',
          blush: 'rgb(var(--wash-blush) / <alpha-value>)',
          lavender: 'rgb(var(--wash-lavender) / <alpha-value>)',
          peach: 'rgb(var(--wash-peach) / <alpha-value>)',
        },
        ink: {
          sky: 'rgb(var(--ink-sky) / <alpha-value>)',
          mint: 'rgb(var(--ink-mint) / <alpha-value>)',
          butter: 'rgb(var(--ink-butter) / <alpha-value>)',
          blush: 'rgb(var(--ink-blush) / <alpha-value>)',
          lavender: 'rgb(var(--ink-lavender) / <alpha-value>)',
          peach: 'rgb(var(--ink-peach) / <alpha-value>)',
        },
        /* Gray + white driven by CSS vars — warm beige in light, cool gray in dark */
        white: 'rgb(var(--color-white) / <alpha-value>)',
        gray: {
          50: 'rgb(var(--color-gray-50) / <alpha-value>)',
          100: 'rgb(var(--color-gray-100) / <alpha-value>)',
          200: 'rgb(var(--color-gray-200) / <alpha-value>)',
          300: 'rgb(var(--color-gray-300) / <alpha-value>)',
          400: 'rgb(var(--color-gray-400) / <alpha-value>)',
          500: 'rgb(var(--color-gray-500) / <alpha-value>)',
          600: 'rgb(var(--color-gray-600) / <alpha-value>)',
          700: 'rgb(var(--color-gray-700) / <alpha-value>)',
          800: 'rgb(var(--color-gray-800) / <alpha-value>)',
          900: 'rgb(var(--color-gray-900) / <alpha-value>)',
          950: 'rgb(var(--color-gray-950) / <alpha-value>)',
        },
      },
      fontFamily: {
        display: ['Nunito', 'sans-serif'],
        body: ['Nunito', 'sans-serif'],
        fun: ['Fredoka', 'Nunito', 'sans-serif'],
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
