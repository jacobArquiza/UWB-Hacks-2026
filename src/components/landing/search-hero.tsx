"use client";

import { useDeferredValue, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SearchHero() {
  const router = useRouter();
  const [username, setUsername] = useState("KingRobloxsian20");
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
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center text-center">
      <div className="mb-6 inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs tracking-[0.24em] text-white/60 uppercase">
        Parent-readable Roblox safety previews
      </div>
      <h1 className="max-w-3xl font-heading text-5xl leading-[0.94] font-semibold tracking-[-0.06em] text-white sm:text-6xl md:text-7xl">
        Search one username.
        <span className="block text-white/48">See the signal parents never get.</span>
      </h1>
      <p className="mt-5 max-w-2xl text-base leading-7 text-white/64 sm:text-lg">
        RoRadar turns live Roblox profile data, seeded risk previews, and
        parent-facing language into an instant safety snapshot.
      </p>

      <form
        className="mt-10 w-full max-w-3xl"
        onSubmit={(event) => {
          event.preventDefault();
          submitSearch();
        }}
      >
        <label htmlFor="roblox-username" className="sr-only">
          Roblox username
        </label>
        <div className="group relative flex items-center rounded-[2rem] border border-white/12 bg-white/[0.04] p-2 shadow-[0_24px_80px_rgba(0,0,0,0.26)] transition-colors focus-within:border-white/22 hover:border-white/18">
          <div className="pointer-events-none ml-3 flex size-10 items-center justify-center rounded-full bg-white/[0.06] text-white/70">
            <Search className="size-4" />
          </div>
          <Input
            id="roblox-username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Enter a Roblox username"
            className="h-14 border-0 bg-transparent px-4 text-base text-white shadow-none ring-0 placeholder:text-white/36 focus-visible:border-0 focus-visible:ring-0 md:text-base"
          />
          <Button
            type="submit"
            size="lg"
            className="mr-1 h-12 rounded-[1.2rem] bg-white px-5 text-black hover:bg-white/88"
            disabled={!deferredUsername || isPending}
          >
            {isPending ? "Loading" : "Assess"}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm text-white/46">
        <span>Phase 0 is seeded for</span>
        <button
          type="button"
          onClick={() => {
            setUsername("KingRobloxsian20");
            submitSearch("KingRobloxsian20");
          }}
          className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-white/76 transition hover:bg-white/[0.07]"
        >
          KingRobloxsian20
        </button>
      </div>
    </div>
  );
}
