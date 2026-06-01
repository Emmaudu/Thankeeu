/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#EEEDFE",
          100: "#CECBF6",
          200: "#AFA9EC",
          300: "#9790E4",
          400: "#7F77DD",
          500: "#6960CA",
          600: "#534AB7",
          700: "#473FA0",
          800: "#3C3489",
          900: "#26215C",
        },
        pink: {
          50: "#FBEAF0",
          100: "#F4C0D1",
          400: "#D4537E",
          600: "#993556",
          800: "#72243E",
        },
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"],
      },
      screens: {
        xs: "375px", // iPhone SE
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
      },
      spacing: {
        safe: "env(safe-area-inset-bottom)",
      },
      maxWidth: {
        "screen-sm": "640px",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
        "card-lg":
          "0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)",
        float: "0 20px 60px -10px rgb(127 119 221 / 0.25)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "slide-up": "slideUp 0.4s ease-out",
        "fade-in": "fadeIn 0.3s ease-out",
        "bounce-slow": "bounce 2s infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      lineHeight: {
        tight: "1.2",
        snug: "1.375",
        normal: "1.5",
        relaxed: "1.625",
        loose: "2",
      },
    },
  },
  plugins: [],
};
