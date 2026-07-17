import OccasionLandingPage from './OccasionLandingPage';
import { FAREWELL_PRIORITY_DESIGNS } from '../../utils/priorityCardDesigns';

export default function FarewellPage() {
  return (
    <OccasionLandingPage
      occasion="farewell"
      priorityDesigns={FAREWELL_PRIORITY_DESIGNS}
      priorityDesignOccasion="leaving"
      priorityDesignEyebrow="20 new farewell covers"
      priorityDesignTitle="Choose a farewell cover worthy of their next chapter"
      priorityDesignDescription="Browse ten premium A4 designs at a time. Select a cover to personalise the full farewell album with messages, photos, video and voice notes."
    />
  );
}
