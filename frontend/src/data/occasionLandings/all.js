/**
 * Every landing page's copy in one list, merged with its manifest entry.
 * For scripts/prerender.js and tests only; the app loads pages per file
 * (see index.js) so visitors never download all of them.
 */
import { manifestByKey } from './manifest.js';
import group1 from './pages/group-1.js';
import group2 from './pages/group-2.js';
import farewell1 from './pages/farewell-1.js';
import farewell2 from './pages/farewell-2.js';
import farewell3 from './pages/farewell-3.js';
import birthday1 from './pages/birthday-1.js';
import birthday2 from './pages/birthday-2.js';
import birthday3 from './pages/birthday-3.js';
import babyshower1 from './pages/babyshower-1.js';
import babyshower2 from './pages/babyshower-2.js';
import anniversary1 from './pages/anniversary-1.js';
import anniversary2 from './pages/anniversary-2.js';

export const ALL_LANDING_PAGES = [
  ...group1, ...group2, ...farewell1, ...farewell2, ...farewell3, ...birthday1, ...birthday2, ...birthday3,
  ...babyshower1, ...babyshower2, ...anniversary1, ...anniversary2,
].map(p => ({ ...manifestByKey[p.key], ...p }));
