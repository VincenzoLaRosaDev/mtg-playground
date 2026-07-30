/**
 * Soft-nav top progress (EDHREC / NProgress-style).
 * Fake progress — App Router has no real byte progress for RSC flights.
 */

export type NavigationProgressState = {
  /** True after the anti-flash delay while a navigation is in flight. */
  visible: boolean;
  /** 0–100 */
  progress: number;
};

type Listener = () => void;

/** Hide the bar for navigations that finish faster than this. */
const SHOW_DELAY_MS = 100;
const TRICKLE_MS = 200;
const COMPLETE_HOLD_MS = 200;
const MAX_TRICKLE = 92;

let visible = false;
let progress = 0;
let active = false;
/** Route key (`pathname?search`) when start was called — for remount-safe done. */
let startedFromKey: string | null = null;
let showTimer: ReturnType<typeof setTimeout> | null = null;
let trickleTimer: ReturnType<typeof setInterval> | null = null;
let completeTimer: ReturnType<typeof setTimeout> | null = null;

/** Cached for useSyncExternalStore — must be referentially stable until values change. */
export const NAVIGATION_PROGRESS_IDLE: NavigationProgressState = {
  visible: false,
  progress: 0,
};
let snapshot: NavigationProgressState = NAVIGATION_PROGRESS_IDLE;
const listeners = new Set<Listener>();

export function routeKeyFromParts(pathname: string, search: string): string {
  const q = search.startsWith("?") ? search.slice(1) : search;
  return q ? `${pathname}?${q}` : pathname;
}

export function getLocationRouteKey(): string {
  return routeKeyFromParts(
    window.location.pathname,
    window.location.search,
  );
}

function emit() {
  if (snapshot.visible === visible && snapshot.progress === progress) {
    return;
  }
  snapshot =
    !visible && progress === 0
      ? NAVIGATION_PROGRESS_IDLE
      : { visible, progress };
  for (const listener of listeners) {
    listener();
  }
}

function clearShowTimer() {
  if (showTimer != null) {
    clearTimeout(showTimer);
    showTimer = null;
  }
}

function clearTrickle() {
  if (trickleTimer != null) {
    clearInterval(trickleTimer);
    trickleTimer = null;
  }
}

function clearCompleteTimer() {
  if (completeTimer != null) {
    clearTimeout(completeTimer);
    completeTimer = null;
  }
}

function resetIdle() {
  clearShowTimer();
  clearTrickle();
  clearCompleteTimer();
  active = false;
  visible = false;
  progress = 0;
  startedFromKey = null;
  emit();
}

function beginTrickle() {
  clearTrickle();
  trickleTimer = setInterval(() => {
    if (progress >= MAX_TRICKLE) return;
    const remaining = MAX_TRICKLE - progress;
    progress = Math.min(MAX_TRICKLE, progress + Math.max(0.4, remaining * 0.08));
    emit();
  }, TRICKLE_MS);
}

/** Start (or restart) the navigation progress indicator. */
export function startNavigationProgress() {
  clearCompleteTimer();
  if (typeof window !== "undefined") {
    startedFromKey = getLocationRouteKey();
  }
  if (active && visible) {
    return;
  }
  active = true;
  progress = Math.max(progress, 12);
  clearShowTimer();
  showTimer = setTimeout(() => {
    showTimer = null;
    if (!active) return;
    visible = true;
    emit();
    beginTrickle();
  }, SHOW_DELAY_MS);
  emit();
}

/** Complete and hide after a short hold at 100%. No-op if nothing was started. */
export function doneNavigationProgress() {
  if (!active && !visible) {
    clearShowTimer();
    return;
  }
  clearShowTimer();
  clearTrickle();
  active = false;
  startedFromKey = null;
  if (!visible) {
    // Finished before anti-flash delay — never show.
    resetIdle();
    return;
  }
  progress = 100;
  visible = true;
  emit();
  clearCompleteTimer();
  completeTimer = setTimeout(() => {
    completeTimer = null;
    resetIdle();
  }, COMPLETE_HOLD_MS);
}

/**
 * Finish if the URL left the page where start was clicked.
 * Safe on remount (module keeps `startedFromKey`).
 */
export function maybeCompleteNavigationProgressForRoute(routeKey: string) {
  if (startedFromKey != null && routeKey !== startedFromKey) {
    doneNavigationProgress();
  }
}

export function getNavigationProgressState(): NavigationProgressState {
  return snapshot;
}

export function subscribeNavigationProgress(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Put on `<Link>` / `<a>` that `preventDefault` to open an overlay instead of
 * navigating (tile → card modal, search hit → modal, signed-out auth gate).
 * Next.js Links also preventDefault for soft-nav — do **not** use that signal.
 */
export const NAV_PROGRESS_SKIP_ATTR = "data-nav-progress" as const;
export const NAV_PROGRESS_SKIP_VALUE = "skip" as const;

/** Whether a same-origin left-click on this anchor should start progress. */
export function shouldStartNavigationProgressForAnchor(
  anchor: HTMLAnchorElement,
  event: MouseEvent,
  current: { pathname: string; search: string },
): boolean {
  if (event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return false;
  }
  if (anchor.getAttribute(NAV_PROGRESS_SKIP_ATTR) === NAV_PROGRESS_SKIP_VALUE) {
    return false;
  }
  if (anchor.hasAttribute("download")) return false;
  const target = anchor.getAttribute("target");
  if (target && target !== "_self") return false;

  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("javascript:")) return false;

  let url: URL;
  try {
    url = new URL(href, window.location.href);
  } catch {
    return false;
  }
  if (url.origin !== window.location.origin) return false;

  // Hash-only / same path+search — no soft-nav wait.
  if (
    url.pathname === current.pathname &&
    url.search === current.search
  ) {
    return false;
  }

  return true;
}
