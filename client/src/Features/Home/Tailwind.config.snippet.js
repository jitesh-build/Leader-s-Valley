/** @type {import('tailwindcss').Config} */
// Needs in index.html <head>:
// <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // --- Site palette (from your Tailwind snippet): pages, cards, borders, text greys, gold ---
        page: "#0f0f10",
        panel: "#131315",
        card: "#18181b",
        line: "#27272a",
        muted: "#71717a",
        muted2: "#a1a1aa",
        gold: { DEFAULT: "#d9a93f", soft: "#ecc15a", dim: "#b88a2e" },

        // --- Original palette (kept so nothing else breaks) ---
        base: {
          bg: "#0E1620",
          panel: "#16212D",
          panel2: "#1C2A38",
          border: "#2A3B4B",
          borderLight: "#374A5C",
        },
        ink: {
          primary: "#E9EEF3",
          muted: "#8FA1B0",
          faint: "#5C7082",
        },
        team: {
          DEFAULT: "#D4A64A",
          bright: "#E8C778",
          dim: "#8A6C2E",
        },
        enemy: {
          DEFAULT: "#C4453A",
          bright: "#E06A5D",
          dim: "#7A2C25",
        },
        ok: "#4A9D6E",
      },
      fontFamily: {
        display: ['"Barlow Condensed"', "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};