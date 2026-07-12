import { useSEO, SCHEMAS } from '../hooks/useSEO';
import WeddingLandingTemplate from '../components/WeddingLandingTemplate';
import Icon from '../components/ui/Icon';

const CHECK = <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100"><Icon name="Check" size={14} className="text-green-600" strokeWidth={3}/></span>;
const CROSS = <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-50"><Icon name="X" size={14} className="text-red-400" strokeWidth={3}/></span>;

const TABLE_ROWS = [
  ['Guest photo upload via QR', CHECK, CHECK, CHECK, CHECK],
  ['No app download for guests', CHECK, CROSS, CHECK, CHECK],
  ['Written messages from guests', CROSS, CROSS, CROSS, CHECK],
  ['Voice notes from guests', CROSS, CROSS, CROSS, CHECK],
  ['Wedding gift pot', CROSS, CROSS, CROSS, CHECK],
  ['Auto Memory Movie™', CROSS, CROSS, CROSS, CHECK],
  ['Free to start', 'Limited', 'Limited', 'Limited', CHECK],
  ['Works in Nigeria / Africa', CROSS, CROSS, CROSS, CHECK],
];

export default function BestWeddingPhotoSharingApp() {
  useSEO({
    title: 'Best Wedding Photo Sharing App 2025 — Honest Comparison | Thankeeu',
    description: 'Looking for the best wedding photo sharing app? Compare GuestPix, WedUploader, Wedtrove and Thankeeu side by side. Thankeeu is the only one that combines photo sharing with messages, voice notes, and a gift pot.',
    keywords: 'best wedding photo sharing app, best app to share wedding photos, wedding photo sharing app comparison, GuestPix vs Thankeeu, WedUploader vs Thankeeu, Wedtrove vs Thankeeu',
    canonical: '/best-wedding-photo-sharing-app',
    jsonLd: [SCHEMAS.organization, SCHEMAS.webPage('Best Wedding Photo Sharing App 2025', 'Honest comparison of the best wedding photo sharing apps.', '/best-wedding-photo-sharing-app'), SCHEMAS.breadcrumb([{name:'Home',url:'/'},{name:'Best Wedding Photo Sharing App',url:'/best-wedding-photo-sharing-app'}])],
  });
  return (
    <WeddingLandingTemplate
      headline={<>The Best Wedding Photo Sharing App<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">Honest Comparison for 2025</span></>}
      subheadline="GuestPix, WedUploader, Wedtrove, and Thankeeu all let guests upload photos. Only one also collects messages, voice notes, and gifts — making it more than a photo app."
      tagline="If you only need photo uploads, any of them will do. If you want your wedding memories to include the spoken words and heartfelt messages too — Thankeeu is the one."
      tableCompetitorLabel="Other Photo Apps"
      relatedLinks={[
        {to:'/guestpix-alternative', label:'GuestPix Alternative'},
        {to:'/weduploader-alternative', label:'WedUploader Alternative'},
        {to:'/thankeeu-vs-wedtrove', label:'Thankeeu vs Wedtrove'},
        {to:'/wedding-photo-sharing-app', label:'Wedding Photo Sharing App'},
        {to:'/digital-wedding-guest-book', label:'Digital Wedding Guest Book'},
      ]}
    />
  );
}
