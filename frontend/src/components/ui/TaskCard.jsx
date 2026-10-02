import { prefixOf, formatMoney } from '../../utils/market';
import { Link } from 'react-router-dom';
import { taskPrice, naira } from '../../utils/taskPrice';
import { MapPin, Clock, Users, ArrowRight, Truck, ShoppingBag, Navigation, Briefcase, Wrench } from 'lucide-react';
import { formatDistanceToNow, isPast, differenceInHours, isValid } from 'date-fns';

// Each task type gets its own colour + icon so the grid is easy to scan.
const TYPES = {
  pickup_delivery: { label: 'Pickup & Delivery', Icon: Truck,       fg: '#1d4ed8', bg: '#eff6ff', bar: '#3b82f6' },
  location_only:   { label: 'On-Location',       Icon: Navigation,  fg: '#047857', bg: '#ecfdf5', bar: '#10b981' },
  purchase_ship:   { label: 'Purchase & Ship',   Icon: ShoppingBag, fg: '#7c3aed', bg: '#f5f3ff', bar: '#8b5cf6' },
  general:         { label: 'General Task',      Icon: Briefcase,   fg: '#be123c', bg: '#fff1f2', bar: '#ff2d62' },
};

const STATUS = {
  open:      { label: 'Open',        fg: '#065f46', bg: '#d1fae5' },
  bidding:   { label: 'Bidding',     fg: '#92400e', bg: '#fef3c7' },
  ongoing:   { label: 'In progress', fg: '#1e40af', bg: '#dbeafe' },
  completed: { label: 'Completed',   fg: '#374151', bg: '#e5e7eb' },
  cancelled: { label: 'Cancelled',   fg: '#991b1b', bg: '#fee2e2' },
};


function budgetText(task) {
  const n = taskPrice(task); // one total: workmanship + transport + waybill + items
  if (!n) return null;
  return task.currency ? formatMoney(n, task.currency) : naira(n);
}

function deadlineInfo(raw) {
  const d = raw ? new Date(raw) : null;
  if (!d || !isValid(d)) return { text: 'Flexible deadline', fg: '#374151', bg: '#f3f4f6' };
  if (isPast(d)) return { text: 'Deadline passed', fg: '#991b1b', bg: '#fee2e2' };
  const hours = differenceInHours(d, new Date());
  const text = `Due ${formatDistanceToNow(d, { addSuffix: true })}`;
  if (hours < 24) return { text, fg: '#9a3412', bg: '#ffedd5' };       // urgent
  return { text, fg: '#065f46', bg: '#ecfdf5' };
}

const Chip = ({ children, fg, bg, title }) => (
  <span title={title} className="inline-flex items-center gap-1.5 text-[13px] font-semibold rounded-lg px-2.5 py-1 leading-tight"
    style={{ color: fg, background: bg }}>
    {children}
  </span>
);

export default function TaskCard({ task }) {
  const type = TYPES[task.task_type] || TYPES.general;
  const status = STATUS[task.status] || STATUS.open;
  const due = deadlineInfo(task.deadline);
  const budget = budgetText(task);
  const bidCount = Number(task.bids?.[0]?.count) || 0;
  const place = task.is_remote ? 'Remote (online)' : task.from_city && task.to_city
    ? `${task.from_city} → ${task.to_city}`
    : [task.task_city, task.task_state].filter(Boolean).join(', ');
  const requesterName = task.requester?.full_name
    || (task.requester?.username ? `@${task.requester.username}` : null);
  const TypeIcon = type.Icon;

  return (
    <Link to={`${prefixOf(task.country || 'NG')}/tasks/${task.id}`}
      aria-label={`${task.title}${budget ? `, ${budget}` : ''}${place ? `, ${place}` : ''}. View details`}
      className="group relative flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:border-rose-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-300">
      {/* colour bar by task type */}
      <div aria-hidden="true" style={{ height: 5, background: type.bar }} />

      <div className="flex flex-col flex-1 p-5 gap-4">
        {/* type + status */}
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2 text-[13px] font-bold rounded-full pl-1.5 pr-3 py-1" style={{ color: type.fg, background: type.bg }}>
            <span className="w-6 h-6 rounded-full flex items-center justify-center bg-white shadow-sm">
              <TypeIcon size={14} strokeWidth={2.5} />
            </span>
            {type.label}
          </span>
          <span className="text-xs font-extrabold uppercase tracking-wide rounded-full px-2.5 py-1" style={{ color: status.fg, background: status.bg }}>
            {status.label}
          </span>
        </div>

        {/* title + budget */}
        <div>
          <h3 title={task.title}
            className="font-heading font-extrabold text-[19px] leading-snug text-gray-900 line-clamp-2 group-hover:text-rose-600 transition-colors">
            {task.title}
          </h3>
          <p className={budget ? 'mt-1.5 font-black text-2xl tracking-tight' : 'mt-1.5 font-bold text-base'}
            style={{ color: budget ? '#e11d48' : '#6b7280' }}>
            {budget || 'Open to offers'}
          </p>
        </div>

        {/* description */}
        {task.description && (
          <p className="text-[15px] leading-relaxed text-gray-700 line-clamp-3">{task.description}</p>
        )}

        {/* key facts */}
        <div className="flex flex-wrap gap-2">
          {place && (
            <Chip fg="#1f2937" bg="#f3f4f6" title="Location">
              <MapPin size={14} className="text-rose-500" /> {place}
            </Chip>
          )}
          <Chip fg={due.fg} bg={due.bg} title="Deadline">
            <Clock size={14} /> {due.text}
          </Chip>
          <Chip fg="#374151" bg="#f3f4f6" title="Bids so far">
            <Users size={14} /> {bidCount === 0 ? 'No bids yet. Be first' : `${bidCount} bid${bidCount === 1 ? '' : 's'}`}
          </Chip>
          {task.is_equipment_required && (
            <Chip fg="#92400e" bg="#fef3c7" title="Equipment">
              <Wrench size={14} /> Equipment needed
            </Chip>
          )}
        </div>

        {/* footer */}
        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {task.requester ? (
              <>
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-white text-sm font-bold" style={{ background: 'var(--primary, #ff2d62)' }}>
                  {task.requester.avatar_url
                    ? <img src={task.requester.avatar_url} alt="" className="w-full h-full object-cover" />
                    : (requesterName || 'R').replace('@', '')[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wide font-semibold text-gray-400 leading-none">Posted by</p>
                  <p className="text-sm font-bold text-gray-800 truncate">{requesterName || 'Requester'}</p>
                </div>
              </>
            ) : <span />}
          </div>
          <span className="inline-flex items-center gap-1.5 flex-shrink-0 rounded-xl px-3.5 py-2 text-sm font-bold text-white transition-all group-hover:gap-2.5"
            style={{ background: 'var(--primary, #ff2d62)' }}>
            View task <ArrowRight size={15} strokeWidth={2.5} />
          </span>
        </div>
      </div>
    </Link>
  );
}
