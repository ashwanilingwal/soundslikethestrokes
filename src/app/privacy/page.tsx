import type { Metadata } from "next";
import Link from "next/link";
import { CookieChoices } from "@/components/CookieChoices";
import { adsEnabled } from "@/lib/ads";
import { analyticsEnabled } from "@/lib/analytics";
import { PRIVACY_CONTACT, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy and cookies",
  description: `What ${SITE_NAME} does and does not collect: the audio never leaves your browser; analytics and ads only with consent where consent is required.`,
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

/**
 * Same shell and type as the guide, so it reads as part of the site rather
 * than a legal appendix bolted on. Written to be TRUE of this codebase
 * specifically - every sentence here corresponds to something the code does
 * or does not do - rather than copied from a generator.
 */
const LAST_UPDATED = "16 September 2026";

interface Item {
  term: string;
  plain: string;
  deeper: string;
}

const SECTIONS: { id: string; title: string; blurb: string; items: Item[] }[] = [
  {
    id: "audio",
    title: "Your voice",
    blurb: "The whole point of the site, and the simplest part of this page.",
    items: [
      {
        term: "Nothing you say leaves your browser",
        plain: "The microphone feeds the browser's own audio engine, in your tab, and that is where every sample stays.",
        deeper:
          "Pitch detection and the effects run in an AudioWorklet on your device. There is no upload, no server-side processing and no storage: close the tab and it is gone. Recording writes a file to your own downloads folder only when you press record and save it yourself.",
      },
      {
        term: "No account, no login",
        plain: "There is nothing to sign up for, so there is no profile of you to keep.",
        deeper: "The site has no user database. Presets you export are files on your computer; importing one reads it in your browser and sends nothing anywhere.",
      },
    ],
  },
  {
    id: "device",
    title: "Stored on your device",
    blurb: "Two small things, both under your control, neither shared.",
    items: [
      {
        term: "Your cookie choice",
        plain: "Saved in your browser's local storage so you are not asked again on every visit.",
        deeper: "Change or withdraw it any time from the control at the bottom of this page or the footer. Declining also deletes the analytics and advertising cookies already set in this browser, as far as a website is able to.",
      },
      {
        term: "A region note",
        plain: "A one-day cookie recording only whether your region requires opt-in consent - not which country you are in.",
        deeper: "It is set from the request's country at the network edge and holds one of two words. It exists purely so the consent mechanism can behave correctly, which makes it strictly necessary and exempt from consent itself.",
      },
    ],
  },
  {
    id: "analytics",
    title: "Analytics",
    blurb: analyticsEnabled
      ? "Google Analytics 4, to see how many people use the site and which controls they reach for."
      : "No analytics is configured on this deployment.",
    items: analyticsEnabled
      ? [
          {
            term: "In the EEA, UK and Switzerland: nothing until you say yes",
            plain: "No analytics cookie is set before you accept.",
            deeper:
              "The Google tag is present on the page but runs under Google Consent Mode with all storage denied, so until you accept it sets no cookies and carries no user identifier; Google receives only limited, cookieless signals it uses for aggregate modelling. Accepting sets the standard _ga cookies (a random client identifier, kept up to two years). Declining, then or later, removes them.",
          },
          {
            term: "Elsewhere: on unless you switch it off",
            plain: "Outside opt-in regions analytics runs by default, as those jurisdictions permit, and the same control turns it off.",
            deeper: "Google processes this data as our processor under its terms; IP addresses are not stored by Google Analytics 4. See Google's own description of how it uses data from sites that use its services, linked below.",
          },
        ]
      : [],
  },
  {
    id: "ads",
    title: "Advertising",
    blurb: adsEnabled
      ? "One Google AdSense unit below the controls pays for the site."
      : "No advertising is configured on this deployment.",
    items: adsEnabled
      ? [
          {
            term: "Only with consent where consent is required",
            plain: "In the EEA, UK and Switzerland the advertising script is not even loaded until you accept.",
            deeper:
              "When it runs, Google and its certified partners may set cookies and use identifiers to serve and measure ads, including personalised ads where you have allowed that. Google's own consent message may be shown for this in those regions, in which case its choices apply. You can opt out of personalised advertising in Google's Ads Settings at any time.",
          },
        ]
      : [],
  },
  {
    id: "rights",
    title: "Your rights",
    blurb: "Under the GDPR, the UK GDPR and similar laws.",
    items: [
      {
        term: "Withdraw consent as easily as you gave it",
        plain: "The control below and the footer link do exactly that, in one click, with both options weighted the same.",
        deeper:
          "You also have the right to access, correct or erase personal data and to complain to your supervisory authority. Because the site itself holds no data about you, requests about analytics or advertising data are ones Google answers as controller for its services; the links below lead to its tools.",
      },
    ],
  },
];

const LINKS = [
  { href: "https://policies.google.com/technologies/partner-sites", label: "How Google uses information from sites that use its services" },
  { href: "https://policies.google.com/technologies/ads", label: "How Google uses cookies in advertising" },
  { href: "https://adssettings.google.com/", label: "Google Ads Settings — opt out of personalised ads" },
  { href: "https://tools.google.com/dlpage/gaoptout", label: "Google Analytics opt-out browser add-on" },
];

export default function PrivacyPage() {
  return (
    <main className="stage guide-stage">
      <div className="win stage-window">
        <div className="win-title">
          <span>privacy · what is and is not collected</span>
          <span className="win-dots" aria-hidden>
            <span className="win-dot" />
            <span className="win-dot" />
            <span className="win-dot" />
          </span>
        </div>

        <header className="guide-masthead">
          <h1 className="guide-h1">Privacy and cookies</h1>
          <p className="guide-lede">
            Short, because there is not much to say: the audio is entirely yours, and the only data that ever leaves
            your browser is analytics and advertising you can switch on or off. Last updated {LAST_UPDATED}.
          </p>
          <Link href="/" className="btn btn-sm guide-back">
            ← back to the deck
          </Link>
        </header>

        {SECTIONS.map((section) => (
          <section key={section.id} id={section.id} className="guide-section">
            <header className="guide-section-head">
              <span className="min-w-0">
                <h2 className="guide-section-title">{section.title}</h2>
                <p className="guide-section-blurb">{section.blurb}</p>
              </span>
            </header>
            {section.items.length > 0 && (
              <div className="guide-entries">
                {section.items.map((item, i) => (
                  <article key={item.term} className="guide-entry">
                    <div className="guide-entry-head">
                      <span className="guide-num" aria-hidden>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <h3 className="guide-term">{item.term}</h3>
                    </div>
                    <p className="guide-plain">{item.plain}</p>
                    <p className="guide-deeper">{item.deeper}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        ))}

        <section id="choices" className="guide-section">
          <header className="guide-section-head">
            <span className="min-w-0">
              <h2 className="guide-section-title">Your choices</h2>
              <p className="guide-section-blurb">What applies in this browser right now, and the switch.</p>
            </span>
          </header>
          <CookieChoices />
        </section>

        <section id="more" className="guide-section">
          <header className="guide-section-head">
            <span className="min-w-0">
              <h2 className="guide-section-title">Google&rsquo;s own pages</h2>
            </span>
          </header>
          <ul className="legal-links">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} rel="noopener noreferrer" target="_blank">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          {PRIVACY_CONTACT && (
            <p className="guide-deeper">
              Questions about your data: <a href={`mailto:${PRIVACY_CONTACT}`}>{PRIVACY_CONTACT}</a>
            </p>
          )}
        </section>

        <footer className="guide-foot">
          <Link href="/" className="btn btn-sm">
            ← back to the deck
          </Link>
        </footer>
      </div>
    </main>
  );
}
