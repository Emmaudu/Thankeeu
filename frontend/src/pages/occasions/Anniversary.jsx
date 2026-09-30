import OccasionLandingPage from './OccasionLandingPage';
import { getIllustratedCovers } from '../../utils/illustratedCardDesigns';

const ALL = getIllustratedCovers('anniversary');
const COVERS = ALL;

export default function AnniversaryPage() {
  return (
    <OccasionLandingPage
      occasion="anniversary"
      priorityDesigns={COVERS}
      priorityDesignOccasion="anniversary"
      priorityDesignEyebrow={`${COVERS.length} new anniversary covers`}
      priorityDesignTitle="Choose a cover for the happy couple"
      priorityDesignDescription="Browse ten illustrated covers at a time. Pick one to open it in the album studio, then everyone adds messages, photos, GIFs and voice notes."
    />
  );
}
