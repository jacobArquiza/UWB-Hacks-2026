"use client";

import type { ReactNode } from "react";
import { Auth0Provider } from "@auth0/nextjs-auth0/client";
import type { User } from "@auth0/nextjs-auth0/types";
import { Toaster } from "sonner";

import {
  PreferencesProvider,
  usePreferences,
} from "@/components/preferences-provider";

type ProvidersProps = {
  children: ReactNode;
  authEnabled: boolean;
  authUser?: User;
};

function ThemedToaster() {
  const { theme } = usePreferences();

  return (
    <Toaster
      position="top-center"
      richColors
      theme={theme === "light" ? "light" : "dark"}
      toastOptions={{
        style:
          theme === "light"
            ? {
                background: "#ffffff",
                border: "1px solid rgba(17,19,26,0.1)",
                color: "#11131a",
              }
            : {
                background: "#17181b",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#f3efe9",
              },
      }}
    />
  );
}

export function Providers({
  children,
  authEnabled,
  authUser,
}: ProvidersProps) {
  const content = authEnabled ? (
    <Auth0Provider user={authUser}>{children}</Auth0Provider>
  ) : (
    children
  );

  return (
    <PreferencesProvider>
      {content}
      <ThemedToaster />
    </PreferencesProvider>
  );
}
