import type { Config } from 'tailwindcss'

export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'pastel': '#FFEBEE',
        'lavanda': '#D1A7E1',
        'rosa-intenso': '#F06292',
        'carbon': '#1A1A1A',
        'exito': '#66BB6A',
        'aviso': '#FFD54F',
        'error': '#EF5350',
      },
      fontFamily: {
        'logo': ['"Great Vibes"', 'cursive'],
        'slogan': ['"Architects Daughter"', 'cursive'],
      },
    },
  },
  plugins: [],
} satisfies Config
