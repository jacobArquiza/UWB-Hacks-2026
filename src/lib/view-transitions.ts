type BrowserViewTransition = {
  finished: Promise<void>;
  ready: Promise<void>;
  updateCallbackDone: Promise<void>;
  skipTransition?: () => void;
};

type DocumentWithViewTransition = Document & {
  activeViewTransition?: BrowserViewTransition | null;
  startViewTransition?: (
    updateCallback?: () => void | Promise<void>,
  ) => BrowserViewTransition;
};

type PendingRouteTransition = {
  complete: () => void;
  timeoutId: number;
};

const ROUTE_VIEW_TRANSITION_TIMEOUT_MS = 900;
const PREFER_REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

let pendingRouteTransition: PendingRouteTransition | null = null;

function clearPendingTimers(pending: PendingRouteTransition) {
  window.clearTimeout(pending.timeoutId);
}

function canStartRouteViewTransition() {
  if (typeof window === "undefined") {
    return false;
  }

  const root = document.documentElement;
  const documentWithTransition = document as DocumentWithViewTransition;

  if (root.dataset.motion === "reduced") {
    return false;
  }

  if (window.matchMedia(PREFER_REDUCED_MOTION_QUERY).matches) {
    return false;
  }

  if (document.visibilityState === "hidden") {
    return false;
  }

  return typeof documentWithTransition.startViewTransition === "function";
}

export function cancelPendingRouteViewTransition() {
  pendingRouteTransition?.complete();
}

export function completePendingRouteViewTransition() {
  pendingRouteTransition?.complete();
}

export function startRouteViewTransition(navigate: () => void) {
  if (!canStartRouteViewTransition()) {
    navigate();
    return;
  }

  const documentWithTransition = document as DocumentWithViewTransition;

  cancelPendingRouteViewTransition();

  let settled = false;
  let resolveUpdate: (() => void) | null = null;

  const complete = () => {
    if (settled) {
      return;
    }

    settled = true;

    if (pendingRouteTransition?.complete === complete) {
      clearPendingTimers(pendingRouteTransition);
      pendingRouteTransition = null;
    }

    resolveUpdate?.();
    resolveUpdate = null;
  };

  const updateDone = new Promise<void>((resolve) => {
    resolveUpdate = resolve;
  });

  pendingRouteTransition = {
    complete,
    timeoutId: window.setTimeout(
      complete,
      ROUTE_VIEW_TRANSITION_TIMEOUT_MS,
    ),
  };

  try {
    documentWithTransition.activeViewTransition?.skipTransition?.();
    documentWithTransition.startViewTransition?.(() => {
      navigate();
      return updateDone;
    });
  } catch {
    complete();
    navigate();
  }
}
