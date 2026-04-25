"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="top-center"
        richColors
        theme="dark"
        toastOptions={{
          style: {
            background: "#17181b",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#f3efe9",
          },
        }}
      />
    </>
  );
}
