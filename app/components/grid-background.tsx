"use client";

import { useEffect } from "react";

export function GridBackground() {
  useEffect(() => {
    const root = document.documentElement;
    let frameId = 0;
    let pointerX = 0;
    let pointerY = 0;

    const flushPointer = () => {
      frameId = 0;
      root.style.setProperty("--landing-mouse-x", `${pointerX}px`);
      root.style.setProperty("--landing-mouse-y", `${pointerY}px`);
    };

    const updatePointer = (event: PointerEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;

      if (frameId !== 0) return;

      frameId = window.requestAnimationFrame(flushPointer);
    };

    window.addEventListener("pointermove", updatePointer, { passive: true });

    return () => {
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
      }

      window.removeEventListener("pointermove", updatePointer);
      root.style.removeProperty("--landing-mouse-x");
      root.style.removeProperty("--landing-mouse-y");
    };
  }, []);

  return <div aria-hidden="true" className="app-grid-background" />;
}
