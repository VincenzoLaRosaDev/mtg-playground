"use client";

import { ChevronDown, SlidersHorizontal } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { ListFilterDrawerContext } from "@/components/layout/list-filter-drawer-context";
import {
  SITE_HEADER_CHROME_SLOT_ID,
  SITE_HEADER_HEIGHT_VAR,
  SITE_HEADER_NAV_ID,
  SITE_MAX_WIDTH_CLASS,
  SITE_GUTTER_CLASS,
  siteContainerClassName,
} from "@/lib/ui/layout";
import { prefersReducedMotion } from "@/lib/ui/scroll";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

const CHROME_ANIM_MS = 200;
/** Matches `h-8` on the Filters tongue — closed clip height. */
const TONGUE_HEIGHT_PX = 32;
/**
 * Shared open/close curve. Motion is `transform` (not `height`) so iOS Safari
 * actually animates; drawer + tongue stay one translated block.
 */
const PANEL_EASE = "cubic-bezier(0.4, 0, 0.2, 1)";
/** Bottom corners only — rem literal so iOS does not depend on var() on the button. */
const TONGUE_RADIUS = "0px 0px 0.625rem 0.625rem";
/** Cover the drawer bottom hairline where the tongue tucks in (open only). */
const TONGUE_DRAWER_SEAM_COVER = "0 -1px 0 0 var(--background)";

type ListFilterAccessProps = {
  children: ReactNode;
  /** Show a dot on the sticky tab when filters are non-default. */
  hasActiveFilters?: boolean;
  label?: string;
  /**
   * Extra trigger(s) shown next to the Filters tongue once it's sticky (e.g.
   * Collection's "Add cards") — right-aligned, same row, same show/hide
   * timing. Not shown at the drawer-bottom copy of the tongue (the open
   * drawer already re-renders `children`, which includes these).
   * With `showFilterTongue={false}`, these alone form the sticky chrome.
   */
  stickyActions?: ReactNode;
  /**
   * When false, no Filters tongue/drawer — only `stickyActions` portal under
   * the header when children scroll away (deck editor Add cards).
   */
  showFilterTongue?: boolean;
  /**
   * Opaque string that changes whenever the wrapped filters change (e.g. a
   * serialized filter/sort state). When it changes while the toolbar is
   * scrolled away (sticky drawer active), scrolls the list back to its own
   * top (not the page top — the drawer stays open so filters stay reachable
   * for further tweaks) so the user sees the new results from the start.
   */
  filtersKey?: string;
};

/** Coalesces rapid filter changes (e.g. keystrokes) into one scroll. */
const FILTERS_SCROLL_DEBOUNCE_MS = 250;

function headerOffsetPx() {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(SITE_HEADER_HEIGHT_VAR)
    .trim();
  if (raw.endsWith("px")) {
    return Number.parseFloat(raw) || 72;
  }
  if (raw.endsWith("rem")) {
    const rem = Number.parseFloat(raw) || 4.5;
    const root = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
    return rem * (Number.isFinite(root) ? root : 16);
  }
  return Number.parseFloat(raw) || 72;
}

/**
 * Dual filter chrome: full toolbar inline at the top; when it has fully scrolled
 * past the sticky nav, a Filters tongue (+ optional drawer) portals into the
 * header chrome slot as absolute children (sticky height stays nav-only).
 * Open drawer is modal-like: body scroll lock + sheet-style scrim (no click-through).
 * Drawer + tongue slide as one `translate3d` block (height clip is instant —
 * iOS often skips `height` transitions).
 */
