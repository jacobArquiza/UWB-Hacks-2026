"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { ArrowRight, Ghost } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { readSavedChildren } from "@/lib/saved-children";
import type { SavedChildProfile } from "@/lib/types";

export function SavedChildrenGrid({ viewerName }: { viewerName: string }) {
  const children = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange);
      window.addEventListener("roradar-saved-children-change", onStoreChange);

      return () => {
        window.removeEventListener("storage", onStoreChange);
        window.removeEventListener(
          "roradar-saved-children-change",
          onStoreChange,
        );
      };
    },
    () => readSavedChildren(),
    () => [] as SavedChildProfile[],
  );

  return (
    <div className="shell flex flex-1 flex-col gap-6 py-8 sm:py-10">
      <Card className="rounded-[2rem] border border-white/10 bg-[#141518]">
        <CardHeader className="px-6 pt-6">
          <p className="text-xs tracking-[0.24em] text-white/42 uppercase">
            Dashboard
          </p>
          <CardTitle className="font-heading text-4xl text-white">
            Saved children for {viewerName}
          </CardTitle>
          <p className="max-w-2xl text-sm leading-7 text-white/58">
            Phase 0 keeps saved profiles in this browser so the flow is fully
            navigable before Supabase persistence is switched on.
          </p>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {children.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {children.map((child) => (
                <Link
                  key={child.id}
                  href={`/user/${encodeURIComponent(child.name)}`}
                  className="group rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 transition hover:opacity-74"
                >
                  <div className="flex items-center gap-4">
                    <Avatar size="lg" className="size-14">
                      <AvatarImage src={child.avatarUrl} alt={child.displayName} />
                      <AvatarFallback>{child.displayName.slice(0, 1)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-white">
                        {child.displayName}
                      </p>
                      <p className="truncate text-sm text-white/52">
                        @{child.name}
                      </p>
                    </div>
                    <ArrowRight className="size-4 text-white/42 transition group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-[1.6rem] border border-dashed border-white/12 bg-white/[0.02] px-6 py-12 text-center">
              <Ghost className="size-7 text-white/32" />
              <p className="mt-4 font-heading text-2xl text-white">
                No saved children yet
              </p>
              <p className="mt-2 max-w-xl text-sm leading-7 text-white/56">
                Search a Roblox account, open its report, and use Save as Child to
                pin it here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
