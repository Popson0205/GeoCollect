import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#2563eb", dark: "#1d4ed8", light: "#3b82f6" },
        surface: { DEFAULT: "#ffffff", muted: "#f8fafc", border: "#e2e8f0" },
        geo: { green: "#16a34a", orange: "#ea580c", red: "#dc2626" }
      }
    }
  },
  plugins: []
};
export default config;
