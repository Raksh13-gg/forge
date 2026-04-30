/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: '#09090B',
        canvas: '#0C0C0E',
        surface: {
          DEFAULT: '#121217',
          raised: '#18181F',
          inset: '#0A0A0F',
        },
        border: {
          subtle: 'rgba(255,255,255,0.04)',
          default: 'rgba(255,255,255,0.08)',
          strong: 'rgba(255,255,255,0.14)',
        },
        fg: {
          primary: '#FAFAFA',
          secondary: '#A1A1AA',
          tertiary: '#52525B',
        },
        accent: {
          glow: '#8B5CF6',
          indigo: '#6366F1',
        },
        success: { 
          DEFAULT: '#10B981', 
          bg: 'rgba(16,185,129,0.1)', 
          border: 'rgba(16,185,129,0.2)',
          fg: '#10B981'
        },
        danger:  { 
          DEFAULT: '#EF4444', 
          bg: 'rgba(239,68,68,0.1)',  
          border: 'rgba(239,68,68,0.2)',
          fg: '#EF4444'
        },
        warning: { 
          DEFAULT: '#F59E0B', 
          bg: 'rgba(245,158,11,0.1)', 
          border: 'rgba(245,158,11,0.2)',
          fg: '#F59E0B'
        },
      },
      fontFamily: {
        display: ['Satoshi', 'Inter', 'system-ui', 'sans-serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'SF Mono', 'monospace'],
      },
      fontSize: {
        'display-hero': ['4.5rem', { lineHeight: '1.0',  letterSpacing: '-0.04em',  fontWeight: '900' }],
        'display-lg':   ['3.5rem', { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '800' }],
        'display-md':   ['2.5rem', { lineHeight: '1.1',  letterSpacing: '-0.02em',  fontWeight: '700' }],
        'display-sm':   ['2rem',   { lineHeight: '1.15', letterSpacing: '-0.015em', fontWeight: '600' }],
        'label':        ['0.6875rem', { lineHeight: '1.3', letterSpacing: '0.08em', fontWeight: '600' }],
        'micro':        ['0.625rem',  { lineHeight: '1.2', letterSpacing: '0.06em', fontWeight: '700' }],
      },
      borderRadius: {
        'xl':  '1.25rem',
        '2xl': '1.5rem',
      },
      backgroundImage: {
        'mesh': 'var(--glow-mesh)',
        'card-gradient': 'var(--card-gradient)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
};
