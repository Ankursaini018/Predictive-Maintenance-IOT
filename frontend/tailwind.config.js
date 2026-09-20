/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0a0f1e',
          800: '#0d1528',
          700: '#111c35',
          600: '#162040',
        },
        electric: {
          DEFAULT: '#00d4ff',
          dim: 'rgba(0,212,255,0.15)',
          glow: 'rgba(0,212,255,0.35)',
        },
        emerald: {
          iot: '#00ff88',
          'iot-dim': 'rgba(0,255,136,0.15)',
        },
        amber: {
          iot: '#ffb300',
          'iot-dim': 'rgba(255,179,0,0.15)',
        },
        danger: {
          DEFAULT: '#ff4444',
          dim: 'rgba(255,68,68,0.15)',
        },
        surface: 'rgba(255,255,255,0.04)',
        border: 'rgba(255,255,255,0.08)',
        muted: '#8892a4',
      },
      fontFamily: {
        sans: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '4px',
      },
      boxShadow: {
        glass: '0 4px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
        'electric-glow': '0 0 24px rgba(0,212,255,0.25)',
        'emerald-glow': '0 0 24px rgba(0,255,136,0.2)',
        'danger-glow': '0 0 24px rgba(255,68,68,0.25)',
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease forwards',
        'fade-in': 'fadeIn 0.4s ease forwards',
        pulse: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        blink: 'blink 1.5s ease infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(16px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        blink: {
          '0%,100%': { opacity: 1 },
          '50%': { opacity: 0.2 },
        },
      },
    },
  },
  plugins: [],
}
