import type { SavedChildProfile } from "@/lib/types";

const savedChildrenKey = "roradar.saved-children";
const savedChildrenKeyPrefix = `${savedChildrenKey}.`;
const emptySavedChildren = [] as SavedChildProfile[];

let cachedRawValue: string | null = null;
let cachedChildren: SavedChildProfile[] = emptySavedChildren;

function findLegacySavedChildrenKey() {
  if (typeof window === "undefined") {
    return null;
  }

  return Object.keys(window.localStorage).find(
    (key) => key.startsWith(savedChildrenKeyPrefix) && key !== savedChildrenKey,
  );
}

export function readSavedChildren() {
  if (typeof window === "undefined") {
    return emptySavedChildren;
  }

  try {
    const rawValue =
      window.localStorage.getItem(savedChildrenKey) ??
      (() => {
        const legacyKey = findLegacySavedChildrenKey();
        return legacyKey ? window.localStorage.getItem(legacyKey) : null;
      })();

    if (!rawValue) {
      cachedRawValue = null;
      cachedChildren = emptySavedChildren;

      return cachedChildren;
    }

    if (rawValue === cachedRawValue) {
      return cachedChildren;
    }

    cachedRawValue = rawValue;
    cachedChildren = JSON.parse(rawValue) as SavedChildProfile[];

    return cachedChildren;
  } catch {
    cachedRawValue = null;
    cachedChildren = emptySavedChildren;

    return cachedChildren;
  }
}

export function writeSavedChildren(children: SavedChildProfile[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(savedChildrenKey, JSON.stringify(children));
  const legacyKey = findLegacySavedChildrenKey();
  if (legacyKey) {
    window.localStorage.removeItem(legacyKey);
  }
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

export function removeSavedChild(childId: number) {
  const nextChildren = readSavedChildren().filter((entry) => entry.id !== childId);

  writeSavedChildren(nextChildren);

  return nextChildren;
}
