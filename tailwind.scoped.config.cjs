/** Separate trainer styles and Career Plan colors; never feed these into site CSS. */
const scopes = {
  'practice-pro': {
    page: './tools/practice-pro.html',
    safelist: [
      'input', 'label', 'btn', 'btn-primary', 'btn-ghost', 'btn-danger', 'btn-soft', 'marker-btn',
      // The vitals alerts assemble the palette name at runtime.
      'bg-rose-50', 'border-rose-200', 'text-rose-900',
      'bg-amber-50', 'border-amber-200', 'text-amber-900',
    ],
    theme: {},
  },
  chairside: {
    page: './tools/chairside.html',
    safelist: ['input', 'label', 'btn', 'btn-primary', 'btn-ghost', 'btn-danger', 'btn-soft'],
    theme: {},
  },
  'career-plan': {
    page: './career-plan.html',
    safelist: [],
    // Exact original inline theme. The custom rose palette belongs to this page.
    theme: {
      extend: {
        fontFamily: {
          sans: ['Inter', 'system-ui', 'sans-serif'],
          display: ['Fraunces', 'Inter', 'serif'],
        },
        colors: {
          cream: '#FFF9F5',
          plum: { 900: '#3D2E44', 700: '#5A4767', 500: '#8A7691', 300: '#BCA9C4' },
          rose: { 50: '#FDF1F4', 100: '#FBE5EB', 200: '#F7CFDA', 300: '#F2B8C6', 400: '#E692A8', 500: '#D96C8A', 600: '#C4536F', 700: '#A93E58' },
          sage: { 50: '#F0F9F6', 100: '#DFF2EA', 200: '#C9E8DD', 400: '#8FCBB8', 500: '#6FB5A0', 700: '#3F8A74', 800: '#2F6B5A' },
          gold: { 50: '#FDF7EA', 100: '#FBF0DC', 300: '#F2D49B', 500: '#DFA84E', 700: '#B9822B' },
          lav: { 50: '#F7F4FC', 100: '#F1ECFA', 300: '#D3C5EE', 500: '#9F87CB', 700: '#77619F' },
        },
      },
    },
  },
};

const selected = scopes[process.env.PDA_TAILWIND_SCOPE];
if (!selected) throw new Error('Choose practice-pro, chairside, or career-plan with PDA_TAILWIND_SCOPE.');

module.exports = {
  content: {
    relative: true,
    files: [selected.page, `./styles/tailwind-${process.env.PDA_TAILWIND_SCOPE}.css`, './assets/**/*.js', './auth.js'],
  },
  safelist: selected.safelist,
  theme: selected.theme,
};
