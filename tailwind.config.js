/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(circle, var(--tw-gradient-stops))',
      },
      borderRadius: {
        '50': '50px',
      }
    },
  },
  plugins: [],
  safelist: [
    'from-cyan-500',
    'to-blue-600',
    'from-cyan-600',
    'to-blue-700',
    'opacity-0',
    'group-hover:opacity-100',
    'transition-opacity',
    'group'
  ]
}