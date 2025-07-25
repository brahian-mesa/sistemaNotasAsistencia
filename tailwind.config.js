/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5', // Color principal (índigo)
        secondary: '#10B981', // Color secundario (verde esmeralda)
        accent: '#F59E0B', // Color de acento (ámbar)
      },
    },
  },
  plugins: [],
}