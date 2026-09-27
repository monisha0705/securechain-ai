/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        ink: {
          DEFAULT: '#0a0e1a',
          50: '#f0f1f5',
          100: '#d8dae5',
          200: '#b0b4cc',
          300: '#878db3',
          400: '#5f679a',
          500: '#3d4580',
          600: '#2b3166',
          700: '#1c214d',
          800: '#111633',
          900: '#0a0e1a',
        },
        cyan: {
          DEFAULT: '#00d4ff',
          dim: '#0099bb',
          glow: 'rgba(0,212,255,0.15)',
        },
        amber: {
          alert: '#f59e0b',
          glow: 'rgba(245,158,11,0.15)',
        },
        red: {
          alert: '#ef4444',
          glow: 'rgba(239,68,68,0.15)',
        },
        green: {
          safe: '#22c55e',
          glow: 'rgba(34,197,94,0.15)',
        }
      },
      backgroundImage: {
        'grid-subtle': `linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)`,
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan-line': 'scanLine 2s ease-in-out infinite',
        'fade-up': 'fadeUp 0.5s ease forwards',
      },
      keyframes: {
        scanLine: {
          '0%, 100%': { transform: 'translateY(0)', opacity: 1 },
          '50%': { transform: 'translateY(100%)', opacity: 0.3 },
        },
        fadeUp: {
          from: { opacity: 0, transform: 'translateY(12px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        }
      }
    }
  },
  plugins: []
}
