/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      animation: {
        wiggle: "wiggle 1s ease-in-out infinite",
        bgload: "bgGradient 2s ease-in-out infinite",
      },
      keyframes: {
        bgGradient: {
          "0%, 100%": {backgroundPosition: "left"},
          "50%": {backgroundPosition: "right"},
        },
      },
    },
  },
  plugins: [],
};
