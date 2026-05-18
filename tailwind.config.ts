import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#d2d2d2",
        "bg-dark": "#1a1a2e",
        glass: "rgba(255,255,255,0.6)",
        "glass-dark": "rgba(255,255,255,0.06)",
        "glass-border": "rgba(255,255,255,0.7)",
        "glass-border-dark": "rgba(255,255,255,0.08)",
        accent: "#6c5ce7",
        "accent-hover": "#5a4bd1",
        "accent-glow": "rgba(108,92,231,0.3)",
        text: "#1a1a2e",
        "text-secondary": "#555",
        "text-muted": "#888",
        success: "#00b894",
        danger: "#e17055",
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.08)",
        "glass-hover": "0 12px 40px rgba(0,0,0,0.15)",
        glow: "0 0 20px rgba(108,92,231,0.3)",
        "glow-strong": "0 0 30px rgba(108,92,231,0.5)",
        card: "0 2px 8px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)",
        "card-hover": "0 4px 16px rgba(0,0,0,0.08), 0 16px 48px rgba(0,0,0,0.12)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease forwards",
        "fade-in-up": "fadeInUp 0.6s ease forwards",
        "scale-in": "scaleIn 0.4s ease forwards",
        "spin-slow": "spin 8s linear infinite",
        "pulse-soft": "pulse 2s ease-in-out infinite",
        "slide-up": "slideUp 0.3s ease forwards",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(108,92,231,0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(108,92,231,0.6)" },
        },
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
        "30": "7.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
