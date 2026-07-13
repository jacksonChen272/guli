/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#070a0d',
          900: '#0b1014',
          850: '#10161b',
          800: '#151c22',
        },
        brand: {
          300: '#68f3c8',
          400: '#32e2b0',
          500: '#18c995',
          600: '#0da97d',
        },
      },
      boxShadow: {
        panel: '0 18px 50px rgba(0,0,0,.22)',
        glow: '0 0 24px rgba(50,226,176,.18)',
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans TC', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
