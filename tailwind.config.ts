import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        repco: {
          red: '#E4002B',
          dark: '#1A1A1A',
          grey: '#4A4A4A',
        },
        napa: {
          blue: '#003087',
          yellow: '#FFD700',
          dark: '#0A1628',
        },
        gpc: {
          bg: '#0D0D0D',
          surface: '#1A1A1A',
          border: '#2A2A2A',
          accent: '#E4002B',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'count-up': 'countUp 0.3s ease-out',
        'leaderboard-in': 'leaderboardIn 0.6s ease-out both',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(40px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(228, 0, 43, 0.3)' },
          '50%': { boxShadow: '0 0 60px rgba(228, 0, 43, 0.8)' },
        },
        leaderboardIn: {
          '0%': { transform: 'translateX(-60px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
