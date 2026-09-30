// RevampedOccasionPages.jsx — the 7 pages revamped to match /cards/leaving-card's
// layout (RichOccasionPage.jsx template). Each is a thin wrapper so App.jsx's
// routing stays simple. Every other occasion page (ExtraOccasionPage,
// OccasionLandingPage, OccasionHeroTemplate consumers) is untouched.

import RichOccasionPage from './RichOccasionPage';
import { RICH_OCCASION_PAGES } from './richOccasionPagesData';
import WeddingLandingTemplate from '../../components/WeddingLandingTemplate';
import Home from '../Home';
import { GENERAL_LANDINGS } from '../../data/countryLandings';

export function SympathyCardPageRevamped() {
  return <RichOccasionPage config={RICH_OCCASION_PAGES.sympathy} />;
}
export function LeavingCardUKPageRevamped() {
  return <RichOccasionPage config={RICH_OCCASION_PAGES['leaving-uk']} />;
}
export function BirthdayCardUKPageRevamped() {
  return <RichOccasionPage config={RICH_OCCASION_PAGES['birthday-uk']} />;
}
export function BabyShowerPageRevamped() {
  return <RichOccasionPage config={RICH_OCCASION_PAGES['baby-shower']} />;
}
// Wedding uses the homepage layout with wedding copy (data/weddingLandings.js).
export function WeddingPageRevamped() {
  return <WeddingLandingTemplate page="occasions-wedding" />;
}
export function MaternityLeavePageRevamped() {
  return <RichOccasionPage config={RICH_OCCASION_PAGES['maternity-leave']} />;
}
export function OnlineBirthdayNigeriaPageRevamped() {
  return <RichOccasionPage config={RICH_OCCASION_PAGES['birthday-nigeria']} />;
}
// Homepage layout with general group-card copy (data/countryLandings.js).
export function OnlineGroupCardRevamped() {
  return <Home landing={GENERAL_LANDINGS['online-group-card']} />;
}
