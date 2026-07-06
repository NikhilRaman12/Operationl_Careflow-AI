/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        careblue: {
          50: "#eff8ff",
          100: "#dff1ff",
          500: "#2388d9",
          600: "#176fb7",
          900: "#12334f",
        },
        careteal: {
          50: "#ecfdfb",
          100: "#cffaf3",
          500: "#19b8a5",
          700: "#0f766e",
        },
      },
      boxShadow: {
        command: "0 18px 45px rgba(15, 23, 42, 0.10)",
      },
    },
  },
  plugins: [],
};
