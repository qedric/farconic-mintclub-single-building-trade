import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./@/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    // js files primarily because in dist
    "./node_modules/frames.js/dist/render/next/*.{ts,tsx,js,css}",
    "./node_modules/frames.js/dist/render/*.{ts,tsx,js,css}",
    "./node_modules/frames.js/dist/**/*.{ts,tsx,js,css}",

    // monorepo weirdness
    "../../node_modules/frames.js/dist/render/next/*.{ts,tsx,js,css}",
    "../../node_modules/frames.js/dist/render/*.{ts,tsx,js,css}",
    "../../node_modules/frames.js/dist/**/*.{ts,tsx,js,css}",
  ],
  theme: {
    extend: {
      colors: {
        'regal-blue': '#243c5a',
        'testtt': '#ff0000',
      },
    }
  },
  plugins: [],
};
export default config;
