/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        moat: {
          black: '#0a0a0a',
          yellow: '#f5c518',
          'yellow-light': '#fde68a',
          'yellow-dark': '#b8960f',
          silver: '#c0c0c0',
          'silver-light': '#e8e8e8',
          'silver-dark': '#8a8a8a',
          chrome: '#d4d4d8',
          surface: '#fafafa',
          border: '#e4e4e7',
          'border-strong': '#d4d4d8',
          danger: '#dc2626',
          success: '#16a34a',
          warning: '#ea580c',
          info: '#2563eb',
          purple: '#7c3aed',
        },
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      backgroundImage: {
        'metallic': 'linear-gradient(135deg, #e8e8e8 0%, #f5f5f5 25%, #d4d4d8 50%, #e8e8e8 75%, #f0f0f0 100%)',
        'metallic-dark': 'linear-gradient(135deg, #18181b 0%, #27272a 25%, #3f3f46 50%, #27272a 75%, #18181b 100%)',
        'gold-gradient': 'linear-gradient(135deg, #f5c518 0%, #fde68a 50%, #f5c518 100%)',
      },
      boxShadow: {
        'metallic': '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.6)',
        'metallic-hover': '0 4px 12px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.6)',
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)',
        'card-hover': '0 8px 24px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)',
      },
    },
  },
  plugins: [],
};
