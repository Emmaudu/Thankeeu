import { readableTextColor } from './textContrast';

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

/**
 * Pick a text colour that is actually readable on the cover.
 *
 * `backgroundColor` is the creator's cover choice: a hex, an image URL, or
 * empty (meaning "use the design preset's own background"). Previously, when
 * it wasn't a hex we trusted `design.dark` — but several presets declare
 * `dark: true` while painting an opaque pale gradient over their photo, which
 * produced white-on-white headings. We now measure the surface we will really
 * paint, and never return an unreadable colour.
 */
export const getContrastTextColor = (backgroundColor, design) => {
  const backdrop = backgroundColor?.startsWith('#')
    ? backgroundColor
    : (backgroundColor && /^https?:\/\//.test(backgroundColor)
        // CardView paints a dark scrim over remote cover photos.
        ? `linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.45)), url("${backgroundColor}")`
        : (design?.background || design?.soft || '#ffffff'));

  return readableTextColor('auto', backdrop, {
    ink: design?.ink,
    fallback: design?.soft || '#ffffff',
    large: true,
  });
};

/** Readability for an album theme's stage / page surfaces. */
export const getAlbumInk = (theme, surface = 'stage') => {
  const bg = theme?.[surface] || '#ffffff';
  return readableTextColor(theme?.ink, bg, { ink: theme?.ink, fallback: bg });
};
