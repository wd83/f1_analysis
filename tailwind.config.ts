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
        f1: {
          red: "#e10600",
          dark: "#15151e",
          gray: "#38383f",
          light: "#f5f5f5",
        },
      },
    },
  },
  plugins: [],
};

export default config;
