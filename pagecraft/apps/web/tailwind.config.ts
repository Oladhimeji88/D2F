import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172132",
        sand: "#F7F3EB",
        mist: "#E8EEF9",
        success: "#0F766E",
        warning: "#B54708",
        danger: "#B42318"
      },
      boxShadow: {
        panel: "0 24px 48px rgba(23, 33, 50, 0.12)"
      },
      borderRadius: {
        xl2: "1.25rem"
      }
    }
  },
  plugins: []
};

export default config;
