/** @type {import("tailwindcss").Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#58CC02",
        primaryDark: "#46A302",
        primaryLight: "#E9F9D6",
        background: "#F7F7F7",
        surface: "#FFFFFF",
        textMuted: "#AEAEB2",
        error: "#FF6B6B",
        warning: "#FF9F0A",
      },
    },
  },
  plugins: [],
};
