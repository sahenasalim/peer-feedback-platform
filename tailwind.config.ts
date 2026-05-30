import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      keyframes: {
        borderPulse: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(16, 185, 129, 0.45)" },
          "50%": { boxShadow: "0 0 0 8px rgba(16, 185, 129, 0)" },
        },
      },
      animation: {
        "border-pulse": "borderPulse 1.8s ease-out 3",
      },
    },
  },
  plugins: [],
};

export default config;
