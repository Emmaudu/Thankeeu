/** Every Teams page merged with its manifest entry (prerender and tests only). */
import { teamsByKey } from './manifest.js';
import us from './pages/us.js';
import uk from './pages/uk.js';
import canada from './pages/canada.js';
import germany from './pages/germany.js';
import mauritius from './pages/mauritius.js';

export const ALL_TEAMS_PAGES = [...us, ...uk, ...canada, ...germany, ...mauritius].map(p => ({ ...teamsByKey[p.key], ...p }));
