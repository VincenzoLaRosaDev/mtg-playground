export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type LockedBodyStyle = {
  position: string;
  top: string;
  left: string;
  right: string;
  width: string;
};

let bodyLockCount = 0;
let savedBodyStyle: LockedBodyStyle | null = null;
let savedScrollY = 0;

/**
 * While a sheet lock is active, drop the restore target to top.
 * Used on pathname navigations so unlock does not undo scroll-to-top
 * (e.g. View detail from CardDetailModal after the page was scrolled).
 */
export function clearBodyScrollRestore() {
  if (bodyLockCount === 0) return;
  savedScrollY = 0;
  if (document.body.style.position === "fixed") {
    document.body.style.top = "0";
  }
}

/**
 * Reference-counted `position: fixed` body scroll lock (base-ui's Dialog has
 * no built-in one — without this, background content still scrolls under an
 * open sheet on touch devices). Counted so nested sheets (e.g. card detail
 * opening VersionsBrowser) don't restore scroll early when the inner one closes.
 */
export function lockBodyScroll(): () => void {
  if (bodyLockCount === 0) {
    savedScrollY = window.scrollY;
    const { style } = document.body;
    savedBodyStyle = {
      position: style.position,
      top: style.top,
      left: style.left,
      right: style.right,
      width: style.width,
    };
    style.position = "fixed";
    style.top = `-${savedScrollY}px`;
    style.left = "0";
    style.right = "0";
    style.width = "100%";
  }
  bodyLockCount += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    bodyLockCount -= 1;
    if (bodyLockCount === 0 && savedBodyStyle) {
      const { style } = document.body;
      style.position = savedBodyStyle.position;
      style.top = savedBodyStyle.top;
      style.left = savedBodyStyle.left;
      style.right = savedBodyStyle.right;
      style.width = savedBodyStyle.width;
      window.scrollTo(0, savedScrollY);
      savedBodyStyle = null;
    }
  };
}

/** Scroll the window to the very top, respecting reduced-motion. */
export function scrollWindowToTop() {
  window.scrollTo({
    top: 0,
    behavior: prefersReducedMotion() ? "auto" : "smooth",
  });
}