export function ListFilterAccess({
  children,
  hasActiveFilters = false,
  label = "Filters",
  filtersKey,
  stickyActions,
  showFilterTongue = true,
}: ListFilterAccessProps) {
  const inlineShellRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [filtersAway, setFiltersAway] = useState(false);
  const [scrollReady, setScrollReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [placeholderHeight, setPlaceholderHeight] = useState(0);
  const [chromeSlot, setChromeSlot] = useState<HTMLElement | null>(null);
  const [chromeMounted, setChromeMounted] = useState(false);
  const [chromeShown, setChromeShown] = useState(false);
  const [drawerMounted, setDrawerMounted] = useState(false);
  const [drawerShown, setDrawerShown] = useState(false);
  /** When false, transform jumps with no transition (setup frame before open). */
  const [slideMotionOn, setSlideMotionOn] = useState(false);
  const [panelHeight, setPanelHeight] = useState(TONGUE_HEIGHT_PX);
  /** Bumps on each open so stale rAF open sequences are ignored. */
  const openGenRef = useRef(0);

  const stickyRef = useRef(false);
  useEffect(() => {
    stickyRef.current = scrollReady && filtersAway;
  }, [scrollReady, filtersAway]);

  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  /**
   * Scroll position the body-scroll-lock effect below restores on close.
   * Set to the real `window.scrollY` when the drawer opens; the filter-change
   * effect below may move it forward (list start) while still locked so the
   * eventual close lands there instead of back where the drawer was opened.
   */
  const scrollRestoreRef = useRef(0);

  /** Moves the list to its own top, keeping the sticky drawer open/reachable. */
  const scrollToListStart = useCallback(() => {
    const node = inlineShellRef.current;
    if (!node) return;

    const currentY = openRef.current ? scrollRestoreRef.current : window.scrollY;
    const target = Math.max(0, currentY + node.getBoundingClientRect().bottom - headerOffsetPx());

    if (openRef.current) {
      // Locked (position: fixed) — nothing is visibly scrolling; just move
      // where the background will land once the drawer closes.
      scrollRestoreRef.current = target;
      document.body.style.top = `-${target}px`;
      return;
    }

    window.scrollTo({ top: target, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, []);

  const filtersKeyRef = useRef(filtersKey);
  useEffect(() => {
    if (filtersKeyRef.current === filtersKey) return;
    filtersKeyRef.current = filtersKey;
    if (!stickyRef.current) return;

    const timeout = window.setTimeout(scrollToListStart, FILTERS_SCROLL_DEBOUNCE_MS);
    return () => window.clearTimeout(timeout);
  }, [filtersKey, scrollToListStart]);

  const measureInline = useCallback(() => {
    const node = inlineShellRef.current;
    if (!node || open) return;
    setPlaceholderHeight(node.getBoundingClientRect().height);
  }, [open]);

  const measurePanel = useCallback(() => {
    const node = panelRef.current;
    if (!node) return;
    // Prefer scrollHeight — getBoundingClientRect can under-report while clipped.
    const next = Math.max(
      TONGUE_HEIGHT_PX,
      Math.ceil(Math.max(node.scrollHeight, node.getBoundingClientRect().height)),
    );
    setPanelHeight((prev) => (prev === next ? prev : next));
  }, []);

  const updateFiltersAway = useCallback(() => {
    const node = inlineShellRef.current;
    if (!node) return;
    const away = node.getBoundingClientRect().bottom <= headerOffsetPx();
    setFiltersAway((prev) => {
      if (prev === away) return prev;
      return away;
    });
    if (!away) {
      setOpen(false);
    }
    setScrollReady(true);
  }, []);

  useLayoutEffect(() => {
    measureInline();
  }, [measureInline, children]);

  useLayoutEffect(() => {
    if (!drawerMounted) return;
    measurePanel();
  }, [drawerMounted, measurePanel, children]);

  useEffect(() => {
    queueMicrotask(() => {
      setChromeSlot(document.getElementById(SITE_HEADER_CHROME_SLOT_ID));
    });
  }, []);

  useEffect(() => {
    const node = inlineShellRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      measureInline();
      updateFiltersAway();
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [measureInline, updateFiltersAway]);

  useEffect(() => {
    if (!drawerMounted || typeof ResizeObserver === "undefined") return;
    const node = panelRef.current;
    if (!node) return;
    const observer = new ResizeObserver(() => measurePanel());
    observer.observe(node);
    return () => observer.disconnect();
  }, [drawerMounted, measurePanel]);

  useEffect(() => {
    updateFiltersAway();
    window.addEventListener("scroll", updateFiltersAway, { passive: true });
    window.addEventListener("resize", updateFiltersAway);

    const nav = document.getElementById(SITE_HEADER_NAV_ID);
    let navObserver: ResizeObserver | null = null;
    if (nav && typeof ResizeObserver !== "undefined") {
      navObserver = new ResizeObserver(() => updateFiltersAway());
      navObserver.observe(nav);
    }

    return () => {
      window.removeEventListener("scroll", updateFiltersAway);
      window.removeEventListener("resize", updateFiltersAway);
      navObserver?.disconnect();
    };
  }, [updateFiltersAway]);

  useEffect(() => {
    const show = scrollReady && filtersAway;
    let cleanup: (() => void) | undefined;

    // Outer rAF only defers the *first* state write out of the effect's
    // synchronous body (react-hooks/set-state-in-effect) — same-frame
    // relative timing between the calls below is unchanged.
    const setupId = requestAnimationFrame(() => {
      if (show) {
        setChromeMounted(true);
        if (prefersReducedMotion()) {
          setChromeShown(true);
          return;
        }
        const id = requestAnimationFrame(() => {
          requestAnimationFrame(() => setChromeShown(true));
        });
        cleanup = () => cancelAnimationFrame(id);
        return;
      }

      setChromeShown(false);
      setOpen(false);
      if (prefersReducedMotion()) {
        setChromeMounted(false);
        return;
      }
      const timeout = window.setTimeout(() => setChromeMounted(false), CHROME_ANIM_MS);
      cleanup = () => window.clearTimeout(timeout);
    });

    return () => {
      cancelAnimationFrame(setupId);
      cleanup?.();
    };
  }, [filtersAway, scrollReady]);

  // Mount / unmount drawer. Do not start the open slide here — wait until measured.
  useEffect(() => {
    // Sticky-actions-only mode (no Filters tongue): never mount the drawer.
    if (!showFilterTongue) return;

    // Bump synchronously (not deferred below) so the open-slide effect's
    // `gen` capture always sees this cycle, invalidating any stale in-flight
    // rAF chain from a previous rapid toggle.
    if (open) {
      openGenRef.current += 1;
    }

    let cleanup: (() => void) | undefined;
    const setupId = requestAnimationFrame(() => {
      if (open) {
        setDrawerMounted(true);
        setSlideMotionOn(false);
        setDrawerShown(false);
        if (prefersReducedMotion()) {
          setDrawerShown(true);
        }
        return;
      }

      setDrawerShown(false);
      if (prefersReducedMotion()) {
        setDrawerMounted(false);
        setSlideMotionOn(false);
        return;
      }
      const timeout = window.setTimeout(() => {
        setDrawerMounted(false);
        setSlideMotionOn(false);
      }, CHROME_ANIM_MS);
      cleanup = () => window.clearTimeout(timeout);
    });

    return () => {
      cancelAnimationFrame(setupId);
      cleanup?.();
    };
  }, [open, showFilterTongue]);

  // Open slide: only after panel height is known (otherwise offset is 0 → desktop snap).
  useEffect(() => {
    if (!open || !drawerMounted || drawerShown) return;
    if (prefersReducedMotion()) return;
    if (panelHeight <= TONGUE_HEIGHT_PX) return;

    // Capture synchronously — this cycle's identity for the staleness checks below.
    const gen = openGenRef.current;
    let cleanup: (() => void) | undefined;
    const setupId = requestAnimationFrame(() => {
      setSlideMotionOn(false);
      const id = requestAnimationFrame(() => {
        if (gen !== openGenRef.current) return;
        setSlideMotionOn(true);
        requestAnimationFrame(() => {
          if (gen !== openGenRef.current) return;
          setDrawerShown(true);
        });
      });
      cleanup = () => cancelAnimationFrame(id);
    });
    return () => {
      cancelAnimationFrame(setupId);
      cleanup?.();
    };
  }, [open, drawerMounted, drawerShown, panelHeight]);

  useEffect(() => {
    if (!open) return;
    scrollRestoreRef.current = window.scrollY;
    const { style } = document.body;
    const previous = {
      position: style.position,
      top: style.top,
      left: style.left,
      right: style.right,
      width: style.width,
    };
    style.position = "fixed";
    style.top = `-${scrollRestoreRef.current}px`;
    style.left = "0";
    style.right = "0";
    style.width = "100%";
    return () => {
      style.position = previous.position;
      style.top = previous.top;
      style.left = previous.left;
      style.right = previous.right;
      style.width = previous.width;
      window.scrollTo(0, scrollRestoreRef.current);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function handleToggle() {
    if (!open) {
      const node = inlineShellRef.current;
      if (node) {
        setPlaceholderHeight(node.getBoundingClientRect().height);
      }
    }
    setOpen((current) => !current);
  }

  function handleOverlayDismiss() {
    setOpen(false);
  }

  const toolbarInDrawer = drawerMounted && chromeMounted;
  // Closed-but-mounted: park the panel so only the tongue sits in the clip top.
  const slideOffsetPx =
    drawerMounted && !drawerShown
      ? Math.max(0, panelHeight - TONGUE_HEIGHT_PX)
      : 0;
  // Seam cover only while attached to the open drawer — never over the header border.
  const tongueCoversDrawerSeam = drawerMounted;

  const tongue = (
    <Button
      type="button"
      aria-expanded={open}
      aria-controls="list-filter-drawer"
      style={{
        borderRadius: TONGUE_RADIUS,
        // Reset UA <button> borders (they were painting a top hairline on iOS).
        borderStyle: "solid",
        borderTopWidth: 0,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: "var(--border)",
        boxShadow: tongueCoversDrawerSeam ? TONGUE_DRAWER_SEAM_COVER : undefined,
      }}
      className={cn(
        "pt-1 relative z-10 inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 overflow-hidden px-3 text-sm font-medium text-foreground",
        "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        // Open: solid bg idle; hover = muted→background bottom→top. Closed: solid hover.
        tongueCoversDrawerSeam
          ? "bg-background hover:bg-gradient-to-t hover:from-muted hover:to-background"
          : "bg-background hover:bg-muted",
        !chromeShown && "pointer-events-none",
      )}
      onClick={handleToggle}
    >
      <SlidersHorizontal className="relative z-10 size-3.5 shrink-0" aria-hidden />
      <span className="relative z-10">{label}</span>
      {hasActiveFilters ? (
        <span
          className="relative z-10 size-1.5 shrink-0 rounded-full bg-primary"
          aria-label="Filters active"
        />
      ) : null}
      <ChevronDown
        className={cn(
          "relative z-10 size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none",
          open && "rotate-180",
        )}
        style={{ transitionTimingFunction: PANEL_EASE }}
        aria-hidden
      />
    </Button>
  );

  const tongueRow = (
    <div
      className={cn(
        "mx-auto flex w-full justify-start",
        tongueCoversDrawerSeam && "-mt-px",
        SITE_MAX_WIDTH_CLASS,
        SITE_GUTTER_CLASS,
      )}
    >
      {tongue}
    </div>
  );

  // Closed only — open drawer already re-renders `children` (stickyActions'
  // full-size counterpart included), so it skips this row to avoid a duplicate.
  // A little top padding detaches it from the header's bottom edge — the
  // plain tongueRow (no stickyActions) sits flush, which is fine on its own.
  const closedTongueRow = !showFilterTongue ? (
    stickyActions ? (
      <div
        className={cn(
          "mx-auto flex w-full items-end justify-start gap-2 pt-1",
          SITE_MAX_WIDTH_CLASS,
          SITE_GUTTER_CLASS,
        )}
      >
        <div className={cn(!chromeShown && "pointer-events-none")}>
          {stickyActions}
        </div>
      </div>
    ) : null
  ) : stickyActions ? (
    <div
      className={cn(
        "mx-auto flex w-full items-end gap-2",
        SITE_MAX_WIDTH_CLASS,
        SITE_GUTTER_CLASS,
      )}
    >
      {tongue}
      <div className={cn(!chromeShown && "pointer-events-none")}>{stickyActions}</div>
    </div>
  ) : (
    tongueRow
  );

  // Sheet-like scrim: below sticky header (z-40), above page + BackToTop (z-30).
  // Captures outside taps so dismiss never click-throughs to cards.
  const overlay =
    drawerMounted && typeof document !== "undefined"
      ? createPortal(
          <div
            role="presentation"
            aria-hidden
            className={cn(
              "fixed inset-0 z-35 bg-black/10 transition-opacity duration-200 motion-reduce:transition-none supports-backdrop-filter:backdrop-blur-xs",
              drawerShown ? "opacity-100" : "opacity-0 pointer-events-none",
            )}
            style={{ transitionTimingFunction: PANEL_EASE }}
            onClick={handleOverlayDismiss}
          />,
          document.body,
        )
      : null;

  const chrome =
    chromeMounted && chromeSlot
      ? createPortal(
          <div
            className={cn(
              "absolute top-0 left-0 z-30 w-full transition-opacity duration-200 motion-reduce:transition-none",
              chromeShown ? "opacity-100" : "opacity-0",
            )}
            style={{ transitionTimingFunction: PANEL_EASE }}
          >
            {/*
              Closed: tongue only (no full-width clip — that painted an opaque band).
              Open/animating: clip + translate3d on drawer+tongue as one block.
            */}
            {drawerMounted ? (
              <div
                className="relative w-full overflow-hidden bg-transparent"
                style={{ height: panelHeight }}
              >
                <div
                  ref={panelRef}
                  className={cn(
                    "w-full bg-transparent",
                    slideMotionOn &&
                      "transition-transform duration-200 motion-reduce:transition-none",
                  )}
                  style={{
                    transform: `translate3d(0, ${-slideOffsetPx}px, 0)`,
                    transitionTimingFunction: PANEL_EASE,
                  }}
                >
                  <div
                    id="list-filter-drawer"
                    role="region"
                    aria-label={label}
                    aria-hidden={!open || undefined}
                    className="max-h-[min(70dvh,32rem)] w-full overflow-y-auto overscroll-contain border-b border-border bg-background"
                  >
                    <div className={cn(siteContainerClassName, "py-3")}>
                      <ListFilterDrawerContext.Provider value={true}>
                        {toolbarInDrawer ? children : null}
                      </ListFilterDrawerContext.Provider>
                    </div>
                  </div>

                  {tongueRow}
                </div>
              </div>
            ) : (
              closedTongueRow
            )}
          </div>,
          chromeSlot,
        )
      : null;

  return (
    <>
      <div className="relative">
        <div
          ref={inlineShellRef}
          className={cn(toolbarInDrawer && "invisible")}
          style={
            toolbarInDrawer && placeholderHeight > 0
              ? { height: placeholderHeight }
              : undefined
          }
          aria-hidden={toolbarInDrawer || undefined}
        >
          {!toolbarInDrawer ? children : null}
        </div>
      </div>

      {overlay}
      {chrome}
    </>
  );
}
