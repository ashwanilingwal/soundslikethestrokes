import type { Metadata } from "next";
import { SiteCopy } from "@/components/SiteCopy";
import { VoiceStage } from "@/components/VoiceStage";

/**
 * The canonical is declared here rather than in the root layout so that
 * child routes do not inherit it — a layout-level canonical would quietly
 * tell Google that /guide is a duplicate of the home page.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <VoiceStage>
      <SiteCopy />
    </VoiceStage>
  );
}
