import Home from '../Home';
import { COUNTRY_LANDINGS } from '../../data/countryLandings';

// Country landing pages use the homepage layout with their own copy
// (data/countryLandings.js). /online-group-cards-nigeria keeps its URL for its
// rankings but is a global, USD page.
export function GroupCardsUK()      { return <Home landing={COUNTRY_LANDINGS.uk} />; }
export function GroupCardsUS()      { return <Home landing={COUNTRY_LANDINGS.us} />; }
export function GroupCardsCanada()  { return <Home landing={COUNTRY_LANDINGS.canada} />; }
export function GroupCardsNigeria() { return <Home landing={COUNTRY_LANDINGS.nigeria} />; }
