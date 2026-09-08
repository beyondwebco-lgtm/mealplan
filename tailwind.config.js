/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F8F7F4',
        surface: '#FFFFFF',
        primary: {
          DEFAULT: '#2F5D50',
          hover: '#24483E',
          light: '#3D7767',
          soft: '#E8F0EC',
        },
        accent: {
          DEFAULT: '#D89B5B',
          hover: '#C28343',
          soft: '#FDF6EC',
        },
        charcoal: {
          DEFAULT: '#1F2933',
          muted: '#6B7280',
          subtle: '#9CA3AF',
        },
        border: {
          DEFAULT: '#E5E7EB',
          light: '#F3F4F6',
          dark: '#D1D5DB',
        },
        like: {
          bg: '#F0FDF4',
          border: '#BBF7D0',
          text: '#166534',
        },
        dislike: {
          bg: '#FEF2F2',
          border: '#FECACA',
          text: '#991B1B',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'card': '0 2px 8px -2px rgba(31, 41, 51, 0.06), 0 1px 4px -1px rgba(31, 41, 51, 0.04)',
        'card-hover': '0 10px 25px -5px rgba(31, 41, 51, 0.08), 0 8px 10px -6px rgba(31, 41, 51, 0.04)',
        'modal': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
}
