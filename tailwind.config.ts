import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        'sharp': ['Sharp Grotesk', 'sans-serif'],
        'actay': ['Actay', 'sans-serif'],
        'actay-wide': ['Actay Wide', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
