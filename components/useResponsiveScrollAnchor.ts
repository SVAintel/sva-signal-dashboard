"use client";

import { RefObject, useLayoutEffect } from "react";

export function useResponsiveScrollAnchor(ref: RefObject<HTMLElement>, selector: string) {
  useLayoutEffect(() => {
    const container = ref.current;
    if (!container) return;
    let width = container.clientWidth;
    let anchor: { element: HTMLElement; offset: number; fraction: number } | null = null;
    const capture = () => {
      if (!container.clientWidth || container.clientWidth !== width) return;
      const top = container.getBoundingClientRect().top;
      const element = Array.from(container.querySelectorAll<HTMLElement>(selector))
        .find(item => item.getBoundingClientRect().bottom > top + 1);
      const bounds = element?.getBoundingClientRect();
      anchor = element && bounds ? { element, offset: Math.max(0, bounds.top - top),
        fraction: bounds.height > 0 ? Math.min(1, Math.max(0, (top - bounds.top) / bounds.height)) : 0 } : null;
    };
    const observer = new ResizeObserver(() => {
      const nextWidth = container.clientWidth;
      if (!nextWidth) return;
      if (nextWidth !== width && anchor?.element.isConnected && container.contains(anchor.element)) {
        const bounds = anchor.element.getBoundingClientRect();
        // Preserve the reading position inside a row even when its title reflows.
        container.scrollTop += bounds.top - container.getBoundingClientRect().top -
          anchor.offset + bounds.height * anchor.fraction;
      }
      width = nextWidth;
      capture();
    });
    capture();
    container.addEventListener("scroll", capture, { passive: true });
    observer.observe(container);
    return () => { observer.disconnect(); container.removeEventListener("scroll", capture); };
  }, [ref, selector]);
}
