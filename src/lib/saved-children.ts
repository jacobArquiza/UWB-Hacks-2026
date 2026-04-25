import type { SavedChildProfile } from "@/lib/types";

const savedChildrenKey = "roradar.saved-children.phase0";

export function readSavedChildren() {
  if (typeof window === "undefined") {
    return [] as SavedChildProfile[];
  }

  try {
    const rawValue = window.localStorage.getItem(savedChildrenKey);

    if (!rawValue) {
      return [] as SavedChildProfile[];
    }

    return JSON.parse(rawValue) as SavedChildProfile[];
  } catch {
    return [] as SavedChildProfile[];
  }
}

export function writeSavedChildren(children: SavedChildProfile[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(savedChildrenKey, JSON.stringify(children));
  window.dispatchEvent(new Event("roradar-saved-children-change"));
}

export function upsertSavedChild(child: SavedChildProfile) {
  const existing = readSavedChildren();
  const deduped = existing.filter((entry) => entry.id !== child.id);
  const nextChildren = [child, ...deduped].sort(
    (left, right) =>
      new Date(right.savedAt).getTime() - new Date(left.savedAt).getTime(),
  );

  writeSavedChildren(nextChildren);

  return nextChildren;
}
