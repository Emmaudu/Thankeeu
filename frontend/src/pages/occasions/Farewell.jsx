import OccasionLandingPage from './OccasionLandingPage';
import { getIllustratedCovers } from '../../utils/illustratedCardDesigns';

const FAREWELL_COVERS = getIllustratedCovers('leaving');

export default function FarewellPage() {
  return (
    <OccasionLandingPage
      occasion="farewell"
      priorityDesigns={FAREWELL_COVERS}
      priorityDesignOccasion="leaving"
      priorityDesignEyebrow={`${FAREWELL_COVERS.length} new farewell covers`}
      priorityDesignTitle="Choose a farewell cover worthy of their next chapter"
      priorityDesignDescription="Browse ten illustrated covers at a time. Pick one to open it in the album studio, then everyone adds messages, photos, GIFs and voice notes."
    />
  );
}
