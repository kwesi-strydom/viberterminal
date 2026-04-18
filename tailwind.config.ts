import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Painterly Ghibli-ish palette — warm sky, soft teals, muted coral
        sky: {
          dawn: "#f8d7b6",
          day: "#bfe3f0",
          deep: "#6ea2c5",
          dusk: "#f5a88a",
        },
        land: {
          moss: "#7fae72",
          sand: "#e9c98d",
          stone: "#a99a8a",
        },
        ink: {
          50: "#fbf8f2",
          900: "#0f1115",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui"],
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
