import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#E8472A',
          hover: '#CC3A1F',
          soft: 'rgba(232, 71, 42, 0.1)',
        },
        surface: {
          page: '#EFEFEF',
          card: '#FFFFFF',
          sidebar: '#FFFFFF',
          darkNav: '#1A1A1A',
        },
        neutral: {
          50: '#F7F7F7',
          100: '#F0F0F0',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        text: {
          primary: '#1A1A1A',
          secondary: '#737373',
          tertiary: '#A3A3A3',
          inverse: '#FFFFFF',
        },
        status: {
          active: '#22C55E',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#3B82F6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        xs: ['11px', '16px'],
        sm: ['12px', '18px'],
        base: ['14px', '22px'],
        md: ['15px', '24px'],
        lg: ['16px', '26px'],
        xl: ['18px', '28px'],
        '2xl': ['20px', '30px'],
        '3xl': ['24px', '34px'],
      },
      borderRadius: {
        none: '0px',
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '18px',
        '2xl': '24px',
        full: '9999px',
        // Semantic aliases
        card: '14px',
        input: '10px',
        dropzone: '12px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        md: '0 4px 12px rgba(0,0,0,0.08)',
        lg: '0 8px 24px rgba(0,0,0,0.10)',
        context: '0 4px 16px rgba(0,0,0,0.12)',
      },
      spacing: {
        0: '0px',
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        7: '28px',
        8: '32px',
        10: '40px',
        12: '48px',
        16: '64px',
      }
    },
  },
  plugins: [],
};
export default config;
