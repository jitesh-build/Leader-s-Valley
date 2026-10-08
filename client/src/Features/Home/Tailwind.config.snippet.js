// Merge into your tailwind.config.js (content must include ./src/**/*.{ts,tsx})
// Add to index.html <head>:
// <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
export default {
  theme: {
    extend: {
      fontFamily: {
        display: ['"Barlow Condensed"', "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        page: "#0f0f10",
        panel: "#131315",
        card: "#18181b",
        line: "#27272a",
        muted: "#71717a",
        muted2: "#a1a1aa",
        gold: { DEFAULT: "#d9a93f", soft: "#ecc15a", dim: "#b88a2e" },
      },
    },
  },
};