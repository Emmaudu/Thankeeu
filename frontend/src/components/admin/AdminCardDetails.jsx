/**
 * AdminCardDetails — full-screen stats page for one card, opened from the
 * admin Cards list. Links, creator, schedule, payment, signers (with their
 * details), gifts and gift-pot total, gift claims, replies and a timeline of
 * everything that happened to the card.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { adminAPI, messagesAPI } from '../../utils/api';
import { formatNGN } from '../../utils/currency';

const fmt = (v, withTime = true) => {
  if (!v) return '—';
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}) });
};
// send_date is stored as the full UTC instant.
const deliveryLabel = (card) => {
  if (!card?.send_date) return 'Not scheduled';
  const d = new Date(card.send_date);
  if (isNaN(d.getTime())) return String(card.send_date);
  const tz = card.delivery_timezone;
  try {
    return d.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short', ...(tz ? { timeZone: tz } : {}) });
  } catch { return d.toLocaleString(); }
};

const TYPE_LABEL = { individual: 'Individual', company: 'Company (HR)', team_member: 'Team member', pal_group: 'Pals group', guest: 'Guest' };
const EVENT_ICON = { created: '🆕', claimed: '🔗', published: '🚀', paid: '💳', reminder: '📧', signed: '✍️', gift: '🎁', gift_pending: '⏳', reply: '💬', claim: '🏦', delivered: '📬', opened: '👀', redelivered: '🔁', log: '📝' };

// What a draft's signer had chosen to give (never charged).
const giftLabel = (d) => {
  const g = d.extra?.gift;
  if (g?.product?.name) return `${g.product.name}${g.product.vendor ? ` from ${g.product.vendor}` : ''}`;
  if (g?.display) return g.display;
  return Number(d.gift_intent) > 0 ? formatNGN(d.gift_intent) : '';
};

const Stat = ({ label, value, tone = '#7C3AED' }) => (
  <div className="rounded-2xl border border-purple-100 bg-white px-4 py-3">
    <p className="text-xl font-extrabold" style={{ color: tone }}>{value}</p>
    <p className="text-[11px] font-semibold uppercase tracking-wide text-warm-400">{label}</p>
  </div>
);

const Section = ({ title, count, children }) => (
  <section className="rounded-2xl border border-purple-100 bg-white">
    <div className="flex items-center justify-between border-b border-purple-50 px-4 py-3">
      <p className="text-sm font-extrabold text-warm-900">{title}</p>
      {count != null && <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-bold text-primary-700">{count}</span>}
    </div>
    <div className="p-4">{children}</div>
  </section>
);

export default function AdminCardDetails({ cardId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [draftBusy, setDraftBusy] = useState(null); // draft id being posted/removed
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    let alive = true;
    setLoading(true);
    adminAPI.getCardDetails(cardId)
      .then(r => { if (alive) setData(r.data); })
      .catch(e => toast.error(e.response?.data?.error || 'Could not load card details'))
      .finally(() => { if (alive) setLoading(false); });
    const onKey = (e) => { if (e.key === 'Escape') closeRef.current?.(); };
    window.addEventListener('keydown', onKey);
    return () => { alive = false; window.removeEventListener('keydown', onKey); };
  }, [cardId]);

  const origin = window.location.origin;
  const copy = (path, label) => { navigator.clipboard.writeText(`${origin}${path}`); toast.success(`${label} copied`); };

  const deleteSignature = async (m) => {
    if (!window.confirm(`Delete ${m.author_name || 'this signer'}'s signature?\n\nThey'll get an email letting them know it was removed, in case it's needed again.`)) return;
    setDeletingId(m.id);
    try {
      await messagesAPI.delete(m.id);
      setData(prev => {
        const messages = prev.messages.filter(x => x.id !== m.id);
        return {
          ...prev,
          messages,
          stats: {
            ...prev.stats,
            signers: messages.length,
            unique_signers: new Set(messages.map(x => (x.author_email || x.author_name || '').toLowerCase())).size,
            private_messages: messages.filter(x => x.is_private).length,
            media_messages: messages.filter(x => x.media_url || (Array.isArray(x.media_gallery) && x.media_gallery.length)).length,
          },
        };
      });
      toast.success('Signature deleted — the signer has been notified by email');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Could not delete this signature');
    } finally {
      setDeletingId(null);
    }
  };

  const reload = () => adminAPI.getCardDetails(cardId).then(r => setData(r.data)).catch(() => {});

  const signedEmails = useMemo(() => new Set((data?.messages || []).map(m => String(m.author_email || '').toLowerCase()).filter(Boolean)), [data]);
  const alreadySigned = (d) => !!d.author_email && signedEmails.has(String(d.author_email).toLowerCase());

  const postDraft = async (d) => {
    const who = d.author_name || d.author_email || 'this signer';
    if (alreadySigned(d) && !window.confirm(`${d.author_email} has already signed this card with a different message. Check the Signers list first.\n\nPost this draft as well?`)) return;
    const files = (d.media || []).length;
    const gift = giftLabel(d);
    const notes = [
      files ? `${files} attached file${files === 1 ? '' : 's'} will be posted with it.` : '',
      gift ? `They chose a gift (${gift}) but did not pay it, so no money is added. The email asks them to add it.` : '',
    ].filter(Boolean).join('\n');
    if (!window.confirm(`Post ${who}'s message to the card now?${notes ? `\n\n${notes}` : ''}\n\n${d.author_email ? `An email goes to ${d.author_email} saying their message is on the card. Check the address and the message look genuine first.` : 'No email address was given, so nobody is emailed.'}`)) return;
    setDraftBusy(d.id);
    try {
      const r = await adminAPI.postSignatureDraft(cardId, d.id);
      toast.success(r.data?.already_signed ? 'They had already signed with this message, so nothing new was posted' : 'Posted to the card');
      await reload();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Could not post this draft');
      if (e.response?.status === 409) reload();
    } finally { setDraftBusy(null); }
  };

  const discardDraft = async (d) => {
    if (!window.confirm(`Remove ${d.author_name || 'this'} draft? It will not be posted.`)) return;
    setDraftBusy(d.id);
    try {
      await adminAPI.discardSignatureDraft(cardId, d.id);
      setData(prev => ({ ...prev, drafts: (prev.drafts || []).filter(x => x.id !== d.id), stats: { ...prev.stats, drafts: Math.max(0, (prev.stats.drafts || 1) - 1) } }));
      toast.success('Draft removed');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Could not remove this draft');
      if (e.response?.status === 409) reload();
    } finally { setDraftBusy(null); }
  };

  const repliesByMessage = useMemo(() => {
    const m = {};
    for (const r of data?.replies || []) (m[r.message_id] = m[r.message_id] || []).push(r);
    return m;
  }, [data]);

  const signers = useMemo(() => {
    const list = data?.messages || [];
    const s = q.trim().toLowerCase();
    return s ? list.filter(m => `${m.author_name} ${m.author_email || ''} ${m.content || ''}`.toLowerCase().includes(s)) : list;
  }, [data, q]);

  const card = data?.card;
  const statusBadge = card && (
    card.status === 'sent' ? ['Delivered', '#059669', '#ECFDF5']
      : card.status === 'active' && card.payment_pending ? ['Live · awaiting payment', '#B45309', '#FFFBEB']
        : card.status === 'active' ? ['Live · paid', '#2563EB', '#EFF6FF']
          : [card.status, '#6B7280', '#F3F4F6']
  );

  return (
    <div className="fixed inset-0 z-[60] flex justify-end" role="dialog" aria-modal="true" aria-label="Card details">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative h-full w-full max-w-5xl overflow-y-auto bg-[#F8F6FF] shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-purple-100 bg-white/95 px-5 py-4 backdrop-blur">
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-primary-600">Card details</p>
            <h2 className="truncate text-lg font-extrabold text-warm-900">{card ? (card.title || `For ${card.recipient_name}`) : 'Loading…'}</h2>
            {statusBadge && (
              <span className="mt-1 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={{ color: statusBadge[1], background: statusBadge[2] }}>{statusBadge[0]}</span>
            )}
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-purple-100 bg-white px-3 py-2 text-sm font-bold text-warm-600" style={{ minHeight: 0 }}>Close ✕</button>
        </div>

        {loading && <div className="p-10 text-center text-warm-400">Loading…</div>}
        {!loading && !data && <div className="p-10 text-center text-warm-400">Could not load this card.</div>}

        {data && (
          <div className="space-y-4 p-5">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
              <Stat label="Signatures" value={data.stats.signers} />
              <Stat label="Unique signers" value={data.stats.unique_signers} />
              <Stat label="Gift pot" value={formatNGN(Math.max(data.stats.gift_total, data.stats.card_total_collected))} tone="#059669" />
              <Stat label="Gifts" value={data.stats.gifts_count} tone="#059669" />
              <Stat label="Replies" value={data.stats.replies} tone="#DB2777" />
              <Stat label="Visitors" value={data.stats.visitors} tone="#0891B2" />
              <Stat label="Drafts" value={data.stats.drafts || 0} tone="#B45309" />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Section title="Links">
                {[
                  ['Signing page', data.links.sign],
                  ['Card page', data.links.view],
                  ['Private recipient link', data.links.private_view],
                ].filter(([, p]) => p).map(([label, path]) => (
                  <div key={label} className="mb-2 flex items-center gap-2 last:mb-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-warm-500">{label}</p>
                      <a href={path} target="_blank" rel="noreferrer" className="block truncate text-xs font-semibold text-primary-700 underline">{origin}{path}</a>
                    </div>
                    <button type="button" onClick={() => copy(path, label)} className="rounded-lg border border-purple-100 px-2 py-1 text-[11px] font-bold text-primary-700" style={{ minHeight: 0 }}>Copy</button>
                  </div>
                ))}
              </Section>

              <Section title="Creator & recipient">
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
                  <dt className="text-warm-400">Creator</dt><dd className="font-semibold text-warm-800">{card.creator_name}</dd>
                  <dt className="text-warm-400">Type</dt><dd className="text-warm-700">{TYPE_LABEL[card.creator_type] || card.creator_type}{card.company_name ? ` · ${card.company_name}` : ''}</dd>
                  <dt className="text-warm-400">Creator email</dt><dd className="break-all text-warm-700">{card.creator_email ? <a className="underline" href={`mailto:${card.creator_email}`}>{card.creator_email}</a> : '—'}</dd>
                  <dt className="text-warm-400">Recipient</dt><dd className="font-semibold text-warm-800">{card.recipient_name}</dd>
                  <dt className="text-warm-400">Recipient email</dt><dd className="break-all text-warm-700">{card.recipient_email || '—'}</dd>
                  <dt className="text-warm-400">Occasion</dt><dd className="capitalize text-warm-700">{card.occasion === 'other' && card.custom_occasion ? card.custom_occasion : (card.occasion || '').replace(/_/g, ' ')}</dd>
                </dl>
              </Section>

              <Section title="Schedule & payment">
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
                  <dt className="text-warm-400">Created</dt><dd className="text-warm-800">{fmt(card.created_at)}</dd>
                  <dt className="text-warm-400">Scheduled delivery</dt><dd className="text-warm-800">{deliveryLabel(card)}</dd>
                  <dt className="text-warm-400">Recipient country</dt><dd className="text-warm-700">{card.recipient_country || '—'}{card.delivery_timezone ? ` · ${card.delivery_timezone}` : ''}</dd>
                  <dt className="text-warm-400">Signing deadline</dt><dd className="text-warm-800">{fmt(card.deadline)}</dd>
                  <dt className="text-warm-400">Delivered</dt><dd className="text-warm-800">{fmt(card.delivered_at)}</dd>
                  <dt className="text-warm-400">Opened by recipient</dt><dd className="text-warm-800">{fmt(card.opened_at)}</dd>
                  <dt className="text-warm-400">Card fee</dt><dd className="text-warm-800">{card.company_id ? 'Free (company)' : card.payment_pending ? '⏳ Not paid yet' : card.status === 'draft' ? 'Draft (not published)' : `Paid${card.fee_paid_at ? ` · ${fmt(card.fee_paid_at)}` : ''}`}</dd>
                  <dt className="text-warm-400">Payment reminders</dt><dd className="text-warm-700">{card.payment_reminder_count || 0}</dd>
                  <dt className="text-warm-400">Re-deliveries</dt><dd className="text-warm-700">{card.redelivery_count || 0}</dd>
                </dl>
              </Section>

              <Section title="Gifts" count={data.contributions.length}>
                <p className="mb-2 text-xs text-warm-500">
                  Pot total <strong className="text-emerald-700">{formatNGN(Math.max(data.stats.gift_total, data.stats.card_total_collected))}</strong>
                  {' '}· {data.stats.gifts_count} paid · {data.stats.pending_gifts} pending
                  {data.wallet?.disbursed ? ' · paid out' : ''}
                </p>
                {data.contributions.length === 0 ? <p className="text-xs text-warm-400">No gifts yet.</p> : (
                  <ul className="max-h-56 divide-y divide-purple-50 overflow-y-auto text-xs">
                    {data.contributions.map(c => (
                      <li key={c.id || c.flw_reference} className="flex items-center justify-between gap-2 py-1.5">
                        <span className="min-w-0 truncate"><strong className="text-warm-800">{c.contributor_name || 'Anonymous'}</strong> <span className="text-warm-400">{c.contributor_email}</span></span>
                        <span className="flex-shrink-0 text-right">
                          <strong className={c.status === 'success' ? 'text-emerald-700' : 'text-amber-600'}>{formatNGN(c.amount || 0)}</strong>
                          <span className="ml-1 text-warm-400">{c.status}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {data.claims.length > 0 && (
                  <div className="mt-3 border-t border-purple-50 pt-2">
                    <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-warm-400">Recipient claims</p>
                    {data.claims.map(g => (
                      <p key={g.id} className="text-xs text-warm-700">{fmt(g.created_at)} · {g.claim_type} · {formatNGN(g.amount || 0)} · <strong>{g.status}</strong></p>
                    ))}
                  </div>
                )}
              </Section>
            </div>

            <Section title="Signers" count={data.messages.length}>
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, email or message…"
                className="input mb-3 w-full py-2 text-sm" />
              {signers.length === 0 ? <p className="text-xs text-warm-400">No signatures{q ? ' match' : ' yet'}.</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="text-left text-[11px] uppercase tracking-wide text-warm-400">
                      <th className="py-1.5 pr-3">Signer</th><th className="py-1.5 pr-3">Message</th><th className="py-1.5 pr-3">Media</th><th className="py-1.5 pr-3">Gift</th><th className="py-1.5 pr-3">Signed</th><th className="py-1.5"></th>
                    </tr></thead>
                    <tbody className="divide-y divide-purple-50">
                      {signers.map(m => (
                        <tr key={m.id} className="align-top">
                          <td className="py-2 pr-3"><p className="font-bold text-warm-800">{m.author_name}</p><p className="break-all text-warm-400">{m.author_email || '—'}</p></td>
                          <td className="max-w-[320px] py-2 pr-3 text-warm-700">
                            {m.is_private && <span className="mr-1 rounded bg-warm-100 px-1 text-[10px] font-bold">🔒 private</span>}
                            <span className="line-clamp-3 whitespace-pre-wrap break-words">{m.content}</span>
                            {(repliesByMessage[m.id] || []).map(r => (
                              <p key={r.id} className="mt-1 rounded bg-purple-50 px-1.5 py-0.5 text-[11px] text-primary-700">↳ {r.author_name}: {r.content}</p>
                            ))}
                          </td>
                          <td className="py-2 pr-3 text-warm-500">
                            {m.media_url ? <a href={m.media_url} target="_blank" rel="noreferrer" className="underline">{m.media_type || 'file'}</a> : '—'}
                            {Array.isArray(m.media_gallery) && m.media_gallery.length > 1 ? ` +${m.media_gallery.length - 1}` : ''}
                          </td>
                          <td className="py-2 pr-3 font-bold text-emerald-700">{m.contributed_amount > 0 ? formatNGN(m.contributed_amount) : m.product_name || '—'}</td>
                          <td className="whitespace-nowrap py-2 pr-3 text-warm-500">{fmt(m.created_at)}</td>
                          <td className="whitespace-nowrap py-2">
                            <button type="button" onClick={() => deleteSignature(m)} disabled={deletingId === m.id}
                              title="Delete this signature — the signer will be emailed"
                              className="rounded-lg border border-rose-100 px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                              style={{ minHeight: 0 }}>
                              {deletingId === m.id ? '…' : 'Delete'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>

            <Section title="Signature drafts" count={(data.drafts || []).length}>
              <p className="mb-3 text-xs text-warm-500">
                People who started signing but left before their signature was submitted. Check the message, then press Post to add it to the card for them.
                Their text, name, email and attached files are kept and posted together. A gift they chose is shown here but was never paid, so it is not added to the pot.
              </p>
              {(data.drafts || []).length === 0 ? <p className="text-xs text-warm-400">No unfinished signatures.</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="text-left text-[11px] uppercase tracking-wide text-warm-400">
                      <th className="py-1.5 pr-3">Signer</th><th className="py-1.5 pr-3">Message</th><th className="py-1.5 pr-3">Files and gift</th><th className="py-1.5 pr-3">Last saved</th><th className="py-1.5"></th>
                    </tr></thead>
                    <tbody className="divide-y divide-purple-50">
                      {data.drafts.map(d => (
                        <tr key={d.id} className="align-top">
                          <td className="py-2 pr-3"><p className="font-bold text-warm-800">{d.author_name || 'No name given'}</p><p className="break-all text-warm-400">{d.author_email || 'No email'}</p>
                            {alreadySigned(d) && <span className="mt-1 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">Already signed this card</span>}</td>
                          <td className="max-w-[340px] py-2 pr-3 text-warm-700">
                            {d.is_private && <span className="mr-1 rounded bg-warm-100 px-1 text-[10px] font-bold">private</span>}
                            <span className="whitespace-pre-wrap break-words">{d.content || <em className="text-warm-400">No written message yet</em>}</span>
                          </td>
                          <td className="py-2 pr-3 text-warm-500">
                            {(d.media || []).length > 0 && (
                              <div className="mb-1 flex flex-wrap gap-1">
                                {d.media.map((m, i) => (
                                  m.type === 'image' || m.type === 'gif'
                                    ? <a key={i} href={m.url} target="_blank" rel="noreferrer"><img src={m.url} alt={m.name || 'Attached image'} className="h-10 w-10 rounded object-cover" /></a>
                                    : <a key={i} href={m.url} target="_blank" rel="noreferrer" className="rounded border border-purple-100 px-1.5 py-0.5 text-[11px] font-semibold text-primary-700 underline">{m.type === 'voice' ? 'Voice note' : 'Video'}</a>
                                ))}
                              </div>
                            )}
                            {d.has_media && !(d.media || []).length && <p className="text-[11px]">Files were attached but had not finished uploading</p>}
                            {giftLabel(d) && <p className="text-[11px] font-semibold text-amber-700">Chose a gift: {giftLabel(d)} (not paid)</p>}
                            {!(d.media || []).length && !d.has_media && !giftLabel(d) && '—'}
                          </td>
                          <td className="whitespace-nowrap py-2 pr-3 text-warm-500">{fmt(d.updated_at)}</td>
                          <td className="whitespace-nowrap py-2">
                            {d.status === 'posting' ? <span className="text-[11px] font-bold text-amber-600">Posting…</span> : (
                              <div className="flex gap-1.5">
                                <button type="button" onClick={() => postDraft(d)} disabled={draftBusy === d.id}
                                  className="rounded-lg bg-primary-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-primary-700 disabled:opacity-50" style={{ minHeight: 0 }}>
                                  {draftBusy === d.id ? '…' : 'Post'}
                                </button>
                                <button type="button" onClick={() => discardDraft(d)} disabled={draftBusy === d.id}
                                  className="rounded-lg border border-warm-200 px-2 py-1 text-[11px] font-bold text-warm-500 hover:bg-warm-50 disabled:opacity-50" style={{ minHeight: 0 }}>
                                  Remove
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>

            <Section title="Activity" count={data.timeline.length}>
              {data.timeline.length === 0 ? <p className="text-xs text-warm-400">No activity recorded.</p> : (
                <ol className="relative ml-2 border-l-2 border-purple-100">
                  {data.timeline.slice().reverse().map((e, i) => (
                    <li key={i} className="mb-3 ml-4 last:mb-0">
                      <span className="absolute -left-[11px] flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] ring-2 ring-purple-100">{EVENT_ICON[e.type] || '•'}</span>
                      <p className="text-xs font-semibold text-warm-800">{e.text}</p>
                      <p className="text-[11px] text-warm-400">{fmt(e.at)}</p>
                    </li>
                  ))}
                </ol>
              )}
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}
