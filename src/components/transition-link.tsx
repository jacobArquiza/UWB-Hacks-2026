"use client";

import type { ComponentProps } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";

import { startRouteViewTransition } from "@/lib/view-transitions";

type TransitionLinkProps = Omit<ComponentProps<typeof NextLink>, "href"> & {
  href: string;
  disableTransition?: boolean;
};

export function TransitionLink({
  href,
  replace,
  scroll,
  onNavigate,
  disableTransition = false,
  ...props
}: TransitionLinkProps) {
  const router = useRouter();

  return (
    <NextLink
      href={href}
      replace={replace}
      scroll={scroll}
      onNavigate={(event) => {
        let navigationPrevented = false;

        onNavigate?.({
          preventDefault: () => {
            navigationPrevented = true;
            event.preventDefault();
          },
        });

        if (navigationPrevented || disableTransition) {
          return;
        }

        event.preventDefault();

        startRouteViewTransition(() => {
          if (replace) {
            router.replace(href, { scroll });
            return;
          }

          router.push(href, { scroll });
        });
      }}
      {...props}
    />
  );
}

export function useTransitionRouter() {
  const router = useRouter();

  return {
    push: (href: string, options?: { scroll?: boolean }) => {
      startRouteViewTransition(() => {
        router.push(href, options);
      });
    },
    replace: (href: string, options?: { scroll?: boolean }) => {
      startRouteViewTransition(() => {
        router.replace(href, options);
      });
    },
  };
}
