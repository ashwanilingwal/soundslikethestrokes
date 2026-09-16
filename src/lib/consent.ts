/**
 * Cookie consent, stored per browser, exposed as an external store.
 *
 * Region-aware. In opt-in jurisdictions (see consentRegion.ts) nothing
 * non-essential runs until the visitor says yes: the AdSense script is not
 * rendered at all, and the always-present GA tag sits in Consent Mode with
 * every storage type denied. Elsewhere the law is opt-out, so tracking is on
 * until withdrawn through "cookie choices". An explicit choice, either way,
 * always wins over the regional default - ConsentProvider resolves that.
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

import { REGION_COOKIE, REGION_OPTOUT } from "./consentRegion";

export type ConsentState = "unknown" | "granted" | "denied";

/**
 * What actually applies, given the visitor's explicit choice (or none) and
 * their region. An explicit choice always wins. With none, an opt-in region
 * is "unknown" - nothing runs and the banner is up - while everywhere else
 * tracking runs until opted out, which is what those jurisdictions allow.
 * Pure, so the eval can walk every combination.
 */
export function effectiveConsent(stored: ConsentState, required: boolean): ConsentState {
  if (stored !== "unknown") return stored;
  return required ? "unknown" : "granted";
}

/**
 * Whether the banner should be on screen. It appears only when there is no
 * explicit choice AND either the region requires one or the visitor asked
 * to reconsider - and not when Google's certified message is the consent
 * UI for that region (unless the visitor deliberately reopened ours).
 */
export function bannerVisible(opts: {
  stored: ConsentState;
  required: boolean;
  reopened: boolean;
  googleMessage: boolean;
  trackingConfigured: boolean;
}): boolean {
  const { stored, required, reopened, googleMessage, trackingConfigured } = opts;
  if (!trackingConfigured || stored !== "unknown") return false;
  if (!required && !reopened) return false;
  if (googleMessage && required && !reopened) return false;
  return true;
}

/**
 * Does this visitor's region require opt-in? Read from the cookie the proxy
 * writes (see src/proxy.ts). Absent - local dev, or a host without the geo
 * header - means REQUIRED, the safe direction. Does not change during a
 * visit, so it is not part of the subscribable store.
 */
export function readRegionRequired(): boolean {
  if (typeof document === "undefined") return true;
  const hit = document.cookie.split(";").map((c) => c.trim()).find((c) => c.startsWith(`${REGION_COOKIE}=`));
  return hit?.slice(REGION_COOKIE.length + 1) !== REGION_OPTOUT;
}

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
