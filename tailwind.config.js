/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./public/**/*.html",     // look for Tailwind classes in your HTML
    "./resources/**/*.js",    // look for classes in JS files
    "./resources/**/*.css",   // optional: look in CSS files
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
