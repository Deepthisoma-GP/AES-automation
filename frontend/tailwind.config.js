/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#FD4E59", fg: "#FFFFFF" },
        secondary: { DEFAULT: "#FFAB28", fg: "#161916" },
        canvas: "#FFFDFF",
        card: "#FDF8F4",
        muted: "#FFF0DC",
        ink: "#161916",
        subtle: "#494949",
        accent: "#6D7069",
        border: "#F0E6DC",
      },
      fontFamily: {
        sans: ['"Funnel Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(22,25,22,0.04), 0 8px 24px rgba(22,25,22,0.05)",
      },
      borderRadius: { xl: "0.9rem", "2xl": "1.25rem" },
    },
  },
  plugins: [],
};
