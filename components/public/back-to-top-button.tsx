"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

type BackToTopButtonProps = {
  className?: string;
  threshold?: number;
};

const BUTTON_SIZE = 48;
const STROKE_WIDTH = 4;
const RADIUS = 20;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function clampProgress(value: number) {
  return Math.min(1, Math.max(0, value));
}

export default function BackToTopButton({
  className,
  threshold = 240,
}: BackToTopButtonProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frameId = 0;

    const updateScrollState = () => {
      const scrollTop = window.scrollY;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = clampProgress(scrollable > 0 ? scrollTop / scrollable : 0);

      setScrollProgress(progress);
      setVisible(scrollTop > threshold || progress > 0.08);
      frameId = 0;
    };

    const requestUpdate = () => {
      if (frameId !== 0) {
        return;
      }

      frameId = window.requestAnimationFrame(updateScrollState);
    };

    requestUpdate();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [threshold]);

  const handleClick = () => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  return (
  <button
    type="button"
    aria-label="Back to top"
    onClick={handleClick}
    className={cn(
      "fixed bottom-5 right-5 z-50 grid size-12 place-items-center rounded-full transition-all duration-200 sm:bottom-6 sm:right-6",
      visible
        ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
        : "pointer-events-none translate-y-2 scale-95 opacity-0",
      className,
    )}
  >
    <svg
      aria-hidden="true"
      width={BUTTON_SIZE}
      height={BUTTON_SIZE}
      viewBox={`0 0 ${BUTTON_SIZE} ${BUTTON_SIZE}`}
      className="absolute inset-0 size-full -rotate-90"
    >
      <circle
        cx={BUTTON_SIZE / 2}
        cy={BUTTON_SIZE / 2}
        r={RADIUS}
        fill="none"
        strokeWidth={STROKE_WIDTH}
        className="stroke-border/60"
      />
      <circle
        cx={BUTTON_SIZE / 2}
        cy={BUTTON_SIZE / 2}
        r={RADIUS}
        fill="none"
        strokeWidth={STROKE_WIDTH}
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={CIRCUMFERENCE * (1 - scrollProgress)}
        strokeLinecap="round"
        className="stroke-primary transition-[stroke-dashoffset] duration-150 ease-out"
      />
    </svg>

    <span className="relative z-10 flex size-9 items-center justify-center rounded-full border border-border bg-background/85 text-foreground shadow-lg backdrop-blur transition-colors hover:bg-muted/85">
      <ArrowUp className="size-4" />
    </span>
  </button>
  );
}
