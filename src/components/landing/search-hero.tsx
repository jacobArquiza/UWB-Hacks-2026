"use client";

import { useDeferredValue, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";

import { Input } from "@/components/ui/input";

export function SearchHero() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [isPending, startTransition] = useTransition();
  const deferredUsername = useDeferredValue(username.trim());

  function submitSearch(nextUsername = deferredUsername) {
    if (!nextUsername) {
      return;
    }

    startTransition(() => {
      router.push(`/user/${encodeURIComponent(nextUsername)}`);
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-[70rem] flex-col items-center">
      <div
        className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-700 motion-safe:ease-out flex w-full max-w-[63rem] flex-col items-start text-left"
        style={{ animationDelay: "40ms", animationFillMode: "both" }}
      >
        <p className="text-[0.7rem] font-medium tracking-[0.34em] text-primary uppercase">
          RoRadar
        </p>
        <h1 className="mt-6 font-heading text-[2rem] leading-[1.04] font-semibold tracking-[-0.05em] text-foreground sm:text-[2.45rem] lg:text-[2.9rem]">
          Search a Roblox username
          <span className="mt-2 block text-foreground/92">
            for a safety snapshot
          </span>
        </h1>
      </div>

      <form
        className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:slide-in-from-bottom-3 motion-safe:duration-700 motion-safe:ease-out mt-14 w-full max-w-[63rem] sm:mt-16"
        style={{ animationDelay: "150ms", animationFillMode: "both" }}
        onSubmit={(event) => {
          event.preventDefault();
          submitSearch();
        }}
      >
        <label htmlFor="roblox-username" className="sr-only">
          Roblox username
        </label>
        <div className="group relative flex items-center gap-3 rounded-[1.7rem] border border-border bg-card/88 p-2 shadow-[0_28px_90px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-300 ease-out hover:border-foreground/[0.14] hover:shadow-[0_32px_95px_rgba(0,0,0,0.2)] focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/12">
          <div className="flex min-w-0 flex-1 items-center gap-3 px-3 sm:px-4">
            <Search className="size-5 shrink-0 text-muted-foreground" />
            <Input
              id="roblox-username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Search Roblox username"
              className="h-12 border-0 bg-transparent px-0 text-base text-foreground shadow-none placeholder:text-muted-foreground/70 focus-visible:ring-0 sm:h-14 sm:text-[1.02rem]"
            />
          </div>
          <button
            type="submit"
            className="inline-flex h-12 min-w-[7.25rem] items-center justify-center gap-2 rounded-[1.1rem] bg-primary px-5 text-[0.95rem] font-medium text-primary-foreground shadow-[0_14px_30px_rgba(40,80,255,0.18)] transition-all duration-300 ease-out hover:scale-[1.01] hover:bg-primary/92 disabled:cursor-not-allowed disabled:opacity-45 sm:h-14 sm:min-w-[8.25rem]"
            disabled={!deferredUsername || isPending}
          >
            <span>Search</span>
            <ArrowRight className="size-4" />
          </button>
        </div>
      </form>

      <div
        className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-700 motion-safe:ease-out flex flex-wrap items-center justify-center gap-4 pt-6 text-xs text-muted-foreground sm:gap-8 sm:text-sm"
        style={{ animationDelay: "260ms", animationFillMode: "both" }}
      >
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>Audit Friends List</span>
        </div>
        <div className="hidden h-4 w-px bg-border sm:block" />
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>Evaluate Game Safety</span>
        </div>
        <div className="hidden h-4 w-px bg-border sm:block" />
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>Get Safety Reports</span>
        </div>
      </div>
    </div>
  );
}
