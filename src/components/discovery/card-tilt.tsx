"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

const MAX_DEG = {
  detail: 10,
  grid: 6,
} as const;

/** Per-frame lerp toward target (lower = smoother / slower). */
const LERP = {
  detail: 0.08,
  grid: 0.12,
} as const;

const SETTLE_EPS = 0.0015;

type CardTiltProps = {
  children: ReactNode;
  intensity?: keyof typeof MAX_DEG;
  className?: string;
  enabled?: boolean;
};

type Vec2 = { x: number; y: number };

/**
 * CSS 3D perspective tilt driven by pointer (Archidekt-style).
 * Target angles lerp via rAF so edge enter/leave never snaps.
 * Sets `--pointer-x/y` (0–1) for foil glare. Skips touch + reduced-motion.
 */
export function CardTilt({
  children,
  intensity = "grid",
  className,
  enabled = true,
}: CardTiltProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef<Vec2>({ x: 0, y: 0 });
  const targetRef = useRef<Vec2>({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const hoveringRef = useRef(false);

  // Default true so SSR + first paint match; reduced-motion turns off after mount.
  const [allowMotion, setAllowMotion] = useState(true);
  const maxDeg = MAX_DEG[intensity];
  const lerp = LERP[intensity];
  const active = enabled && allowMotion;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setAllowMotion(!media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  function paint(nx: number, ny: number) {
    const card = cardRef.current;
    if (!card) return;

    const rotY = nx * maxDeg;
    const rotX = -ny * maxDeg;
    card.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(0.01px)`;
    card.style.setProperty("--pointer-x", String((nx + 1) / 2));
    card.style.setProperty("--pointer-y", String((ny + 1) / 2));
  }

  function tick() {
    const current = currentRef.current;
    const target = targetRef.current;

    current.x += (target.x - current.x) * lerp;
    current.y += (target.y - current.y) * lerp;

    const dx = Math.abs(target.x - current.x);
    const dy = Math.abs(target.y - current.y);

    if (dx < SETTLE_EPS && dy < SETTLE_EPS) {
      current.x = target.x;
      current.y = target.y;
      paint(current.x, current.y);
      rafRef.current = null;
      if (!hoveringRef.current) {
        frameRef.current?.removeAttribute("data-tilt-active");
      }
      return;
    }

    paint(current.x, current.y);
    rafRef.current = requestAnimationFrame(tick);
  }

  function ensureTick() {
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(tick);
    }
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!active || event.pointerType === "touch") return;
    const frame = frameRef.current;
    if (!frame) return;

    const rect = frame.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    // Soften edges so top/bottom entry is less extreme before lerp catches up.
    const rawX = Math.min(1, Math.max(-1, px * 2 - 1));
    const rawY = Math.min(1, Math.max(-1, py * 2 - 1));
    const ease = (v: number) => Math.sign(v) * Math.pow(Math.abs(v), 1.25);

    hoveringRef.current = true;
    frame.dataset.tiltActive = "";
    targetRef.current = { x: ease(rawX), y: ease(rawY) };
    ensureTick();
  }

  function handlePointerLeave() {
    if (!active) return;
    hoveringRef.current = false;
    targetRef.current = { x: 0, y: 0 };
    ensureTick();
  }

  return (
    <div
      ref={frameRef}
      className={cn(active && "card-tilt-frame", className)}
      onPointerMove={active ? handlePointerMove : undefined}
      onPointerLeave={active ? handlePointerLeave : undefined}
    >
      <div ref={cardRef} className={cn(active && "card-tilt-card")}>
        {children}
      </div>
    </div>
  );
}
