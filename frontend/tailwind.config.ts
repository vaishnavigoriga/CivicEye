/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // One restrained institutional blue. Status colours are used only for status and priority.
        civic: {
          950: '#0b2140',
          900: '#10315a',
          850: '#173d6d',
          800: '#1b4a85',
          700: '#1d4f91',
          600: '#2a63ad',
          500: '#4a82c4',
          100: '#dbe7f5',
          50: '#f0f5fb',
        },
        teal: {
          800: '#115e59',
          700: '#0f766e',
          600: '#0d9488',
          100: '#ccfbf1',
          50: '#f0fdfa',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '"Noto Sans Telugu"',
          '"Noto Sans Devanagari"',
          'system-ui',
          '-apple-system',
          '"Segoe UI"',
          'Roboto',
          'Arial',
          'sans-serif',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
        subtle: '0 1px 2px 0 rgba(15, 23, 42, 0.06)',
        card: '0 1px 3px 0 rgba(15, 23, 42, 0.08)',
        elevated: '0 8px 20px -4px rgba(15, 23, 42, 0.15)',
      },
    },
  },
  plugins: [],
};
