import OccasionLandingPage from './OccasionLandingPage';
import { getIllustratedCovers } from '../../utils/illustratedCardDesigns';

const COVERS = getIllustratedCovers('graduation');

export default function GraduationPage() {
  return (
    <OccasionLandingPage
      occasion="graduation"
      priorityDesigns={COVERS}
      priorityDesignOccasion="graduation"
      priorityDesignEyebrow={`${COVERS.length} new graduation covers`}
      priorityDesignTitle="Choose a cover for the graduate"
      priorityDesignDescription="Browse ten illustrated covers at a time. Pick one to open it in the album studio, then everyone adds messages, photos, GIFs and voice notes."
    />
  );
}
