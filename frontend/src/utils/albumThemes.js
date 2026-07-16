export const ALBUM_THEMES = [
  {
    id: 'cover_blur',
    name: 'Cover blur',
    description: 'Echoes the selected artwork',
    stage: '#dce7df',
    page: '#fffdf8',
    ink: '#1f2937',
  },
  {
    id: 'soft_linen',
    name: 'Soft linen',
    description: 'Calm and warm',
    stage: '#e9e3d8',
    page: '#fffdf8',
    ink: '#293241',
  },
  {
    id: 'garden',
    name: 'Garden',
    description: 'Fresh sage and paper',
    stage: '#b9c8ba',
    page: '#f9fbf6',
    ink: '#17352c',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Dark, focused and elegant',
    stage: '#142033',
    page: '#f8f4eb',
    ink: '#172033',
  },
  {
    id: 'celebration',
    name: 'Celebration',
    description: 'Warm coral energy',
    stage: '#d9a79b',
    page: '#fffaf5',
    ink: '#3b2630',
  },
];

export const getAlbumTheme = id =>
  ALBUM_THEMES.find(theme => theme.id === id) || ALBUM_THEMES[0];

const expandHex = hex => {
  const value = hex.replace('#', '');
  return value.length === 3
    ? value.split('').map(character => character + character).join('')
    : value.slice(0, 6);
};

export const getContrastTextColor = (backgroundColor, design) => {
  if (!backgroundColor?.startsWith('#')) return design?.dark ? '#ffffff' : (design?.ink || '#172033');
  const value = expandHex(backgroundColor);
  if (!/^[0-9a-f]{6}$/i.test(value)) return design?.dark ? '#ffffff' : (design?.ink || '#172033');

  const channels = [0, 2, 4].map(index => parseInt(value.slice(index, index + 2), 16) / 255);
  const linear = channels.map(channel => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  const luminance = (0.2126 * linear[0]) + (0.7152 * linear[1]) + (0.0722 * linear[2]);
  return luminance > 0.48 ? '#172033' : '#ffffff';
};
