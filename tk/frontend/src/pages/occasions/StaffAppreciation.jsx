import OccasionLandingPage from './OccasionLandingPage';
import { getIllustratedCovers } from '../../utils/illustratedCardDesigns';

const ALL = getIllustratedCovers('thank_you');
const COVERS = ALL;

export default function StaffAppreciationPage() {
  return (
    <OccasionLandingPage
      occasion="staff-appreciation"
      priorityDesigns={COVERS}
      priorityDesignOccasion="thank_you"
      priorityDesignEyebrow={`${COVERS.length} new thank-you covers`}
      priorityDesignTitle="Choose a cover that says thank you properly"
      priorityDesignDescription="Browse ten illustrated covers at a time. Pick one to open it in the album studio, then everyone adds messages, photos, GIFs and voice notes."
    />
  );
}
