"use client";

import { ReactNode, useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

export default function WorkspacePopover({
  label,
  title,
  icon,
  open,
  onOpenChange,
  children,
}: {
  label: string;
  title: string;
  icon: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) onOpenChange(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape);
    };
  }, [open, onOpenChange]);

  return (
    <div className="desk-popover" ref={root}>
      <button ref={trigger} className="desk-tool" aria-expanded={open} aria-controls={id}
        onClick={() => onOpenChange(!open)}>
        {icon}<span>{label}</span>
      </button>
      {open && (
        <section className="desk-popover-panel" id={id} aria-label={title}>
          <div className="desk-popover-heading">
            <h2>{title}</h2>
            <button className="desk-icon-button" aria-label={`Close ${title.toLowerCase()}`}
              onClick={() => { onOpenChange(false); trigger.current?.focus(); }}>
              <X size={17} />
            </button>
          </div>
          {children}
        </section>
      )}
    </div>
  );
}
