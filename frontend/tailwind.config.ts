/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        civic: {
          950: '#07101E',
          900: '#0B192C', // Deep enterprise municipal navy
          850: '#11223A',
          800: '#1E293B',
          700: '#1E3A8A', // Primary institutional blue
          600: '#2563EB',
          500: '#3B82F6',
          100: '#DBEAFE',
          50: '#EFF6FF',
        },
        teal: {
          800: '#115E59',
          700: '#0F766E', // Restrained civic accent
          600: '#0D9488',
          100: '#CCFBF1',
          50: '#F0FDFA',
        },
        surface: {
          base: '#FFFFFF',
          subtle: '#F8FAFC',
          muted: '#F1F5F9',
          border: '#E2E8F0',
          'border-strong': '#CBD5E1',
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'subtle': '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
        'card': '0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 4px 6px -2px rgba(15, 23, 42, 0.03)',
        'elevated': '0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.03)',
      },
      borderRadius: {
        'sm': '4px',
        'DEFAULT': '6px',
        'md': '8px',
        'lg': '10px',
        'xl': '12px',
      }
    },
  },
  plugins: [],
}
