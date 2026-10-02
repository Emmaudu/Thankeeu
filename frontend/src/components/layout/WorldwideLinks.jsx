import { Link } from 'react-router-dom';
import { MARKETS, prefixOf } from '../../utils/market';

/** "Taskeeu worldwide" row: one link to each country site (used in every footer). */
export default function WorldwideLinks() {
  return (
    <nav aria-label="Taskeeu in other countries" style={{ paddingTop: 22, paddingBottom: 22, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
      <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>Taskeeu worldwide</p>
      <div className="flex flex-wrap" style={{ gap: '8px 22px' }}>
        {MARKETS.map((m) => (
          <Link key={m.code} to={prefixOf(m.code) || '/'} onClick={() => window.scrollTo(0, 0)}
            style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'white'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}>
            Taskeeu {m.name}
          </Link>
        ))}
      </div>
    </nav>
  );
}
