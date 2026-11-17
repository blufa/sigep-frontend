"use client";

import { useEffect } from "react";

/** Enregistre le service worker (installabilité PWA sur Android) — no-op silencieux si indisponible. */
export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return null;
}
