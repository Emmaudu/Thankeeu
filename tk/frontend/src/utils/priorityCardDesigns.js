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
  count = 20,
}) => Array.from({ length: count }, (_, index) => {
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

export const BABY_SHOWER_PRIORITY_DESIGNS = createDesignCollection({
  occasion: 'baby_shower',
  idPrefix: 'baby-shower-featured',
  namePrefix: 'Baby Shower Welcome',
  coverTitle: 'A Little Joy Is Coming',
  coverSubtitle: 'Tiny moments, enormous love',
  icon: 'Baby',
  assetFolder: 'baby-shower',
  assetPrefix: 'baby_shower',
  style: 'Premium A4 baby shower cover',
  accent: '#db2777',
  soft: '#fdf2f8',
  ink: '#831843',
  count: 5,
});

export const VALENTINE_PRIORITY_DESIGNS = createDesignCollection({
  occasion: 'valentine',
  idPrefix: 'valentine-featured',
  namePrefix: 'Valentine Love',
  coverTitle: 'With All My Love',
  coverSubtitle: 'For my favourite person',
  icon: 'Heart',
  assetFolder: 'valentine',
  assetPrefix: 'valentine',
  style: 'Premium A4 Valentine cover',
  accent: '#e11d48',
  soft: '#fff1f2',
  ink: '#881337',
  count: 5,
});

export const PET_LOSS_PRIORITY_DESIGNS = createDesignCollection({
  occasion: 'sympathy',
  idPrefix: 'pet-loss-featured',
  namePrefix: 'Pet Memorial',
  coverTitle: 'Forever In Our Hearts',
  coverSubtitle: 'Until we meet again',
  icon: 'Heart',
  assetFolder: 'pet-loss',
  assetPrefix: 'pet_loss',
  style: 'Premium A4 pet memorial cover',
  accent: '#7c3aed',
  soft: '#faf5ff',
  ink: '#4c1d95',
  count: 5,
});

export const LOVED_ONE_SPOUSE_SYMPATHY_PRIORITY_DESIGNS = createDesignCollection({
  occasion: 'sympathy',
  idPrefix: 'sympathy-featured',
  namePrefix: 'In Loving Memory',
  coverTitle: 'In Loving Memory',
  coverSubtitle: 'Always loved, never forgotten',
  icon: 'Flower',
  assetFolder: 'sympathy',
  assetPrefix: 'sympathy',
  style: 'Premium A4 sympathy cover',
  accent: '#6d5f8d',
  soft: '#f7f5fa',
  ink: '#3f3552',
  count: 5,
});

export const PRIORITY_CARD_DESIGNS = [
  ...BIRTHDAY_PRIORITY_DESIGNS,
  ...FAREWELL_PRIORITY_DESIGNS,
  ...RETIREMENT_PRIORITY_DESIGNS,
  ...BABY_SHOWER_PRIORITY_DESIGNS,
  ...VALENTINE_PRIORITY_DESIGNS,
  ...LOVED_ONE_SPOUSE_SYMPATHY_PRIORITY_DESIGNS,
  ...PET_LOSS_PRIORITY_DESIGNS,
];

export const createPriorityCardUrl = (occasion, designId) =>
  `/card/customize?occasion=${encodeURIComponent(occasion)}&design=${encodeURIComponent(designId)}&layout=album&source=priority-gallery`;
