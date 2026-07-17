import { useState, useEffect, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import Icon from './ui/Icon';

/**
 * NotificationBell — drop-in bell icon for any layout.
 * fetchFn: async fn that returns [] of {id,type,title,body,data,is_read,created_at}
 * markReadFn: async fn to mark all as read
 */
const NotificationBell = ({ fetchFn, markReadFn, linkResolver }) => {
  const [notifs,  setNotifs]  = useState([]);
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  const unread = notifs.filter(n => !n.is_read).length;

  const load = async () => {
    setLoading(true);
    try { const r = await fetchFn(); setNotifs(r.data || []); }
    catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // Poll every 45 seconds
  useEffect(() => {
    const id = setInterval(load, 45000);
    return () => clearInterval(id);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = async () => {
    setOpen(o => !o);
    if (!open && unread > 0) {
      try { await markReadFn(); setNotifs(prev => prev.map(n => ({ ...n, is_read: true }))); }
      catch {}
    }
  };

  const typeIcon = (type) => ({
    sign_card:         'PenLine',
    card_approved:     'CheckCircle',
    deduction_approved:'Banknote',
    gift_ready:        'Gift',
    reminder:          'Bell',
    welcome:           'PartyPopper',
    withdrawal:        'Wallet',
    card_approval:     'Building2',
  }[type] || 'Bell');

  return (
    <div className="relative" ref={panelRef}>
      <button type="button" onClick={handleOpen} aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-colors hover:bg-primary-50"
        style={{ color: '#5B4BDF' }}>
        <Icon name="Bell" size={20} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none min-w-[18px] min-h-[18px] px-0.5">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-purple-100 z-[70] animate-fade-in overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-purple-50">
            <p className="font-semibold text-warm-900 text-sm">Notifications {unread > 0 && <span className="ml-1 text-xs bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full font-bold">{unread}</span>}</p>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close notifications" className="flex h-8 w-8 items-center justify-center rounded-full text-warm-400 hover:bg-purple-50 hover:text-warm-700"><Icon name="X" size={15} /></button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading && notifs.length === 0 ? (
              <div className="p-4 space-y-2">{[...Array(3)].map((_,i) => <div key={i} className="h-12 rounded-xl animate-pulse bg-purple-50"/>)}</div>
            ) : notifs.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-500"><Icon name="Bell" size={23} /></div>
                <p className="text-sm text-warm-400">No notifications yet</p>
              </div>
            ) : notifs.map(n => {
              const href = n.data?.card_slug ? `/card/${n.data.card_slug}` : null;
              const Inner = (
                <div className={`flex items-start gap-3 px-4 py-3 border-b border-purple-50 transition-colors hover:bg-purple-50 ${!n.is_read ? 'bg-primary-50/40' : ''}`}>
                  <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600"><Icon name={typeIcon(n.type)} size={16} /></span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-tight truncate ${!n.is_read ? 'font-semibold text-warm-900' : 'font-medium text-warm-700'}`}>{n.title}</p>
                    {n.body && <p className="text-xs text-warm-500 mt-0.5 line-clamp-2">{n.body}</p>}
                    <p className="text-xs text-warm-300 mt-1">{n.created_at ? format(parseISO(n.created_at), 'MMM d · h:mm a') : ''}</p>
                  </div>
                  {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-2"/>}
                </div>
              );
              return href
                ? <a key={n.id} href={href} onClick={() => setOpen(false)}>{Inner}</a>
                : <div key={n.id}>{Inner}</div>;
            })}
          </div>
          {notifs.length > 0 && (
            <div className="px-4 py-2.5 border-t border-purple-50 text-center">
              <button type="button" onClick={load} className="inline-flex items-center gap-1.5 text-xs text-primary-500 font-semibold hover:text-primary-700"><Icon name="Refresh" size={12} />Refresh</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
