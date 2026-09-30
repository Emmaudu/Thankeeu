import OccasionLandingPage from './OccasionLandingPage';
import { getIllustratedCovers } from '../../utils/illustratedCardDesigns';

const ALL = getIllustratedCovers('congratulations');
// Grad cap first on the graduation page; the rest in curated order.
const COVERS = [...ALL.filter(d => d.id.endsWith('-c7-grad-cap')), ...ALL.filter(d => !d.id.endsWith('-c7-grad-cap'))];

export default function GraduationPage() {
  return (
    <OccasionLandingPage
      occasion="graduation"
      priorityDesigns={COVERS}
      priorityDesignOccasion="congratulations"
      priorityDesignEyebrow={`${COVERS.length} new congratulations covers`}
      priorityDesignTitle="Choose a cover for the graduate"
      priorityDesignDescription="Browse ten illustrated covers at a time. Pick one to open it in the album studio, then everyone adds messages, photos, GIFs and voice notes."
    />
  );
}
