/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#0D0D0D', 800: '#1A1A2E', 700: '#16213E', 600: '#0F3460' },
        amber: { neon: '#FFB800', glow: '#FFC933', light: '#FFE08A' },
        teal: { accent: '#00D4AA', dim: '#00A885' },
        slate: { card: '#1E2A3A', border: '#2A3A50', muted: '#4A5A70' }
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-10px)' } },
        slideIn: { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' } }
      }
    },
  },
  plugins: [],
}
