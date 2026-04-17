/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef3f8',
          100: '#d6e2ee',
          200: '#adc4dd',
          300: '#7fa2c6',
          400: '#4f7ba9',
          500: '#2f5c8e',
          600: '#1a3a5c',
          700: '#153049',
          800: '#102538',
          900: '#0a1827'
        },
        accent: {
          amber: '#f59e0b',
          green: '#10b981',
          red: '#ef4444',
          blue: '#3b82f6',
          purple: '#8b5cf6'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif']
      },
      boxShadow: {
        card: '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)',
        float: '0 8px 24px rgba(26,58,92,0.18)'
      }
    }
  },
  plugins: []
}
