/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg2: "#F8FAFC",
        text: "#111827",
        sub: "#6B7280",
        accent: "#2563EB",
        accent2: "#14B8A6",
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        border: "#E5E7EB",
        hoverbg: "#F3F4F6",
      },
    },
  },
  plugins: [],
};
