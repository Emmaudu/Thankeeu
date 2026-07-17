const pad = number => String(number).padStart(2, '0');

const createDesignCollection = ({
  occasion,
  idPrefix,
  namePrefix,
  coverTitle,
  coverSubtitle,
  icon,
  assetFolder,
  assetPrefix,
  style,
  accent,
  soft,
  ink = '#ffffff',
}) => Array.from({ length: 20 }, (_, index) => {
  const number = index + 1;
  const suffix = pad(number);
  const image = `/cards/priority/${assetFolder}/${assetPrefix}_${suffix}.avif`;

  return {
    id: `${idPrefix}-${suffix}`,
    occasion,
    name: `${namePrefix} ${suffix}`,
    coverTitle,
    coverSubtitle,
    icon,
    image,
    background: `linear-gradient(145deg, ${soft}, #ffffff), url(${image})`,
    ink,
    accent,
    soft,
    palette: [accent, soft, '#ffffff', '#2e174b'],
    badge: number <= 10 ? 'Featured' : 'New',
    style,
    priority: true,
    dark: true,
  };
});

export const BIRTHDAY_PRIORITY_DESIGNS = createDesignCollection({
  occasion: 'birthday',
  idPrefix: 'birthday-featured',
  namePrefix: 'Birthday Celebration',
  coverTitle: 'Happy Birthday',
  coverSubtitle: 'A beautiful day, made brighter by everyone',
  icon: 'Cake',
  assetFolder: 'birthday',
  assetPrefix: 'birthday',
  style: 'Premium A4 birthday cover',
  accent: '#e84393',
  soft: '#fff0f7',
});

export const FAREWELL_PRIORITY_DESIGNS = createDesignCollection({
  occasion: 'leaving',
  idPrefix: 'farewell-featured',
  namePrefix: 'Farewell Keepsake',
  coverTitle: 'Farewell & Thank You',
  coverSubtitle: 'For everything you brought to the team',
  icon: 'Briefcase',
  assetFolder: 'farewell-retirement',
  assetPrefix: 'farewell',
  style: 'Premium A4 farewell cover',
  accent: '#7c3aed',
  soft: '#f5f0ff',
});

export const RETIREMENT_PRIORITY_DESIGNS = createDesignCollection({
  occasion: 'retirement',
  idPrefix: 'retirement-featured',
  namePrefix: 'Retirement Chapter',
  coverTitle: 'The Best Is Yet To Come',
  coverSubtitle: 'Celebrating a remarkable career and a new beginning',
  icon: 'Sun',
  assetFolder: 'farewell-retirement',
  assetPrefix: 'farewell',
  style: 'Premium A4 retirement cover',
  accent: '#b7791f',
  soft: '#fffaf0',
});

export const PRIORITY_CARD_DESIGNS = [
  ...BIRTHDAY_PRIORITY_DESIGNS,
  ...FAREWELL_PRIORITY_DESIGNS,
  ...RETIREMENT_PRIORITY_DESIGNS,
];

export const createPriorityCardUrl = (occasion, designId) =>
  `/card/customize?occasion=${encodeURIComponent(occasion)}&design=${encodeURIComponent(designId)}&layout=album&source=priority-gallery`;
