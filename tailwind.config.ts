import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#f0fdf9",
          100: "#ccfbef",
          200: "#99f6e0",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
      },
      keyframes: {
        borderPulse: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(16, 185, 129, 0.45)" },
          "50%": { boxShadow: "0 0 0 8px rgba(16, 185, 129, 0)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "border-pulse": "borderPulse 1.8s ease-out 3",
        "fade-up": "fadeUp 0.4s ease-out forwards",
        "shimmer": "shimmer 2s infinite linear",
      },
      boxShadow: {
        "soft": "0 2px 8px rgba(15, 23, 42, 0.06)",
        "card": "0 4px 24px rgba(15, 23, 42, 0.08)",
        "strong": "0 28px 90px rgba(15, 23, 42, 0.12)",
        "glow": "0 0 0 4px rgba(16, 185, 129, 0.15)",
      },
    },
  },
  plugins: [],
};

export default config;