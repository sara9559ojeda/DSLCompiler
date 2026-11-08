import { LandingNav } from "./LandingNav.js";
import { LandingHero } from "./LandingHero.js";
import { InteractivePlayground } from "./InteractivePlayground.js";
import { ExampleGallery } from "./ExampleGallery.js";
import { HowItWorks } from "./HowItWorks.js";
import { CreativeAISection } from "./CreativeAISection.js";
import { FinalCTA } from "./FinalCTA.js";
import { Footer } from "../components/Footer.js";
import "../styles/landing.css";

/** The marketing/experience page. The studio is a separate lazy view (see App.tsx). */
export default function LandingPage(): JSX.Element {
  return (
    <div className="landing">
      <LandingNav />
      <main>
        <LandingHero />
        <InteractivePlayground />
        <ExampleGallery />
        <HowItWorks />
        <CreativeAISection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
