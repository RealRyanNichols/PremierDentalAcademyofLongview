/** Compiled utilities for the public pages migrated off the Play CDN. */
const { scanPublicPages } = require('./scripts/tailwind-public-pages.cjs');

module.exports = {
  content: {
    relative: true,
    files: [
      ...scanPublicPages(__dirname).pages.map(page => `./${page}`),
      // Navigation, footer, forms and authentication states inject utilities.
      './assets/**/*.js',
      './videos/**/*.js',
    ],
  },
  // Practice Pro assembles these two simulated-vitals alert palettes at runtime.
  safelist: [
    'bg-rose-50', 'border-rose-200', 'text-rose-900',
    'bg-amber-50', 'border-amber-200', 'text-amber-900',
    // The Diana commute calculator builds these two card palettes from a name.
    'bg-teal-50', 'border-teal-100', 'text-teal-700',
    'bg-amber-50', 'border-amber-100', 'text-amber-700',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Inter', 'serif'],
      },
      colors: {
        navy: { 900: '#0a1226', 800: '#0f172a', 700: '#1e293b' },
        teal: { 600: '#0d9488', 700: '#0f766e', 800: '#115e59' },
        amber: { 400: '#fbbf24', 500: '#f59e0b' },
      },
    },
  },
};
