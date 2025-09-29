import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // OKLCH Color System
        primary: {
          50: 'oklch(0.97 0.01 255)',
          100: 'oklch(0.94 0.02 255)',
          200: 'oklch(0.87 0.04 255)',
          300: 'oklch(0.77 0.07 255)',
          400: 'oklch(0.64 0.12 255)',
          500: 'oklch(0.55 0.17 255)',
          600: 'oklch(0.48 0.16 255)',
          700: 'oklch(0.41 0.13 255)',
          800: 'oklch(0.35 0.11 255)',
          900: 'oklch(0.29 0.09 255)',
          950: 'oklch(0.18 0.06 255)',
        },
        secondary: {
          50: 'oklch(0.98 0.01 120)',
          100: 'oklch(0.95 0.02 120)',
          200: 'oklch(0.89 0.04 120)',
          300: 'oklch(0.81 0.08 120)',
          400: 'oklch(0.70 0.14 120)',
          500: 'oklch(0.59 0.19 120)',
          600: 'oklch(0.51 0.18 120)',
          700: 'oklch(0.43 0.15 120)',
          800: 'oklch(0.37 0.12 120)',
          900: 'oklch(0.31 0.10 120)',
          950: 'oklch(0.19 0.06 120)',
        },
        accent: {
          50: 'oklch(0.97 0.01 300)',
          100: 'oklch(0.94 0.03 300)',
          200: 'oklch(0.87 0.06 300)',
          300: 'oklch(0.78 0.11 300)',
          400: 'oklch(0.66 0.17 300)',
          500: 'oklch(0.57 0.21 300)',
          600: 'oklch(0.49 0.20 300)',
          700: 'oklch(0.42 0.17 300)',
          800: 'oklch(0.36 0.14 300)',
          900: 'oklch(0.30 0.11 300)',
          950: 'oklch(0.18 0.07 300)',
        },
        border: 'oklch(0.89 0.01 255)',
        input: 'oklch(0.89 0.01 255)',
        ring: 'oklch(0.55 0.17 255)',
        background: 'oklch(1 0 0)',
        foreground: 'oklch(0.09 0.01 255)',
        muted: {
          DEFAULT: 'oklch(0.96 0.01 255)',
          foreground: 'oklch(0.45 0.01 255)',
        },
        popover: {
          DEFAULT: 'oklch(1 0 0)',
          foreground: 'oklch(0.09 0.01 255)',
        },
        card: {
          DEFAULT: 'oklch(1 0 0)',
          foreground: 'oklch(0.09 0.01 255)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-fira-code)', 'monospace'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-from-top': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'slide-in-from-bottom': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'slide-in-from-left': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-in-from-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-in-from-top': 'slide-in-from-top 0.3s ease-out',
        'slide-in-from-bottom': 'slide-in-from-bottom 0.3s ease-out',
        'slide-in-from-left': 'slide-in-from-left 0.3s ease-out',
        'slide-in-from-right': 'slide-in-from-right 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config