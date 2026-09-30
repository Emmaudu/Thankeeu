import OccasionLandingPage from './OccasionLandingPage';
import { getIllustratedCovers } from '../../utils/illustratedCardDesigns';

const ALL = getIllustratedCovers('congratulations');
const COVERS = ALL;

export default function PromotionPage() {
  return (
    <OccasionLandingPage
      occasion="promotion"
      priorityDesigns={COVERS}
      priorityDesignOccasion="congratulations"
      priorityDesignEyebrow={`${COVERS.length} new congratulations covers`}
      priorityDesignTitle="Choose a cover to celebrate the step up"
      priorityDesignDescription="Browse ten illustrated covers at a time. Pick one to open it in the album studio, then everyone adds messages, photos, GIFs and voice notes."
    />
  );
}
