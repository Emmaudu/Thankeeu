/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:'#e6fff5', 100:'#b3ffe3', 200:'#80ffd1', 300:'#4dffbf',
          400:'#1affad', 500:'#00C37E', 600:'#009963', 700:'#007049',
          800:'#00472e', 900:'#001e14'
        },
        rose: {
          50:'#ffeef3', 100:'#ffc2d4', 200:'#ff95b5', 300:'#ff6896',
          400:'#ff3b77', 500:'#ff2d62', 600:'#e0194a', 700:'#b31239',
          800:'#860c29', 900:'#590619'
        },
        secondary: {
          50:'#fff3ee', 100:'#ffd9c8', 200:'#ffbfa2', 300:'#ffa07c',
          400:'#ff8156', 500:'#FF6B35', 600:'#cc5229', 700:'#993a1d',
          800:'#662311', 900:'#330b05'
        },
        gold: '#F5A623',
        dark: '#12091a',
        surface: '#f9f5ff',
      },
      fontFamily: {
        heading: ['"Plus Jakarta Sans"', 'sans-serif'],
        body:    ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 20px rgba(18,9,26,0.06)',
        glow: '0 0 32px rgba(255,45,98,0.25)',
        'rose-lg': '0 8px 40px rgba(255,45,98,0.2)',
      },
      borderRadius: {
        '2xl': '20px',
        '3xl': '24px',
        '4xl': '32px',
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease forwards',
        'slide-up':   'slideUp 0.5s ease forwards',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { from:{opacity:0}, to:{opacity:1} },
        slideUp:   { from:{opacity:0,transform:'translateY(20px)'}, to:{opacity:1,transform:'translateY(0)'} },
        pulseSoft: { '0%,100%':{opacity:1}, '50%':{opacity:0.6} },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
