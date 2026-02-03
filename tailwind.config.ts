import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Mollie-inspired green palette
        brand: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#0a856b", // Primary brand green
          600: "#088060",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
        // Sidebar dark colors
        sidebar: {
          bg: "#1a1a1a",
          hover: "#2a2a2a",
          active: "#333333",
          border: "#333333",
        },
        // Clean neutrals
        surface: {
          primary: "#ffffff",
          secondary: "#fafafa",
          tertiary: "#f5f5f5",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
        display: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "card": "0 1px 3px rgba(0, 0, 0, 0.08)",
        "card-hover": "0 4px 12px rgba(0, 0, 0, 0.1)",
        "button": "0 1px 2px rgba(0, 0, 0, 0.05)",
      },
      borderRadius: {
        "xl": "12px",
        "2xl": "16px",
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.4s ease-out",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
