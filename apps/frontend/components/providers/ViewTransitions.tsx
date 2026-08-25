"use client";

import { useEffect } from "react";

/** Minimal shape of the browser's View Transition API — not yet in lib.dom for all TS targets. */
interface ViewTransitionHandle {
  updateCallbackDone: Promise<void>;
  skipTransition: () => void;
}

type ViewTransitionCapableDocument = Document & {
  startViewTransition?: (
    callback: () => void | Promise<void>
  ) => ViewTransitionHandle;
};

/** How long we'll wait for the route's DOM update before giving up on the transition. */
const MUTATION_TIMEOUT_MS = 1500;

let activeTransition: ViewTransitionHandle | null = null;

/**
 * Waits for the next DOM mutation inside `root` (i.e. the route content
 * swapping in), with a timeout so a slow/failed navigation can never leave
 * the page stuck mid-transition ("no flash on slow connections").
 */
function waitForNextMutation(root: Element): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      observer.disconnect();
      clearTimeout(timer);
      resolve();
    };
    const observer = new MutationObserver(() => done());
    observer.observe(root, { childList: true, subtree: true });
    const timer = window.setTimeout(done, MUTATION_TIMEOUT_MS);
  });
}

function startTransitionForNextMutation() {
  const doc = document as ViewTransitionCapableDocument;
  if (typeof doc.startViewTransition !== "function") return;

  const root = document.querySelector("main.app-content") ?? document.body;

  // Avoid overlapping transitions if navigation happens again mid-animation.
  activeTransition?.skipTransition();

  activeTransition = doc.startViewTransition(() => waitForNextMutation(root));
  activeTransition.updateCallbackDone.finally(() => {
    activeTransition = null;
  });
}

function isPlainLeftClick(event: MouseEvent): boolean {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

function findAnchor(target: EventTarget | null): HTMLAnchorElement | null {
  if (!(target instanceof Element)) return null;
  return target.closest("a");
}

function isInternalNavigableLink(anchor: HTMLAnchorElement): boolean {
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download")) return false;
  if (anchor.dataset.noTransition !== undefined) return false;

  let url: URL;
  try {
    url = new URL(anchor.href, window.location.href);
  } catch {
    return false;
  }
  if (url.origin !== window.location.origin) return false;

  // Same-page hash navigation isn't a route change.
  if (url.pathname === window.location.pathname && url.hash) return false;

  return true;
}

/**
 * Cross-fades route changes using the native View Transitions API.
 *
 * A thin wrapper (no Next.js experimental flag required): it starts a view
 * transition just before an internal link click or back/forward navigation
 * mutates the DOM, and resolves it once the route content actually swaps in.
 *
 * No-ops entirely — zero listeners attached — when the browser lacks
 * `document.startViewTransition` or the user prefers reduced motion, so
 * unsupported browsers and reduced-motion users see the exact same instant
 * swap as today.
 */
export function ViewTransitions() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!("startViewTransition" in document)) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let attached = false;

    function onClick(event: MouseEvent) {
      if (!isPlainLeftClick(event)) return;
      const anchor = findAnchor(event.target);
      if (!anchor || !isInternalNavigableLink(anchor)) return;
      startTransitionForNextMutation();
    }

    function onPopState() {
      startTransitionForNextMutation();
    }

    function attach() {
      if (attached) return;
      attached = true;
      document.addEventListener("click", onClick, true);
      window.addEventListener("popstate", onPopState);
    }

    function detach() {
      if (!attached) return;
      attached = false;
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
    }

    function sync() {
      if (media.matches) {
        detach();
      } else {
        attach();
      }
    }

    sync();
    media.addEventListener("change", sync);

    return () => {
      media.removeEventListener("change", sync);
      detach();
    };
  }, []);

  return null;
}
