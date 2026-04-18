import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Game-specific palette
        game: {
          bg: "#080e1c",
          surface: "#0f1729",
          card: "#131f35",
          border: "#1e2d4a",
          muted: "#4a5a7a",
          text: "#e8eeff",
          "text-muted": "#8899bb",
        },
        // Tile feedback colors
        tile: {
          correct: "#22c55e",
          "correct-dark": "#16a34a",
          present: "#eab308",
          "present-dark": "#ca8a04",
          absent: "#2d3a52",
          "absent-dark": "#1e293b",
          empty: "#0f1729",
          active: "#1a2744",
        },
        // Keypad button colors
        key: {
          default: "#1e2d4a",
          hover: "#263554",
          correct: "#16a34a",
          present: "#ca8a04",
          absent: "#1e293b",
          action: "#2d3f63",
          "action-hover": "#374d78",
        },
        // Brand
        brand: {
          DEFAULT: "#6366f1",
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      keyframes: {
        "tile-flip": {
          "0%": { transform: "rotateX(0deg)" },
          "50%": { transform: "rotateX(-90deg)" },
          "100%": { transform: "rotateX(0deg)" },
        },
        "tile-shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(-6px)" },
          "40%": { transform: "translateX(6px)" },
          "60%": { transform: "translateX(-4px)" },
          "80%": { transform: "translateX(4px)" },
        },
        "tile-bounce": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "tile-pop": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "slide-down": {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "tile-flip": "tile-flip 0.5s ease-in-out",
        "tile-shake": "tile-shake 0.5s ease-in-out",
        "tile-bounce": "tile-bounce 0.4s ease-in-out",
        "tile-pop": "tile-pop 0.15s ease-out",
        "fade-in-up": "fade-in-up 0.4s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-down": "slide-down 0.2s ease-out",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
