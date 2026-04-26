"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { ArrowRight, Ghost, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { readSavedChildren, removeSavedChild } from "@/lib/saved-children";
import type { SavedChildProfile } from "@/lib/types";

const noopUnsubscribe = () => undefined;

type SavedChildrenGridProps = {
  viewerName: string;
  initialChildren: SavedChildProfile[];
  storageMode: "local" | "supabase";
};

export function SavedChildrenGrid({
  viewerName,
  initialChildren,
  storageMode,
}: SavedChildrenGridProps) {
  const storedChildren = useSyncExternalStore(
    (onStoreChange) =>
      storageMode === "local"
        ? (() => {
            window.addEventListener("storage", onStoreChange);
            window.addEventListener("roradar-saved-children-change", onStoreChange);

            return () => {
              window.removeEventListener("storage", onStoreChange);
              window.removeEventListener(
                "roradar-saved-children-change",
                onStoreChange,
              );
            };
          })()
        : noopUnsubscribe,
    () => (storageMode === "local" ? readSavedChildren() : initialChildren),
    () => initialChildren,
  );
  const [remoteChildren, setRemoteChildren] = useState(initialChildren);
  const [deletingChildId, setDeletingChildId] = useState<number | null>(null);

  const children = storageMode === "local" ? storedChildren : remoteChildren;
  const description =
    storageMode === "supabase"
      ? "Saved profiles are synced to your account and follow you across devices."
      : "Supabase persistence is not configured yet, so this dashboard is still reading from this browser only.";

  async function handleDelete(child: SavedChildProfile) {
    setDeletingChildId(child.id);

    try {
      if (storageMode === "local") {
        removeSavedChild(child.id);
        toast.success("Removed from this browser's saved children.");
        return;
      }

      const response = await fetch(`/api/saved-children/${child.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;

        throw new Error(payload?.error ?? "Could not remove saved child.");
      }

      setRemoteChildren((existing) =>
        existing.filter((entry) => entry.id !== child.id),
      );
      toast.success("Removed from your saved children.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Delete failed unexpectedly.",
      );
    } finally {
      setDeletingChildId(null);
    }
  }

  return (
    <div className="shell flex flex-1 flex-col gap-6 py-8 sm:py-10">
      <Card className="rounded-[2rem] border border-border bg-card">
        <CardHeader className="px-6 pt-6">
          <p className="text-xs tracking-[0.24em] text-muted-foreground uppercase">
            Dashboard
          </p>
          <CardTitle className="font-heading text-4xl text-foreground">
            Saved children for {viewerName}
          </CardTitle>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
            {description}
          </p>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {children.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {children.map((child) => (
                <div
                  key={child.id}
                  className="flex items-center gap-4 rounded-[1.5rem] border border-border bg-foreground/[0.03] p-4 transition hover:opacity-92"
                >
                  <Avatar size="lg" className="size-14">
                    <AvatarImage src={child.avatarUrl} alt={child.displayName} />
                    <AvatarFallback>{child.displayName.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">
                      {child.displayName}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      @{child.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/user/${encodeURIComponent(child.name)}`}
                      aria-label={`Open ${child.displayName}`}
                      className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-background/70 text-muted-foreground transition hover:bg-foreground/[0.06] hover:text-foreground"
                    >
                      <ArrowRight className="size-4" />
                    </Link>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${child.displayName}`}
                      disabled={deletingChildId === child.id}
                      onClick={() => handleDelete(child)}
                      className="size-9 rounded-full text-destructive hover:bg-destructive/12 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-[1.6rem] border border-dashed border-border bg-foreground/[0.02] px-6 py-12 text-center">
              <Ghost className="size-7 text-muted-foreground" />
              <p className="mt-4 font-heading text-2xl text-foreground">
                No saved children yet
              </p>
              <p className="mt-2 max-w-xl text-sm leading-7 text-muted-foreground">
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
