module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // This makes 'font-sans' resolve to your variable
        sans: ["var(--font-geist-sans)", "sans-serif"], 
      },
    },
  },
  plugins: [],
};