import { useState, useEffect } from 'react';
import VendorLayout from './VendorLayout';
import Icon from '../../components/ui/Icon';
import { vendorAxios } from '../../utils/api';
import { formatNGN } from '../../utils/currency';
import toast from 'react-hot-toast';
import { asArray } from '../../utils/asArray';

export default function VendorAnalytics() {
  const [data, setData] = useState(null);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    Promise.all([
      vendorAxios.get('/vendor/analytics'),
      vendorAxios.get('/vendor/orders'),
    ]).then(([a, o]) => {
      setData(a.data);
      setOrders(asArray(o.data));
    }).catch(()=>toast.error('Failed to load analytics'));
  }, []);

  if (!data) return <VendorLayout title="Analytics"><div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"/></div></VendorLayout>;

  // Group orders by month for simple chart
  const byMonth = {};
  orders.forEach(o => {
    const m = new Date(o.created_at).toLocaleDateString('en',{month:'short',year:'2-digit'});
    byMonth[m] = (byMonth[m]||0) + o.total_amount;
  });
  const months = Object.entries(byMonth).slice(-6);
  const maxVal = Math.max(...months.map(([,v])=>v), 1);

  return (
    <VendorLayout title="Analytics" subtitle="Sales history and performance">
      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { l:'Total Revenue', v: formatNGN(data.revenue_total||0), icon:'TrendingUp', color:'#7C3AED' },
          { l:'Platform Fees Paid', v: formatNGN((data.orders_total||0)*5000), icon:'Percent', color:'#EC4899' },
          { l:'Your Net Revenue', v: formatNGN(Math.max(0,(data.revenue_total||0)-(data.orders_total||0)*5000)), icon:'Wallet', color:'#10B981' },
          { l:'Avg Order Value', v: data.orders_total ? formatNGN(data.revenue_total/data.orders_total) : '—', icon:'BarChart', color:'#3B82F6' },
        ].map(m=>(
          <div key={m.l} className="bg-white rounded-2xl border border-purple-100 p-5">
            <p className="text-xs font-semibold text-warm-400 uppercase tracking-wide mb-2">{m.l}</p>
            <p className="text-xl font-bold text-warm-900">{m.v}</p>
          </div>
        ))}
      </div>

      {/* Revenue bar chart */}
      {months.length > 0 && (
        <div className="bg-white rounded-2xl border border-purple-100 p-6 mb-6">
          <h3 className="font-semibold text-warm-900 mb-5">Revenue by month</h3>
          <div className="flex items-end gap-3 h-40">
            {months.map(([month, val]) => (
              <div key={month} className="flex-1 flex flex-col items-center gap-1">
                <p className="text-xs text-warm-500 font-medium">{formatNGN(val).replace('₦','')}</p>
                <div className="w-full rounded-t-lg transition-all"
                  style={{ height: `${Math.max(4,(val/maxVal)*120)}px`, background:'linear-gradient(to top, #7C3AED, #a855f7)' }}/>
                <p className="text-xs text-warm-400">{month}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order status breakdown */}
      {data.orders_by_status && (
        <div className="bg-white rounded-2xl border border-purple-100 p-6">
          <h3 className="font-semibold text-warm-900 mb-4">Orders by status</h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {data.orders_by_status.map(s => (
              <div key={s.status} className="text-center p-3 rounded-xl bg-purple-50">
                <p className="text-2xl font-bold text-warm-900">{s.count}</p>
                <p className="text-xs text-warm-500 capitalize mt-1">{s.status}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </VendorLayout>
  );
}
