const OCCASION_BLUEPRINTS = [
  { id: 'birthday', label: 'Birthday', icon: 'Cake', title: 'Happy Birthday', subtitle: 'A brilliant year starts here' },
  { id: 'valentine', label: "Valentine's", icon: 'Heart', title: 'With All My Love', subtitle: 'For my favourite person' },
  { id: 'anniversary', label: 'Anniversary', icon: 'Gift', title: 'Still Choosing You', subtitle: 'Here is to every chapter together' },
  { id: 'wedding', label: 'Wedding', icon: 'Diamond', title: 'A Beautiful Beginning', subtitle: 'Two stories become one' },
  { id: 'baby_shower', label: 'Baby shower', icon: 'Baby', title: 'A Little Joy Is Coming', subtitle: 'Tiny moments, enormous love' },
  { id: 'retirement', label: 'Retirement', icon: 'Sun', title: 'The Best Is Yet To Come', subtitle: 'A new pace and a world of possibility' },
  { id: 'congratulations', label: 'Congratulations', icon: 'PartyPopper', title: 'You Did It', subtitle: 'This moment deserves a celebration' },
  { id: 'graduation', label: 'Graduation', icon: 'GraduationCap', title: 'The Future Is Yours', subtitle: 'Proud of how far you have come' },
  { id: 'promotion', label: 'Promotion', icon: 'TrendingUp', title: 'Onwards And Upwards', subtitle: 'A bigger role for a brilliant person' },
  { id: 'christmas', label: 'Christmas', icon: 'Snowflake', title: 'Merry Everything', subtitle: 'Warm wishes from all of us' },
  { id: 'get_well', label: 'Get well', icon: 'HeartPulse', title: 'Sending Brighter Days', subtitle: 'Rest, recover, and feel the love' },
  { id: 'new_year', label: 'New Year', icon: 'Star', title: 'A Fresh Chapter', subtitle: 'Here is to everything ahead' },
  { id: 'thank_you', label: 'Thank you', icon: 'Heart', title: 'A Very Big Thank You', subtitle: 'For the difference you make' },
  { id: 'sympathy', label: 'Sympathy', icon: 'Flower', title: 'Thinking Of You', subtitle: 'With care, comfort, and love' },
  { id: 'good_luck', label: 'Good luck', icon: 'Sparkles', title: 'Go Be Amazing', subtitle: 'All the best for what comes next' },
];

const VISUAL_STYLES = [
  {
    key: 'editorial',
    name: 'Modern Editorial',
    background: 'linear-gradient(155deg, #fffdf8 0%, #f8efe4 58%, #dbeafe 100%)',
    ink: '#102a43',
    accent: '#d97706',
    soft: '#fffdf8',
    art: 'sunburst',
    palette: ['#102a43', '#d97706', '#0f766e', '#be123c', '#7c3aed'],
  },
  {
    key: 'paper',
    name: 'Cut Paper',
    background: 'linear-gradient(145deg, #eef7f2 0%, #ffffff 46%, #ffe4e6 100%)',
    ink: '#16332d',
    accent: '#db4b5f',
    soft: '#f4fbf7',
    art: 'leaves',
    palette: ['#16332d', '#db4b5f', '#2563eb', '#ca8a04', '#6d28d9'],
  },
  {
    key: 'night',
    name: 'After Dark',
    background: 'linear-gradient(150deg, #071b2d 0%, #123a4a 54%, #3b234f 100%)',
    ink: '#fffaf0',
    accent: '#f6c453',
    soft: '#0d2638',
    art: 'stars',
    dark: true,
    palette: ['#071b2d', '#123a4a', '#3b234f', '#7f1d1d', '#14532d'],
  },
];

export const OCCASION_FILTERS = [
  { id: 'all', label: 'All designs', icon: 'LayoutGrid' },
  { id: 'leaving', label: 'Leaving', icon: 'Briefcase' },
  ...OCCASION_BLUEPRINTS.map(({ id, label, icon }) => ({ id, label, icon })),
];

export const OCCASION_CARD_DESIGNS = OCCASION_BLUEPRINTS.flatMap((occasion, occasionIndex) =>
  VISUAL_STYLES.map((visual, visualIndex) => ({
    id: `${occasion.id}-${visual.key}`,
    occasion: occasion.id,
    name: `${occasion.label} ${visual.name}`,
    coverTitle: occasion.title,
    coverSubtitle: occasion.subtitle,
    icon: occasion.icon,
    background: visual.background,
    ink: visual.ink,
    accent: visual.accent,
    soft: visual.soft,
    art: visual.art,
    dark: visual.dark,
    palette: visual.palette,
    badge: visualIndex === 0 ? (occasionIndex % 2 ? 'New' : 'Popular') : null,
  }))
);

export const getOccasionLabel = occasionId =>
  OCCASION_FILTERS.find(occasion => occasion.id === occasionId)?.label || 'Special occasion';
