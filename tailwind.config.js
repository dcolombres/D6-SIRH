import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './resources/views/**/*.blade.php',
    './resources/js/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        surface: '#f7f9fb',
        'surface-dim': '#d8dadc',
        'surface-bright': '#f7f9fb',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f2f4f6',
        'surface-container': '#eceef0',
        'surface-container-high': '#e6e8ea',
        'surface-container-highest': '#e0e3e5',
        'on-surface': '#191c1e',
        'on-surface-variant': '#45464d',
        outline: '#76777d',
        'outline-variant': '#c6c6cd',
        primary: 'var(--primary-color, #111111)',
        'on-primary': '#ffffff',
        secondary: '#515f74',
        error: '#ba1a1a',
        background: '#f7f9fb',
      },
      spacing: {
        'touch-target': '44px',
        'container-padding': '24px',
        'section-gap': '32px',
        gutter: '16px',
      },
      fontFamily: {
        body: ['Inter', ...defaultTheme.fontFamily.sans],
        headline: ['Hanken Grotesk', ...defaultTheme.fontFamily.sans],
        data: ['JetBrains Mono', ...defaultTheme.fontFamily.mono],
      },
    },
  },
  plugins: [forms],
};
