import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.5rem",
        sm: "2rem",
        lg: "3rem",
      },
      screens: {
        "2xl": "1200px",
      },
    },
    extend: {
      colors: {
        // Apple SF Colors
        blue: {
          DEFAULT: '#007AFF',
          50: '#E5F2FF',
          100: '#CCE5FF',
          500: '#007AFF',
          600: '#0051D5',
          700: '#0040A8',
        },
        // Neutrals (Apple Gray)
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6E6E73',
          600: '#86868B',
          700: '#4B5563',
          800: '#374151',
          900: '#1D1D1F',
        },
        // Status Colors
        success: '#34C759',
        warning: '#FF9F0A',
        error: '#FF3B30',
        info: '#5AC8FA',
        // Severity Colors
        critical: '#FF3B30',
        high: '#FF9F0A',
        medium: '#FFCC00',
        low: '#34C759',
        // Legacy mappings
        border: "#E5E7EB",
        input: "#F9FAFB",
        ring: "#007AFF",
        background: "#FFFFFF",
        foreground: "#1D1D1F",
        primary: {
          DEFAULT: "#007AFF",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#F3F4F6",
          foreground: "#1D1D1F",
        },
        destructive: {
          DEFAULT: "#FF3B30",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#F9FAFB",
          foreground: "#6E6E73",
        },
        accent: {
          DEFAULT: "#F3F4F6",
          foreground: "#1D1D1F",
        },
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "8px",
        md: "10px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        sm: '0 1px 3px 0 rgba(0, 0, 0, 0.08)',
        DEFAULT: '0 2px 8px 0 rgba(0, 0, 0, 0.1)',
        md: '0 4px 12px 0 rgba(0, 0, 0, 0.1)',
        lg: '0 8px 24px 0 rgba(0, 0, 0, 0.12)',
        xl: '0 12px 40px 0 rgba(0, 0, 0, 0.15)',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['SF Mono', 'Monaco', 'Consolas', 'monospace'],
      },
      fontSize: {
        xs: ['12px', { lineHeight: '1.5' }],
        sm: ['14px', { lineHeight: '1.5' }],
        base: ['16px', { lineHeight: '1.5' }],
        lg: ['18px', { lineHeight: '1.5' }],
        xl: ['20px', { lineHeight: '1.5' }],
        '2xl': ['24px', { lineHeight: '1.33' }],
        '3xl': ['28px', { lineHeight: '1.29' }],
        '4xl': ['32px', { lineHeight: '1.25' }],
        '5xl': ['40px', { lineHeight: '1.2' }],
        '6xl': ['48px', { lineHeight: '1.17' }],
      },
      letterSpacing: {
        tight: '-0.02em',
        normal: '0',
        wide: '0.02em',
      },
      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
export default config
