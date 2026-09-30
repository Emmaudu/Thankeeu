import { useState, useEffect } from 'react';
import VendorLayout from './VendorLayout';
import Icon from '../../components/ui/Icon';
import { vendorAxios } from '../../utils/api';
import { formatNGN } from '../../utils/currency';
import toast from 'react-hot-toast';
import { asArray } from '../../utils/asArray';

const STATUSES = ['pending','confirmed','processing','shipped','delivered','cancelled'];
const COLOR = s => ({ delivered:'bg-green-100 text-green-700', shipped:'bg-blue-100 text-blue-700',
  processing:'bg-amber-100 text-amber-700', confirmed:'bg-sky-100 text-sky-700',
  pending:'bg-gray-100 text-gray-600', cancelled:'bg-red-100 text-red-600' }[s]||'bg-gray-100 text-gray-600');

export default function VendorOrders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [tracking, setTracking] = useState('');
  const [updating, setUpdating] = useState(false);

  const load = (status='') => {
    const q = status ? `?status=${status}` : '';
    vendorAxios.get(`/vendor/orders${q}`)
      .then(r => setOrders(asArray(r.data)))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const applyFilter = s => { setFilter(s); setLoading(true); load(s); };

  const updateOrder = async () => {
    if (!newStatus) return;
    setUpdating(true);
    try {
      await vendorAxios.put(`/vendor/orders/${selected.id}`, { status: newStatus, tracking_number: tracking });
      toast.success('Order updated!');
      setSelected(null);
      load(filter);
    } catch { toast.error('Failed to update order'); }
    finally { setUpdating(false); }
  };

  const recipientName = o => o.recipient_name || o.customer_name || 'Recipient not provided';
  const recipientEmail = o => o.recipient_email || 'No recipient email';
  const signerName = o => o.signer_name || o.customer_name || 'Signer not provided';
  const signerEmail = o => o.signer_email || o.customer_email || 'No signer email';

  return (
    <VendorLayout title="Orders" subtitle="Manage and fulfill customer orders">
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {['', ...STATUSES].map(s => (
          <button key={s} onClick={() => applyFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all capitalize
              ${filter===s ? 'bg-primary-600 text-white' : 'bg-white border border-purple-100 text-warm-600 hover:border-primary-300'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading
        ? <div className="space-y-3">{[...Array(4)].map((_,i)=><div key={i} className="h-20 bg-purple-50 rounded-2xl animate-pulse"/>)}</div>
        : orders.length === 0
          ? <div className="text-center py-20 text-warm-400">
              <Icon name="Cart" size={48} className="mx-auto mb-4 text-purple-200"/>
              <p className="font-semibold">No {filter||'orders'} found</p>
            </div>
          : <div className="space-y-3">
              {orders.map(o => (
                <div key={o.id} className="bg-white rounded-2xl border border-purple-100 p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-warm-900 text-sm">#{o.id.slice(0,8).toUpperCase()}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${COLOR(o.status)}`}>{o.status}</span>
                    </div>
                    <p className="text-xs text-warm-500 mt-0.5">Recipient: {recipientName(o)} - {recipientEmail(o)}</p>
                    <p className="text-xs text-warm-400 mt-0.5">Signer: {signerName(o)} - {signerEmail(o)}</p>
                    {o.card_slug && <p className="text-xs text-primary-500 mt-0.5">Card gift for /card/{o.card_slug}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-warm-900">{formatNGN(o.total_amount)}</p>
                    <p className="text-xs text-warm-400">You get {formatNGN(o.vendor_payout||Math.max(0,o.total_amount-5000))}</p>
                  </div>
                  <button onClick={() => { setSelected(o); setNewStatus(o.status); setTracking(o.tracking_number||''); }}
                    className="p-2 rounded-xl hover:bg-purple-50 text-warm-400 hover:text-primary-600 transition-colors">
                    <Icon name="Edit" size={16}/>
                  </button>
                </div>
              ))}
            </div>
      }

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-warm-900">Update Order #{selected.id.slice(0,8).toUpperCase()}</h3>
              <button onClick={()=>setSelected(null)}><Icon name="X" size={18} className="text-warm-400"/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">New status</label>
                <select value={newStatus} onChange={e=>setNewStatus(e.target.value)} className="input w-full capitalize">
                  {STATUSES.map(s=><option key={s} value={s} className="capitalize">{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">Tracking number (optional)</label>
                <input value={tracking} onChange={e=>setTracking(e.target.value)} placeholder="Courier tracking number" className="input w-full"/>
              </div>
              <div className="bg-purple-50 rounded-xl p-3 text-xs text-warm-600">
                <p className="font-semibold text-warm-800 mb-1">Recipient</p>
                <p><strong>Name:</strong> {recipientName(selected)}</p>
                <p><strong>Email:</strong> {recipientEmail(selected)}</p>
                <p className="font-semibold text-warm-800 mt-3 mb-1">Signer</p>
                <p><strong>Name:</strong> {signerName(selected)}</p>
                <p><strong>Email:</strong> {signerEmail(selected)}</p>
                {selected.customer_phone && <p><strong>Phone:</strong> {selected.customer_phone}</p>}
                {selected.delivery_address && <p><strong>Address:</strong> {selected.delivery_address}</p>}
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={()=>setSelected(null)} className="flex-1 py-3 rounded-xl border border-purple-200 text-sm font-semibold text-warm-600">Cancel</button>
              <button onClick={updateOrder} disabled={updating} className="flex-1 py-3 rounded-xl bg-primary-600 text-white text-sm font-semibold disabled:opacity-60">
                {updating ? 'Saving...' : 'Update order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </VendorLayout>
  );
}
