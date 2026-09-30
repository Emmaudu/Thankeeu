import Home from '../pages/Home';
import { weddingLanding } from '../data/weddingLandings';

/**
 * Every wedding landing page (guestbooks, photo sharing, gift pot and the
 * comparison pages) renders the homepage layout with its own wedding copy from
 * data/weddingLandings.js — SEO, hero, covers, comparison and FAQs included.
 */
export default function WeddingLandingTemplate({ page }) {
  return <Home landing={weddingLanding(page)} />;
}
