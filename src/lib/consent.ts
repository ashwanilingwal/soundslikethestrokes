/**
 * Cookie consent, stored per browser, exposed as an external store.
 *
 * The gate is a hard one: until the visitor chooses, no Google script is
 * rendered at all, so nothing can set a cookie or fire a beacon. That is
 * simpler to reason about - and to verify - than loading the tags and asking
 * them nicely to behave.
 *
 * Modelled as a subscribable store rather than React state because that is
 * what localStorage actually is: mutable data owned outside React, which can
 * also change in ANOTHER TAB. useSyncExternalStore handles both, including
 * the server render, without a setState-in-effect dance.
 *
 * Nothing here touches the app itself. The microphone, the DSP and recording
 * are all local and stay fully usable whichever way the visitor answers;
 * declining costs them nothing.
 */

export type ConsentState = "unknown" | "granted" | "denied";

/** Versioned: bump the suffix to re-ask everyone after a policy change. */
export const CONSENT_KEY = "sslts.consent.v1";

type Listener = () => void;
const listeners = new Set<Listener>();

/** Client snapshot. Returns a primitive, so React can compare it cheaply. */
export function readConsent(): ConsentState {
  if (typeof window === "undefined") return "unknown";
  try {
    const v = window.localStorage.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : "unknown";
  } catch {
    // Private mode, or storage disabled. Treat as undecided, which means
    // nothing loads - the safe direction to fail in.
    return "unknown";
  }
}

/**
 * Server snapshot. Always "unknown": the server cannot know, and assuming
 * consent it has not seen would defeat the point.
 */
export function serverConsent(): ConsentState {
  return "unknown";
}

/**
 * First-party cookies Google's tags set. Withdrawing consent has to actually
 * remove what was already dropped, not merely stop future loads.
 *
 * Best effort by necessity: anything on another domain (doubleclick.net) or
 * marked HttpOnly is unreachable from script. Those expire on their own, and
 * no new ones can appear once the tags stop loading.
 */
const TRACKING_COOKIE_PREFIXES = ["_ga", "_gid", "_gat", "_gcl", "__gads", "__gpi", "__eoi"];

function clearTrackingCookies(): void {
  if (typeof document === "undefined") return;
  const host = window.location.hostname;
  // A cookie can only be deleted by matching its exact path AND domain, and
  // the tag may have set either the bare host or a dot-prefixed parent.
  const domains = [undefined, host, `.${host}`, `.${host.split(".").slice(-2).join(".")}`];
  for (const raw of document.cookie.split(";")) {
    const name = raw.split("=")[0]?.trim();
    if (!name || !TRACKING_COOKIE_PREFIXES.some((p) => name.startsWith(p))) continue;
    for (const domain of domains) {
      document.cookie =
        `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/` + (domain ? `; domain=${domain}` : "");
    }
  }
}

export function writeConsent(state: ConsentState): void {
  if (typeof window === "undefined") return;
  try {
    if (state === "unknown") window.localStorage.removeItem(CONSENT_KEY);
    else window.localStorage.setItem(CONSENT_KEY, state);
  } catch {
    // Choice just won't persist; the session still honours it.
  }
  if (state === "denied") clearTrackingCookies();
  for (const l of listeners) l();
}

export function subscribeConsent(onChange: Listener): () => void {
  listeners.add(onChange);
  // `storage` fires only in OTHER tabs, which is exactly the case local
  // notification misses - withdraw consent in one tab, every tab follows.
  const onStorage = (e: StorageEvent) => {
    if (e.key === CONSENT_KEY || e.key === null) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}
