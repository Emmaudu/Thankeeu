/**
 * Switch — one correctly-proportioned toggle, used everywhere.
 *
 * The hand-rolled copies of this control positioned the knob with
 * `absolute` and no `left`, so it sat flush against the track's left edge and
 * ran within 4px of the right one. At small sizes that reads as the knob
 * escaping the pill, which is what it looked like on the gift toggle.
 *
 * The geometry here is explicit: TRACK 36x20, KNOB 16, 2px inset on every
 * side, so the travel is 36 - 16 - 2 - 2 = 16px and the knob is inset by the
 * same 2px whether it is on or off.
 */
const TRACK_W = 36;
const TRACK_H = 20;
const KNOB = 16;
const INSET = 2;
const TRAVEL = TRACK_W - KNOB - INSET * 2;

const Switch = ({ on, onColor = '#F59E0B', offColor = '#D1D5DB', className = '' }) => (
  <span
    className={`relative inline-block flex-shrink-0 rounded-full transition-colors duration-200 ${className}`}
    style={{
      width: TRACK_W,
      height: TRACK_H,
      background: on ? onColor : offColor,
      // The knob is inset, so nothing can visually breach the track edge.
      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)',
    }}
    aria-hidden="true"
  >
    <span
      className="absolute rounded-full bg-white transition-transform duration-200"
      style={{
        width: KNOB,
        height: KNOB,
        top: INSET,
        left: INSET,
        transform: `translateX(${on ? TRAVEL : 0}px)`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.28)',
      }}
    />
  </span>
);

export default Switch;
