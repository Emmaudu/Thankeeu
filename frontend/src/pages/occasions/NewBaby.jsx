import OccasionLandingPage from './OccasionLandingPage';
import { getIllustratedCovers } from '../../utils/illustratedCardDesigns';

// New baby and baby shower share one cover set (the wizard has one
// baby_shower occasion for both). "Oh baby!" and "It's a boy/girl" lead here.
const ALL = getIllustratedCovers('baby_shower');
const LEAD = ['bs1-oh-baby', 'bs29-its-a-boy', 'bs30-its-a-girl', 'bs37-bundle'];
// After the lead: covers for a baby who has arrived (or neutral) first,
// "on the way" and "happy baby shower" covers last.
const BEFORE_BIRTH = /shower|on the way|coming|bump|almost here|nearly here|counting down|soon|can’t wait|can't wait/i;
const rest = ALL.filter(d => !LEAD.some(stem => d.id.endsWith(`-${stem}`)));
const isBefore = d => BEFORE_BIRTH.test(`${d.name} ${d.coverSubtitle || ''}`);
const COVERS = [
  ...LEAD.map(stem => ALL.find(d => d.id.endsWith(`-${stem}`))).filter(Boolean),
  ...rest.filter(d => !isBefore(d)),
  ...rest.filter(isBefore),
];

export default function NewBabyPage() {
  return (
    <OccasionLandingPage
      occasion="new-baby"
      priorityDesigns={COVERS}
      priorityDesignOccasion="baby_shower"
      priorityDesignEyebrow={`${COVERS.length} new baby covers`}
      priorityDesignTitle="Choose a cover for the new arrival"
      priorityDesignDescription="Browse ten illustrated covers at a time. Pick one to open it in the album studio, then everyone adds messages, photos, GIFs and voice notes."
    />
  );
}
