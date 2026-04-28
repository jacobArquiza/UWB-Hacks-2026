import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";

import { Providers } from "@/app/providers";
import { PageTransition } from "@/components/page-transition";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { getSessionSafe, isAuth0Configured } from "@/lib/auth0";
import { getPreferencesBootstrapScript } from "@/lib/preferences";

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
      data-theme="dark"
      data-motion="default"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${sora.variable} ${manrope.variable} h-full`}
    >
      <body suppressHydrationWarning className="min-h-full font-sans">
        <script
          dangerouslySetInnerHTML={{
            __html: getPreferencesBootstrapScript(),
          }}
        />
        <Providers authEnabled={isAuth0Configured} authUser={session?.user}>
          <div className="flex min-h-dvh flex-col">
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
            <main className="flex flex-1 flex-col">
              <PageTransition>{children}</PageTransition>
            </main>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
