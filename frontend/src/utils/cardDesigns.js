import { LEAVING_CARD_DESIGNS } from './leavingCardDesigns';
import { OCCASION_CARD_DESIGNS } from './occasionCardDesigns';

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
  {
    id: 'cherry_blossom', name: 'Cherry Blossom', icon: '🌸',
    background: 'linear-gradient(145deg, #fff0f6 0%, #ffd6e7 45%, #ffeaa7 100%)',
    ink: '#831843', accent: '#f472b6', soft: '#fff0f6', art: 'petals',
  },
  {
    id: 'ocean_breeze', name: 'Ocean Breeze', icon: '🌊',
    background: 'linear-gradient(145deg, #e0f7fa 0%, #b2ebf2 45%, #e8f5e9 100%)',
    ink: '#004d61', accent: '#0097a7', soft: '#e0f7fa', art: 'waves',
  },
  {
    id: 'sunset_vibes', name: 'Sunset Vibes', icon: '🌅',
    background: 'linear-gradient(145deg, #fff3e0 0%, #ffe0b2 35%, #ffccbc 65%, #f8bbd0 100%)',
    ink: '#4a1942', accent: '#e64a19', soft: '#fff3e0', art: 'sunburst',
  },
  {
    id: 'lavender_dream', name: 'Lavender Dream', icon: '💜',
    background: 'linear-gradient(145deg, #f3e5f5 0%, #e1bee7 45%, #d1c4e9 100%)',
    ink: '#4a148c', accent: '#8e24aa', soft: '#f3e5f5', art: 'stars',
  },
  {
    id: 'neon_party', name: 'Neon Party', icon: '🎊',
    background: 'linear-gradient(145deg, #1a0533 0%, #2d0052 45%, #0d002b 100%)',
    ink: '#ffffff', accent: '#e040fb', soft: '#2d0052', art: 'confetti', dark: true,
  },
  {
    id: 'mint_freshness', name: 'Mint Freshness', icon: '🌿',
    background: 'linear-gradient(145deg, #e8f5e9 0%, #c8e6c9 45%, #dcedc8 100%)',
    ink: '#1b5e20', accent: '#43a047', soft: '#e8f5e9', art: 'leaves',
  },
  {
    id: 'rose_gold', name: 'Rose Gold', icon: '✨',
    background: 'linear-gradient(145deg, #fff8f5 0%, #fdddd3 45%, #f8c8b8 100%)',
    ink: '#5d1e1e', accent: '#c2715a', soft: '#fff8f5', art: 'petals',
  },
  {
    id: 'cosmic_joy', name: 'Cosmic Joy', icon: '🌌',
    background: 'linear-gradient(145deg, #0d0221 0%, #1a0533 45%, #2d1050 100%)',
    ink: '#ffffff', accent: '#7c4dff', soft: '#1a0533', art: 'stars', dark: true,
  },
  {
    id: 'tropical_paradise', name: 'Tropical Paradise', icon: '🌺',
    background: 'linear-gradient(145deg, #fff9c4 0%, #fff176 30%, #a5d6a7 65%, #80cbc4 100%)',
    ink: '#1a4734', accent: '#00897b', soft: '#fff9c4', art: 'leaves',
  },
  ...OCCASION_CARD_DESIGNS,
  ...LEAVING_CARD_DESIGNS.map(design => ({
    id: design.id,
    occasion: 'leaving',
    name: design.name,
    icon: '\uD83D\uDCBC',
    background: `linear-gradient(180deg, rgba(255,255,255,0.04), rgba(15,23,42,0.08)), url("${design.image}") center/cover no-repeat`,
    ink: '#111827',
    accent: '#7c3aed',
    soft: '#f5f0ff',
    art: 'confetti',
    image: design.image,
    palette: ['#102a43', '#7c3aed', '#0f766e', '#be123c', '#ca8a04'],
  })),
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
