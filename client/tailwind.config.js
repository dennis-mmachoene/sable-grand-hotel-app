/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary – Sable (deep warm navy)
        primary: {
          50:  '#f0f3fa',
          100: '#d8e0f2',
          200: '#b3c2e6',
          300: '#8aa0d8',
          400: '#6682cc',
          500: '#4566bf',
          600: '#2f4fa8',
          700: '#243d87',
          800: '#1a2d66',
          900: '#111e45',
          950: '#0A1628',
        },
        // Gold – Krugerrand accent
        gold: {
          50:  '#fdf9ee',
          100: '#f9efcc',
          200: '#f2db8f',
          300: '#e9c45c',
          400: '#dfad35',
          500: '#C9A84C',
          600: '#b08a2a',
          700: '#8d6c1f',
          800: '#6e541a',
          900: '#594417',
          950: '#312507',
        },
        // Neutral – Warm ivory/linen
        surface: {
          50:  '#FAFAF8',
          100: '#F5F4F0',
          200: '#EEECE7',
          300: '#E2DED6',
          400: '#C9C4BA',
          500: '#A8A29A',
          600: '#857E76',
          700: '#6A6460',
          800: '#504C48',
          900: '#2E2C2A',
          950: '#1A1917',
        },
        // Semantic
        emerald: {
          50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0',
          300: '#6ee7b7', 400: '#34d399', 500: '#10b981',
          600: '#059669', 700: '#047857', 800: '#065f46', 900: '#064e3b',
        },
        amber: {
          50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a',
          300: '#fcd34d', 400: '#fbbf24', 500: '#f59e0b',
          600: '#d97706', 700: '#b45309', 800: '#92400e', 900: '#78350f',
        },
        rose: {
          50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3',
          300: '#fda4af', 400: '#fb7185', 500: '#f43f5e',
          600: '#e11d48', 700: '#be123c', 800: '#9f1239', 900: '#881337',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans:    ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'Menlo', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        'xs':       '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'card':     '0 1px 3px rgb(0 0 0 / 0.06), 0 1px 2px rgb(0 0 0 / 0.08)',
        'card-md':  '0 4px 16px rgb(0 0 0 / 0.08), 0 1px 4px rgb(0 0 0 / 0.06)',
        'card-lg':  '0 8px 32px rgb(0 0 0 / 0.12), 0 2px 8px rgb(0 0 0 / 0.08)',
        'card-xl':  '0 20px 60px rgb(0 0 0 / 0.18), 0 4px 16px rgb(0 0 0 / 0.12)',
        'glow-gold':'0 0 20px rgb(201 168 76 / 0.3)',
        'glow-primary':'0 0 20px rgb(36 61 135 / 0.3)',
        'inner-sm': 'inset 0 1px 2px rgb(0 0 0 / 0.06)',
        // Dark mode shadows
        'dark-card':    '0 1px 3px rgb(0 0 0 / 0.3), 0 1px 2px rgb(0 0 0 / 0.25)',
        'dark-card-md': '0 4px 16px rgb(0 0 0 / 0.4), 0 1px 4px rgb(0 0 0 / 0.3)',
        'dark-card-lg': '0 8px 32px rgb(0 0 0 / 0.5), 0 2px 8px rgb(0 0 0 / 0.4)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      animation: {
        'slide-up':      'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down':    'slideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-left':    'slideLeft 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in':       'fadeIn 0.25s ease-out',
        'scale-in':      'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce-gentle': 'bounceGentle 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
        'shimmer':       'shimmer 1.8s infinite linear',
        'pulse-gold':    'pulseGold 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'notification-in': 'notificationIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'spin-slow':     'spin 3s linear infinite',
      },
      keyframes: {
        slideUp:     { from: { transform: 'translateY(16px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        slideDown:   { from: { transform: 'translateY(-16px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        slideLeft:   { from: { transform: 'translateX(16px)', opacity: 0 }, to: { transform: 'translateX(0)', opacity: 1 } },
        fadeIn:      { from: { opacity: 0 }, to: { opacity: 1 } },
        scaleIn:     { from: { transform: 'scale(0.92)', opacity: 0 }, to: { transform: 'scale(1)', opacity: 1 } },
        bounceGentle:{ '0%': { transform: 'scale(0.85)', opacity: 0 }, '60%': { transform: 'scale(1.03)' }, '100%': { transform: 'scale(1)', opacity: 1 } },
        shimmer:     { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
        pulseGold:   { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.5 } },
        notificationIn: { from: { transform: 'translateX(100%)', opacity: 0 }, to: { transform: 'translateX(0)', opacity: 1 } },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};
