"use client";

import { useEffect } from "react";

/** Registers /sw.js on mount. Renders nothing — this is a side-effect-only component. */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Registration failures (e.g. unsupported browser quirks) shouldn't
      // break the app — it just runs without offline support.
    });
  }, []);

  return null;
}
