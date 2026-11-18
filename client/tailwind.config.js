// /** @type {import('tailwindcss').Config} */
// export default {
//   content: ["./index.html", "./src/**/*.{ts,tsx}"],
//   theme: {
//     extend: {
//       colors: {
//         base: {
//           bg: "#0E1620",
//           panel: "#16212D",
//           panel2: "#1C2A38",
//           border: "#2A3B4B",
//           borderLight: "#374A5C",
//         },
//         ink: {
//           primary: "#E9EEF3",
//           muted: "#8FA1B0",
//           faint: "#5C7082",
//         },
//         team: {
//           DEFAULT: "#D4A64A",
//           bright: "#E8C778",
//           dim: "#8A6C2E",
//         },
//         enemy: {
//           DEFAULT: "#C4453A",
//           bright: "#E06A5D",
//           dim: "#7A2C25",
//         },
//         ok: "#4A9D6E",
//       },
//       fontFamily: {
//         display: ["Oswald", "sans-serif"],
//         body: ["Inter", "sans-serif"],
//         mono: ["JetBrains Mono", "monospace"],
//       },
//     },
//   },
//   plugins: [],
// };

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Game-UI colours used by the CWL pages (text-gold, bg-gold/15, from-gold-soft, text-gold-dim, border-line ...)
        gold: {
          DEFAULT: "#ECC15A", // main gold: titles, selected states, highlights
          soft: "#F6DC8E", // lighter gold: top of the gold buttons / lit base pips
          dim: "#B8934A", // muted gold: small labels like "NEW WAR"
        },
        // Border colour of the dark translucent panels, inputs and cards.
        line: "#6F757D",

        // Original palette (kept so nothing else breaks)
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
        display: ["Oswald", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};