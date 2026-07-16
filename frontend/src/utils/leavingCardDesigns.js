export const LEAVING_CARD_DESIGNS = [
  { id: 'so-long-best', name: 'So Long, Good Luck', style: 'Cheerful farewell', image: '/cards/leaving/leave-card-01.png', badge: 'Popular' },
  { id: 'farewell-elegant', name: 'Elegant Farewell', style: 'Soft professional', image: '/cards/leaving/leave-card-02.png', badge: 'New' },
  { id: 'system-alert', name: 'System Alert', style: 'Tech team', image: '/cards/leaving/leave-card-03.png', badge: 'Funny' },
  { id: 'passwords', name: 'Password Legend', style: 'Office humour', image: '/cards/leaving/leave-card-04.png', badge: 'Funny' },
  { id: 'fresh-chapter', name: 'Fresh Chapter', style: 'Warm wishes', image: '/cards/leaving/leave-card-05.png', badge: 'Classic' },
  { id: 'mission-resignation', name: 'Mission Resignation', style: 'Bold cinematic', image: '/cards/leaving/leave-card-06.png', badge: 'Bold' },
  { id: 'goodbye-good-luck', name: 'Goodbye & Good Luck', style: 'Friendly', image: '/cards/leaving/leave-card-07.png', badge: 'Popular' },
  { id: 'adventure-good', name: 'Adventure Looks Good', style: 'Travel inspired', image: '/cards/leaving/leave-card-08.png', badge: 'Travel' },
  { id: 'captain-deadline', name: 'Captain Deadline', style: 'Hero send-off', image: '/cards/leaving/leave-card-09.png', badge: 'Premium' },
  { id: 'great-escape', name: 'The Great Escape', style: 'Office farewell', image: '/cards/leaving/leave-card-10.png', badge: 'Premium' },
  { id: 'achievement-unlocked', name: 'Achievement Unlocked', style: 'Pixel game', image: '/cards/leaving/leave-card-11.png', badge: 'Game' },
  { id: 'new-horizons', name: 'New Horizons', style: 'Calm send-off', image: '/cards/leaving/leave-card-12.png', badge: 'Serene' },
  { id: 'wonderful-things', name: 'On To Wonderful Things', style: 'Pastel modern', image: '/cards/leaving/leave-card-13.png', badge: 'New' },
  { id: 'valuable-asset', name: 'Valuable Asset', style: 'Finance team', image: '/cards/leaving/leave-card-14.png', badge: 'Corporate' },
  { id: 'farewell-legend', name: 'Farewell, Legend', style: 'Leadership', image: '/cards/leaving/leave-card-15.png', badge: 'Leadership' },
  { id: 'operational-emergency', name: 'Operational Emergency', style: 'Ops team', image: '/cards/leaving/leave-card-16.png', badge: 'Ops' },
  { id: 'thanks-for-ideas', name: 'Thanks for the Ideas', style: 'Creative team', image: '/cards/leaving/leave-card-17.png', badge: 'Creative' },
  { id: 'brilliant', name: 'Thanks for Being Brilliant', style: 'Team gratitude', image: '/cards/leaving/leave-card-19.png', badge: 'Warm' },
  { id: 'dream-big', name: 'Dream Big, Go Far', style: 'Bright future', image: '/cards/leaving/leave-card-20.png', badge: 'Bright' },
  { id: 'memories', name: 'Thank You for the Memories', style: 'Memory board', image: '/cards/leaving/leave-card-21.png', badge: 'Memory' },
  { id: 'off-adventures', name: 'Off to New Adventures', style: 'Balloon send-off', image: '/cards/leaving/leave-card-22.png', badge: 'Travel' },
  { id: 'new-chapter-awaits', name: 'A New Chapter Awaits', style: 'Bookshelf keepsake', image: '/cards/leaving/leave-card-23.png', badge: 'Keepsake' },
  { id: 'leaving-same', name: "You're Leaving", style: 'Office desk', image: '/cards/leaving/leave-card-24.png', badge: 'Classic' },
];

export const createLeavingCardUrl = (designId) =>
  `/card/new?occasion=leaving&design=${encodeURIComponent(designId)}&layout=album&source=leaving-gallery`;
