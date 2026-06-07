export const CARD_DESIGNS = [
  {
    id: 'rose_love',
    name: 'Rose Romance',
    icon: '\uD83C\uDF39',
    background: 'linear-gradient(145deg, #fff1f5 0%, #fce7f3 45%, #ede9fe 100%)',
    ink: '#831843',
    accent: '#e11d48',
    soft: '#fff1f2',
    art: 'petals',
  },
  {
    id: 'starry_night',
    name: 'Celestial Night',
    icon: '\u2728',
    background: 'linear-gradient(145deg, #17133c 0%, #312e81 48%, #701a75 100%)',
    ink: '#ffffff',
    accent: '#fbbf24',
    soft: '#312e81',
    art: 'stars',
    dark: true,
  },
  {
    id: 'garden_bloom',
    name: 'Botanical Bloom',
    icon: '\uD83C\uDF3A',
    background: 'linear-gradient(145deg, #ecfdf5 0%, #d1fae5 48%, #fef3c7 100%)',
    ink: '#14532d',
    accent: '#059669',
    soft: '#ecfdf5',
    art: 'leaves',
  },
  {
    id: 'golden_glow',
    name: 'Golden Jubilee',
    icon: '\uD83D\uDC51',
    background: 'linear-gradient(145deg, #fffbeb 0%, #fef3c7 45%, #fed7aa 100%)',
    ink: '#78350f',
    accent: '#d97706',
    soft: '#fffbeb',
    art: 'sunburst',
  },
  {
    id: 'warm_ember',
    name: 'Tropical Joy',
    icon: '\uD83C\uDF08',
    background: 'linear-gradient(145deg, #fff7ed 0%, #fecdd3 48%, #ddd6fe 100%)',
    ink: '#7c2d12',
    accent: '#f97316',
    soft: '#fff7ed',
    art: 'waves',
  },
  {
    id: 'midnight_blue',
    name: 'Royal Azure',
    icon: '\uD83D\uDC8E',
    background: 'linear-gradient(145deg, #eff6ff 0%, #dbeafe 45%, #cffafe 100%)',
    ink: '#1e3a8a',
    accent: '#2563eb',
    soft: '#eff6ff',
    art: 'facets',
  },
  {
    id: 'fresh_garden',
    name: 'Emerald Luxe',
    icon: '\uD83C\uDF3F',
    background: 'linear-gradient(145deg, #052e2b 0%, #065f46 52%, #14532d 100%)',
    ink: '#ffffff',
    accent: '#facc15',
    soft: '#064e3b',
    art: 'arches',
    dark: true,
  },
  {
    id: 'minimal_chic',
    name: 'Modern Confetti',
    icon: '\uD83C\uDF89',
    background: 'linear-gradient(145deg, #fafafa 0%, #f5f3ff 52%, #fdf2f8 100%)',
    ink: '#27272a',
    accent: '#7c3aed',
    soft: '#fafafa',
    art: 'confetti',
  },
];

export const FONT_STYLES = [
  { id: 'elegant', name: 'Elegant Serif', family: "'Fraunces', Georgia, serif" },
  { id: 'calligraphy', name: 'Calligraphy', family: "'Great Vibes', cursive" },
  { id: 'handwritten', name: 'Handwritten', family: "'Caveat', cursive" },
  { id: 'classic', name: 'Classic Script', family: "'Cormorant Garamond', Georgia, serif" },
  { id: 'modern', name: 'Modern', family: "'Plus Jakarta Sans', sans-serif" },
];

export const getCardDesign = id =>
  CARD_DESIGNS.find(design => design.id === id) || CARD_DESIGNS[0];

export const getFontStyle = id =>
  FONT_STYLES.find(font => font.id === id) || FONT_STYLES[0];

export const cardArtClass = design => `card-art card-art-${design.art}`;
