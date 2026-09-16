/**
 * Where prior (opt-in) consent is required before any non-essential cookie
 * or tracking signal: the EEA (EU 27 plus Iceland, Liechtenstein, Norway),
 * the UK, and Switzerland. This is also exactly the set Google's EU User
 * Consent Policy covers, so the same list drives the banner, the proxy's
 * region cookie and the region-scoped Consent Mode default in the GA tag.
 *
 * Everywhere else the law is opt-OUT at most (California, Brazil, Canada),
 * which the always-available "cookie choices" control satisfies.
 *
 * Shared by the proxy (server, request time) and the client store. Keep it
 * dependency-free: the proxy must not drag app code into the edge bundle.
 */
export const CONSENT_REQUIRED_REGIONS: readonly string[] = [
  // EU 27
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE",
  "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
  // rest of the EEA
  "IS", "LI", "NO",
  // UK GDPR + PECR
  "GB",
  // Swiss nFADP, and in Google's policy set
  "CH",
];

/**
 * Unknown country (no geo header - local dev, a proxy that strips it, a
 * host other than Vercel) is treated as REQUIRED. Wrongly asking someone
 * costs a click; wrongly tracking someone is the thing the law is about.
 */
export function consentRequiredFor(country: string | null | undefined): boolean {
  if (!country) return true;
  return CONSENT_REQUIRED_REGIONS.includes(country.toUpperCase());
}

/** Cookie the proxy writes and the client reads. Holds the VERDICT, never the country. */
export const REGION_COOKIE = "sslts.region";
export const REGION_REQUIRED = "req";
export const REGION_OPTOUT = "ok";
