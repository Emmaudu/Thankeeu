// Occasion → emoji. Card designs store `icon` either as an emoji (older
// presets) or as an icon NAME like "Cake" (newer artwork designs) — printing
// the name showed the word "Cake" on the signing page. Always render this.
const OCCASION_EMOJI = {
  birthday: '🎂', valentine: '💝', leaving: '👋', farewell: '👋', anniversary: '💍',
  wedding: '💒', baby_shower: '👶', retirement: '🏖️', congratulations: '🎉',
  graduation: '🎓', promotion: '🌟', christmas: '🎄', get_well: '🌷', new_year: '✨',
  thank_you: '🙏', sympathy: '🕊️', good_luck: '🍀', pet_loss: '🐾', work_anniversary: '🏆',
  new_hire: '👋', womens_day: '👩', mens_day: '👨', mothers_day: '🌹', fathers_day: '👔',
  other: '💌',
};

const isEmoji = (s) => typeof s === 'string' && s.length > 0 && !/^[A-Za-z][A-Za-z0-9 ]*$/.test(s);

/** Emoji for a card: the occasion's emoji, else an emoji icon on the design. */
export const occasionEmoji = (occasion, design) =>
  OCCASION_EMOJI[occasion] || (isEmoji(design?.icon) ? design.icon : '💌');

export default occasionEmoji;
