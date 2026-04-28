"use client";

import type { ReactNode } from "react";
import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";

import { usePreferences } from "@/components/preferences-provider";
import {
  cancelPendingRouteViewTransition,
  completePendingRouteViewTransition,
} from "@/lib/view-transitions";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { reducedMotion } = usePreferences();

  useLayoutEffect(() => {
    if (reducedMotion) {
      cancelPendingRouteViewTransition();

      return;
    }

    completePendingRouteViewTransition();
  }, [pathname, reducedMotion]);

  return (
    <div className="page-transition-shell flex min-h-0 flex-1 flex-col">
      {children}
    </div>
  );
}
