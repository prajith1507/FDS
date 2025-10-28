"use client";

import type React from "react";

import { useCallback, useEffect, useRef, useState } from "react";

type Options = {
  axis: "x" | "y"; // x = width resize (vertical splitter), y = height resize (horizontal splitter)
  initial: number; // initial size in px
  min: number;
  max: number;
  storageKey?: string;
  inverse?: boolean; // if true, inverses the drag direction
};

export function useResizable({
  axis,
  initial,
  min,
  max,
  storageKey,
  inverse = false,
}: Options) {
  const getStored = () => {
    if (!storageKey) return undefined;
    try {
      const v = localStorage.getItem(storageKey);
      return v ? Number(v) : undefined;
    } catch {
      return undefined;
    }
  };

  const [size, setSize] = useState<number>(() => getStored() ?? initial);
  const startRef = useRef<{ startPos: number; startSize: number } | null>(null);

  const clamp = (v: number) => Math.max(min, Math.min(max, v));

  const onPointerDown = useCallback(
    (e: PointerEvent | React.PointerEvent) => {
      const client = axis === "x" ? (e as any).clientX : (e as any).clientY;
      startRef.current = { startPos: client, startSize: size };

      // Prevent text selection and other default behaviors during drag
      document.body.style.userSelect = "none";
      document.body.style.pointerEvents = "none";
      document.body.style.cursor = axis === "x" ? "col-resize" : "row-resize";

      const onMove = (ev: PointerEvent) => {
        if (!startRef.current) return;

        let delta =
          (axis === "x" ? ev.clientX : ev.clientY) - startRef.current.startPos;

        // Inverse the delta if inverse option is enabled
        if (inverse) {
          delta = -delta;
        }

        const next = clamp(startRef.current.startSize + delta);
        setSize(next);
      };

      const onUp = () => {
        // Restore original styles
        document.body.style.userSelect = "";
        document.body.style.pointerEvents = "";
        document.body.style.cursor = "";

        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        startRef.current = null;
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [axis, size, inverse]
  );

  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, String(size));
    } catch {}
  }, [size, storageKey]);

  return { size, setSize, onPointerDown };
}
