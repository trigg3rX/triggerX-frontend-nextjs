"use client";

import { MutableRefObject, useEffect } from "react";

type Props = {
  scopeRef?: MutableRefObject<HTMLElement | null>;
};

export default function DisableInteractions({ scopeRef }: Props) {
  useEffect(() => {
    const captureOptions: AddEventListenerOptions = { capture: true };

    const isInsideScope = (eventTarget: EventTarget | null) => {
      if (!scopeRef?.current) return true; // if no scope provided, treat as global
      if (!(eventTarget instanceof Node)) return false;
      return scopeRef.current.contains(eventTarget as Node);
    };

    const handleContextMenu = (e: Event) => {
      if (!isInsideScope(e.target)) return;
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isInsideScope(e.target)) return;
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      const blockCombos = [
        e.key === "F12",
        ctrlOrCmd &&
          e.shiftKey &&
          ["I", "J", "C", "K"].includes(e.key.toUpperCase()),
        ctrlOrCmd && e.key.toUpperCase() === "U",
      ];

      if (blockCombos.some(Boolean)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // When scoping to an element, attach listeners to document but guard by scope check
    // so that key events from focused elements inside scope are blocked.
    document.addEventListener(
      "contextmenu",
      handleContextMenu as EventListener,
      captureOptions,
    );
    document.addEventListener("keydown", handleKeyDown, captureOptions);

    return () => {
      document.removeEventListener(
        "contextmenu",
        handleContextMenu as EventListener,
        captureOptions as unknown as boolean,
      );
      document.removeEventListener(
        "keydown",
        handleKeyDown,
        captureOptions as unknown as boolean,
      );
    };
  }, [scopeRef]);

  return null;
}
