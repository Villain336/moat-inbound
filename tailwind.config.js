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
          bg: '#09090b',
          surface: 'rgba(255,255,255,0.02)',
          border: 'rgba(255,255,255,0.06)',
          green: '#34c759',
          red: '#ff3b30',
          orange: '#ff9500',
          blue: '#007aff',
          purple: '#8b5cf6',
        },
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
