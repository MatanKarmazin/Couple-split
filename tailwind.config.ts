import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1f2933",
        sage: "#507568",
        coral: "#d96f5d",
        honey: "#f0b84f",
        mist: "#eef5f2"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(31, 41, 51, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
