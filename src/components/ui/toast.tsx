"use client";

import { Toaster } from "react-hot-toast";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: "rgba(255,255,255,0.7)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.7)",
          borderRadius: "12px",
          color: "#1a1a2e",
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
        },
        success: {
          iconTheme: { primary: "#00b894", secondary: "#fff" },
        },
        error: {
          iconTheme: { primary: "#e17055", secondary: "#fff" },
        },
      }}
    />
  );
}
