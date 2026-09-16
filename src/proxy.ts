import { NextResponse, type NextRequest } from "next/server";
import { consentRequiredFor, REGION_COOKIE, REGION_OPTOUT, REGION_REQUIRED } from "@/lib/consentRegion";

/**
 * The one thing a fully static site cannot know on its own: where the
 * visitor is. Vercel puts the request's country in `x-vercel-ip-country`;
 * this turns it into a one-day cookie holding only the verdict - "req"
 * (opt-in region: ask before anything runs) or "ok" (opt-out region) - which
 * the consent store reads on the client. No country is stored, and the
 * cookie is strictly necessary for the consent mechanism itself, so it
 * needs no consent of its own.
 *
 * A day, not a year: people travel, and a stale "ok" on a laptop that has
 * since landed in Berlin would be the wrong answer.
 */
const MAX_AGE = 60 * 60 * 24;

export function proxy(request: NextRequest) {
  const verdict = consentRequiredFor(request.headers.get("x-vercel-ip-country")) ? REGION_REQUIRED : REGION_OPTOUT;
  const response = NextResponse.next();
  // Only write when it would change: a Set-Cookie on every response is
  // needless churn on a static page.
  if (request.cookies.get(REGION_COOKIE)?.value !== verdict) {
    response.cookies.set({ name: REGION_COOKIE, value: verdict, path: "/", maxAge: MAX_AGE, sameSite: "lax" });
  }
  return response;
}

export const config = {
  // Pages only. Anything with an extension (ads.txt, robots.txt, sitemap.xml,
  // images), Next's own assets and the API never need a region verdict.
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
