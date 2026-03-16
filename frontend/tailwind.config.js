/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Sora", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"]
      },
      colors: {
        brand: {
          50:  "#ecfeff",
          100: "#cffafe",
          200: "#a5f3fc",
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
          700: "#0e7490",
          800: "#155e75",
          900: "#164e63"
        },
        surface: {
          950: "#060d1e",
          900: "#0a1628",
          800: "#0d1e38",
          700: "#122440",
          600: "#1a2e50"
        }
      },
      animation: {
        "pulse-ring": "pulse-ring 2s cubic-bezier(0.4,0,0.6,1) infinite",
        "fade-up": "fade-up 0.5s ease-out forwards",
        "wave": "wave 1.2s ease-in-out infinite",
        "glow": "glow 3s ease-in-out infinite alternate"
      },
      keyframes: {
        "pulse-ring": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(34, 211, 238, 0.4)" },
          "50%":       { boxShadow: "0 0 0 14px rgba(34, 211, 238, 0)" }
        },
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        "wave": {
          "0%, 100%": { transform: "scaleY(0.4)" },
          "50%":       { transform: "scaleY(1.0)" }
        },
        "glow": {
          "0%":   { opacity: "0.5" },
          "100%": { opacity: "1" }
        }
      },
      backgroundImage: {
        "grid-pattern": "linear-gradient(rgba(34,211,238,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.04) 1px, transparent 1px)"
      },
      backgroundSize: {
        "grid": "48px 48px"
      }
    }
  },
  plugins: []
};
