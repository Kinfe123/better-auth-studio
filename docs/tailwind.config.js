/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: '#000000',
        'background-light': '#ffffff',
        'background-dark': '#0a0a0a',
        'grid-light': '#e5e5e5',
        'grid-dark': '#1a1a1a',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Inter', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0px',
      },
    },
  },
  plugins: [],
}
