// RevampedOccasionPages.jsx — the 7 pages revamped to match /cards/leaving-card's
// layout (RichOccasionPage.jsx template). Each is a thin wrapper so App.jsx's
// routing stays simple. Every other occasion page (ExtraOccasionPage,
// OccasionLandingPage, OccasionHeroTemplate consumers) is untouched.

import RichOccasionPage from './RichOccasionPage';
import { RICH_OCCASION_PAGES } from './richOccasionPagesData';

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
export function WeddingPageRevamped() {
  return <RichOccasionPage config={RICH_OCCASION_PAGES.wedding} />;
}
export function MaternityLeavePageRevamped() {
  return <RichOccasionPage config={RICH_OCCASION_PAGES['maternity-leave']} />;
}
export function OnlineBirthdayNigeriaPageRevamped() {
  return <RichOccasionPage config={RICH_OCCASION_PAGES['birthday-nigeria']} />;
}
