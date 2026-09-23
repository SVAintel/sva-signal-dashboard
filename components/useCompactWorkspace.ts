"use client";

import { useEffect, useSyncExternalStore } from "react";
import { COMPACT_WORKSPACE_QUERY } from "@/lib/workspace-layout";

const subscribe = (update: () => void) => {
  const media = window.matchMedia(COMPACT_WORKSPACE_QUERY);
  media.addEventListener("change", update);
  return () => media.removeEventListener("change", update);
};
const getSnapshot = () => window.matchMedia(COMPACT_WORKSPACE_QUERY).matches;
const getServerSnapshot = () => false;

export function useCompactWorkspace() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useWorkspaceViewport(compact: boolean) {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!compact || !viewport) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        // Keyboard/browser chrome can resize the usable surface without changing
        // layout mode. Pinch zoom must not resize the application underneath it.
        if (viewport.scale === 1) document.documentElement.style.setProperty(
          "--workspace-height", `${Math.min(window.innerHeight, viewport.height)}px`,
        );
      });
    };
    update();
    viewport.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener("resize", update);
      document.documentElement.style.removeProperty("--workspace-height");
    };
  }, [compact]);
}
