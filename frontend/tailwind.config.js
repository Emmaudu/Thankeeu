/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#EEEAFF',
          100: '#C9C1F7',
          200: '#A59AEF',
          300: '#897FEB',
          400: '#6C5CE7',
          500: '#5B4BDF',
          600: '#4834D4',
          700: '#3C28BB',
          800: '#30219B',
          900: '#1E1566'
        },
        pink: {
          50:  '#FDE8F0',
          100: '#F9B8D0',
          400: '#E84393',
          600: '#B5307A',
          800: '#7D1F55'
        }
      },
      fontFamily: {
        sans:    ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif']
      },
      screens: {
        xs: '375px',  // iPhone SE
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
      },
      spacing: {
        safe: 'env(safe-area-inset-bottom)',
      },
      maxWidth: {
        'screen-sm': '640px',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'card':    '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-lg': '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)',
        'float':   '0 20px 60px -10px rgb(127 119 221 / 0.25)',
      },
      animation: {
        'float':       'float 6s ease-in-out infinite',
        'pulse-slow':  'pulse 3s ease-in-out infinite',
        'slide-up':    'slideUp 0.4s ease-out',
        'fade-in':     'fadeIn 0.3s ease-out',
        'bounce-slow': 'bounce 2s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' }
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' }
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' }
        }
      },
      lineHeight: {
        'tight':   '1.2',
        'snug':    '1.375',
        'normal':  '1.5',
        'relaxed': '1.625',
        'loose':   '2',
      }
    }
  },
  plugins: []
}
