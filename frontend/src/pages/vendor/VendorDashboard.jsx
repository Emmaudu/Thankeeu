import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/ui/Icon';
import { vendorAxios } from '../../utils/api';
import toast from 'react-hot-toast';
import { formatNGN } from '../../utils/currency';

const StatCard = ({ icon, label, value, sub, accent }) => (
  <div className={`rounded-2xl p-5 border-2 ${accent ? 'border-primary-200 bg-primary-50' : 'border-purple-100 bg-white'}`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-warm-500 mb-1">{label}</p>
        <p className={`text-2xl font-bold ${accent ? 'text-primary-700' : 'text-warm-900'}`}>{value}</p>
        {sub && <p className="text-xs text-warm-400 mt-0.5">{sub}</p>}
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent ? 'bg-primary-100' : 'bg-purple-50'}`}>
        <Icon name={icon} size={20} className={accent ? 'text-primary-600' : 'text-purple-600'} />
      </div>
    </div>
  </div>
);

export default function VendorDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([vendorAxios.get('/vendor/analytics'), vendorAxios.get('/vendor/orders?limit=5')])
      .then(([a, o]) => { setAnalytics(a.data); setRecentOrders(o.data?.slice(0,5) || []); })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"/></div>;

  return (
    <div className="min-h-screen" style={{ background: '#F8F7FF' }}>
      <header className="bg-white border-b border-purple-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center">
            <Icon name="Store" size={16} className="text-white" />
          </div>
          <span className="font-bold text-warm-900">Vendor Dashboard</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/vendor/products" className="text-sm text-warm-600 hover:text-primary-600 flex items-center gap-1"><Icon name="Package" size={14}/>Products</Link>
          <Link to="/vendor/orders" className="text-sm text-warm-600 hover:text-primary-600 flex items-center gap-1"><Icon name="Cart" size={14}/>Orders</Link>
          <Link to="/vendor/settings" className="text-sm text-warm-600 hover:text-primary-600 flex items-center gap-1"><Icon name="Settings" size={14}/>Settings</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-warm-900 mb-6">Overview</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon="TrendingUp" label="Total Revenue"   value={formatNGN(analytics?.revenue_total || 0)}   accent />
          <StatCard icon="Cart"       label="Total Orders"    value={analytics?.orders_total || 0}    sub={`${analytics?.orders_pending || 0} pending`}/>
          <StatCard icon="Eye"        label="Store Views"     value={(analytics?.store_views || 0).toLocaleString()} />
          <StatCard icon="Package"    label="Active Products" value={`${analytics?.products_active || 0}/${analytics?.products_total || 0}`} />
        </div>

        <div className="bg-white rounded-2xl border border-purple-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-purple-50 flex items-center justify-between">
            <h2 className="font-semibold text-warm-900">Recent Orders</h2>
            <Link to="/vendor/orders" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">View all <Icon name="ArrowRight" size={14}/></Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="py-12 text-center text-warm-400">
              <Icon name="Cart" size={32} className="mx-auto mb-3 text-purple-200"/>
              <p className="text-sm">No orders yet. Share your store link to get started!</p>
            </div>
          ) : (
            <div className="divide-y divide-purple-50">
              {recentOrders.map(order => (
                <div key={order.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-warm-900">#{order.id.slice(0,8).toUpperCase()}</p>
                    <p className="text-xs text-warm-400">{order.customer_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-warm-900">{formatNGN(order.total_amount)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      order.status === 'shipped'   ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>{order.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
