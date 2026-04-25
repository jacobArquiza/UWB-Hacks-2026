import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";

import { Providers } from "@/app/providers";
import { SiteNav } from "@/components/site-nav";
import { getSessionSafe, isAuth0Configured } from "@/lib/auth0";

import "./globals.css";

const sora = Sora({
  variable: "--font-heading",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RoRadar",
  description:
    "RoRadar turns Roblox signals into a parent-readable safety snapshot.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSessionSafe();

  return (
    <html
      lang="en"
      className={`${sora.variable} ${manrope.variable} dark h-full`}
    >
      <body className="min-h-full font-sans">
        <Providers>
          <div className="min-h-dvh">
            <SiteNav
              authConfigured={isAuth0Configured}
              isLoggedIn={Boolean(session?.user)}
              userLabel={
                session?.user.name ??
                session?.user.nickname ??
                session?.user.email ??
                "Parent account"
              }
            />
            <main className="flex min-h-[calc(100dvh-4rem)] flex-col">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
