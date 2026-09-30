import { useState, useRef, useEffect } from 'react';

// Curated emoji set, grouped by category. Celebration-first since this is
// used on a group-card signing page.
const CATEGORIES = [
  {
    id: 'celebrate',
    label: 'Celebrate',
    icon: '🎉',
    emojis: ['🎉','🎊','🥳','🎂','🎁','🍰','🧁','🎈','✨','🌟','⭐','🎇','🎆','🍾','🥂','🍻','🍷','🎵','🎶','🪅','🎀','🏆','🥇','🙌'],
  },
  {
    id: 'love',
    label: 'Love',
    icon: '❤️',
    emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💖','💗','💓','💞','💕','💘','💝','😍','🥰','😘','💋','😻','💑','💐','🌹'],
  },
  {
    id: 'smileys',
    label: 'Smiles',
    icon: '😀',
    emojis: ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😋','😛','🤩','🥳','😎','🤗','🤭','😏','😴','🤤'],
  },
  {
    id: 'gestures',
    label: 'Gestures',
    icon: '👏',
    emojis: ['👏','🙌','👍','👌','🤝','🙏','💪','✌️','🤞','🤟','🫶','👊','✊','🤛','🤜','👋','🤙','💃','🕺','🥂','🍾','🎤','🎸','🎯'],
  },
  {
    id: 'nature',
    label: 'Nature',
    icon: '🌸',
    emojis: ['🌸','🌼','🌻','🌷','🌹','🌺','🍀','🌈','☀️','🌙','⭐','🔥','💫','🌊','🦋','🐝','🐶','🐱','🦄','🌍','🌳','🍃','🌿','🌱'],
  },
  {
    id: 'food',
    label: 'Food',
    icon: '🍕',
    emojis: ['🍕','🍔','🍟','🌮','🍣','🍩','🍪','🍫','🍿','🍉','🍓','🍇','🍪','🥐','🥞','🧇','🍦','🍨','🍮','🍭','☕','🧋','🍹','🥤'],
  },
];

const EmojiPicker = ({ onSelect, onClose }) => {
  const [activeCat, setActiveCat] = useState(CATEGORIES[0].id);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose?.(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const cat = CATEGORIES.find(c => c.id === activeCat) || CATEGORIES[0];

  return (
    <div ref={ref}
      className="absolute z-30 mt-2 w-full sm:w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl border-2 border-purple-100 shadow-xl overflow-hidden"
      style={{ left: 0 }}>
      <div className="flex gap-1 p-2 border-b border-purple-50 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {CATEGORIES.map(c => (
          <button key={c.id} type="button" onClick={() => setActiveCat(c.id)}
            className={`flex-shrink-0 px-2.5 py-1.5 rounded-xl text-sm transition-all ${activeCat === c.id ? 'bg-primary-100' : 'hover:bg-purple-50'}`}
            title={c.label}>
            {c.icon}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-8 gap-1 p-2 max-h-48 overflow-y-auto">
        {cat.emojis.map((e, i) => (
          <button key={i} type="button" onClick={() => onSelect(e)}
            className="text-2xl rounded-lg p-1 hover:bg-purple-50 transition-colors leading-none">
            {e}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmojiPicker;
