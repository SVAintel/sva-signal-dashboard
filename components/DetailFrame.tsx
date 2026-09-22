"use client";

import { ReactNode, RefObject, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, X } from "lucide-react";

export default function DetailFrame({ title, eyebrow, onClose, children, onBack, navigation, context, depth = 1,
  viewKey, bodyRef, scrollTop = 0, focusId, closeLabel = "Close details" }: {
  title: string;
  eyebrow: ReactNode;
  onClose: () => void;
  children: ReactNode;
  onBack?: () => void;
  navigation?: ReactNode;
  context?: ReactNode;
  depth?: number;
  viewKey?: number | string;
  bodyRef?: RefObject<HTMLDivElement>;
  scrollTop?: number;
  focusId?: string | null;
  closeLabel?: string;
}) {
  const id = useId();
  const frame = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const origin = useRef<HTMLElement | null>(null);
  const originFallback = useRef<HTMLElement | null>(null);
  const ownBody = useRef<HTMLDivElement>(null);
  const scrollBody = bodyRef || ownBody;
  const dismissAction = useRef(onBack || onClose);
  dismissAction.current = onBack || onClose;
  const [compact, setCompact] = useState(false);
  useLayoutEffect(() => {
    const element = frame.current;
    const previous = document.activeElement;
    if (!origin.current && previous instanceof HTMLElement && !element?.contains(previous)) {
      origin.current = previous;
      originFallback.current = previous.closest<HTMLElement>(".leaflet-container");
    }
    return () => {
      const shouldRestore = document.activeElement === document.body || !!element?.contains(document.activeElement);
      if (shouldRestore) requestAnimationFrame(() => {
        // Strict Mode replays effects without removing the sheet.
        if (element?.isConnected) return;
        const target = origin.current?.isConnected ? origin.current : originFallback.current;
        if (target?.isConnected && !target.closest("[inert]")) target.focus({ preventScroll: true });
      });
    };
  }, []);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setCompact(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useLayoutEffect(() => {
    if (scrollBody.current) scrollBody.current.scrollTop = scrollTop;
    const target = Array.from(frame.current?.querySelectorAll<HTMLElement>("[data-report-focus]") || [])
      .find((element) => element.dataset.reportFocus === focusId);
    (target || heading.current)?.focus({ preventScroll: true });
    // Restore only when the navigation location changes, not on a poll or scroll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewKey ?? title]);
  useEffect(() => {
    const siblings: { element: HTMLElement; inert: boolean }[] = [];
    if (compact && frame.current) {
      let child: HTMLElement = frame.current;
      while (child.parentElement && !child.classList.contains("desk-shell")) {
        for (const sibling of Array.from(child.parentElement.children)) {
          if (sibling !== child && sibling instanceof HTMLElement) {
            siblings.push({ element: sibling, inert: sibling.inert });
            sibling.inert = true;
          }
        }
        child = child.parentElement;
      }
    }
    const dismiss = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      const inside = frame.current?.contains(event.target as Node);
      if ((event.key === "Escape" && (compact || inside)) ||
          (event.altKey && event.key === "ArrowLeft" && inside)) {
        event.preventDefault();
        event.stopPropagation();
        dismissAction.current();
      }
      if (event.key === "Tab" && compact) {
        const controls = Array.from(frame.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, [tabindex="0"]',
        ) || []).filter((element) => element.getClientRects().length > 0);
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === heading.current)) {
          event.preventDefault(); last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first?.focus();
        }
      }
    };
    document.addEventListener("keydown", dismiss);
    return () => {
      document.removeEventListener("keydown", dismiss);
      siblings.forEach(({ element, inert }) => { element.inert = inert; });
    };
  }, [compact]);

  return (
    <aside ref={frame} className={`detail-frame${depth > 1 ? " detail-frame-nested" : ""}`} data-depth={depth}
      role="dialog" aria-modal={compact} aria-labelledby={id}>
      {navigation}
      {onBack && <div className="detail-backline"><button onClick={onBack} aria-label="Back one level"><ArrowLeft size={15} />Back</button><span>{depth === 1 ? "Overview" : `Step ${depth} in this exploration`}</span></div>}
      {context}
      <header className="detail-heading">
        <div><div className="detail-eyebrow">{eyebrow}</div><h2 ref={heading} tabIndex={-1} id={id}>{title}</h2></div>
        <button onClick={onClose} className="desk-icon-button" aria-label={closeLabel}><X size={20} /></button>
      </header>
      <div ref={scrollBody} className="detail-body">{children}</div>
    </aside>
  );
}
