"use client";
import { useEffect } from "react";
import { asset } from "./ui";

/** Registers coi-sw.js so the page becomes cross-origin isolated (multi-threaded inference). Reloads once on first install. */
export default function Isolation() {
  useEffect(() => {
    if (self.crossOriginIsolated || !("serviceWorker" in navigator) || !window.isSecureContext) return;
    navigator.serviceWorker.register(asset("/coi-sw.js"), { scope: asset("/") }).then(() => {
      if (navigator.serviceWorker.controller) return; // already controlled but not isolated: browser lacks support
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        try {
          if (sessionStorage.getItem("coi-reloaded")) return;
          sessionStorage.setItem("coi-reloaded", "1");
        } catch {}
        location.reload();
      });
    }).catch(() => {});
  }, []);
  return null;
}
