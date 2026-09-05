import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import VendorLayout from './VendorLayout';
import Icon from '../../components/ui/Icon';
import { vendorAxios } from '../../utils/api';
import { formatNGN } from '../../utils/currency';
import toast from 'react-hot-toast';
import { asArray } from '../../utils/asArray';

const StatCard = ({ icon, label, value, sub, accent, color = '#7C3AED' }) => (
  <div className="bg-white rounded-2xl border border-purple-100 p-5 relative overflow-hidden">
    <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-5"
      style={{ background: color, transform: 'translate(25%,-25%)' }} />
    <div className="flex items-start justify-between relative">
      <div>
        <p className="text-xs font-semibold text-warm-400 uppercase tracking-wide mb-1">{label}</p>
        <p className="text-2xl font-bold text-warm-900">{value}</p>
        {sub && <p className="text-xs text-warm-400 mt-1">{sub}</p>}
      </div>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: `${color}18` }}>
        <Icon name={icon} size={20} style={{ color }} />
      </div>
    </div>
  </div>
);

export default function VendorDashboard() {
  const [data, setData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      vendorAxios.get('/vendor/analytics'),
      vendorAxios.get('/vendor/orders'),
    ]).then(([a, o]) => {
      setData(a.data);
      setOrders((asArray(o.data)).slice(0, 8));
    }).catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <VendorLayout title="Dashboard"><div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div></VendorLayout>;

  const statusColor = s => ({
    delivered:'bg-green-100 text-green-700', shipped:'bg-blue-100 text-blue-700',
    processing:'bg-amber-100 text-amber-700', confirmed:'bg-sky-100 text-sky-700',
    pending:'bg-gray-100 text-gray-600', cancelled:'bg-red-100 text-red-600',
  }[s] || 'bg-gray-100 text-gray-600');

  return (
    <VendorLayout title="Overview" subtitle="Your store at a glance">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="TrendingUp" label="Total Revenue" value={formatNGN(data?.revenue_total||0)} sub="after Thankeeu fee" color="#7C3AED" accent />
        <StatCard icon="Cart" label="Total Orders" value={data?.orders_total||0} sub={`${data?.orders_pending||0} pending`} color="#EC4899" />
        <StatCard icon="Eye" label="Store Views" value={(data?.store_views||0).toLocaleString()} color="#3B82F6" />
        <StatCard icon="Package" label="Active Products" value={`${data?.products_active||0}/${data?.products_total||0}`} color="#10B981" />
      </div>

      {/* Order status breakdown */}
      {data?.orders_by_status && (
        <div className="bg-white rounded-2xl border border-purple-100 p-5 mb-6">
          <h3 className="font-semibold text-warm-900 mb-4">Order breakdown</h3>
          <div className="flex flex-wrap gap-3">
            {data.orders_by_status.filter(s => s.count > 0).map(s => (
              <div key={s.status} className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${statusColor(s.status)}`}>
                {s.status}: {s.count}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent orders */}
      <div className="bg-white rounded-2xl border border-purple-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-purple-50 flex items-center justify-between">
          <h3 className="font-semibold text-warm-900">Recent Orders</h3>
          <Link to="/vendor/orders" className="text-sm text-primary-600 flex items-center gap-1">
            View all <Icon name="ChevronRight" size={14} />
          </Link>
        </div>
        {orders.length === 0
          ? <div className="py-16 text-center text-warm-400">
              <Icon name="Cart" size={40} className="mx-auto mb-3 text-purple-200" />
              <p className="text-sm font-medium">No orders yet</p>
              <p className="text-xs mt-1">Share your storefront link to start receiving orders</p>
            </div>
          : <div className="divide-y divide-purple-50">
              {orders.map(o => (
                <div key={o.id} className="px-5 py-3.5 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-warm-900">#{o.id.slice(0,8).toUpperCase()}</p>
                    <p className="text-xs text-warm-400 truncate">{o.customer_name} · {o.customer_email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-warm-900">{formatNGN(o.total_amount)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColor(o.status)}`}>{o.status}</span>
                  </div>
                </div>
              ))}
            </div>
        }
      </div>
    </VendorLayout>
  );
}
