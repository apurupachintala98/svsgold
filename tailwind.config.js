export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#16a34a',
        accent: '#f59e0b',
        dark: '#1f2937',
        light: '#f9fafb'
      },
      boxShadow: {
        'glow': '0 0 15px rgba(22, 163, 74, 0.3)',
        'glow-subtle': '0 2px 8px rgba(22, 163, 74, 0.15)'
      }
    }
  },
  plugins: []
}
