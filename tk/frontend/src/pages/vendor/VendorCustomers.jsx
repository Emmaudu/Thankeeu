import { useState, useEffect } from 'react';
import VendorLayout from './VendorLayout';
import Icon from '../../components/ui/Icon';
import { vendorAxios } from '../../utils/api';
import { formatNGN } from '../../utils/currency';
import { asArray } from '../../utils/asArray';

export default function VendorCustomers() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vendorAxios.get('/vendor/orders')
      .then(r => setOrders(asArray(r.data)))
      .finally(() => setLoading(false));
  }, []);

  // Build customer list from orders (deduplicated by email)
  const customerMap = {};
  orders.forEach(o => {
    if (!o.customer_email) return;
    const key = o.customer_email.toLowerCase();
    if (!customerMap[key]) {
      customerMap[key] = {
        email: o.customer_email,
        name: o.customer_name || o.customer_email,
        phone: o.customer_phone || '',
        orders: 0, total_spent: 0, last_order: o.created_at,
      };
    }
    customerMap[key].orders++;
    customerMap[key].total_spent += o.total_amount || 0;
    if (o.created_at > customerMap[key].last_order) customerMap[key].last_order = o.created_at;
  });
  const customers = Object.values(customerMap).sort((a, b) => b.total_spent - a.total_spent);

  return (
    <VendorLayout title="Customers" subtitle="Everyone who has ordered from your store">
      <div className="bg-white rounded-2xl border border-purple-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-purple-50 flex items-center justify-between">
          <h3 className="font-semibold text-warm-900">{customers.length} customer{customers.length !== 1 && 's'}</h3>
        </div>

        {loading
          ? <div className="p-5 space-y-3">{[...Array(4)].map((_,i)=><div key={i} className="h-16 bg-purple-50 rounded-xl animate-pulse"/>)}</div>
          : customers.length === 0
            ? <div className="py-16 text-center text-warm-400">
                <Icon name="Users" size={40} className="mx-auto mb-3 text-purple-200"/>
                <p className="font-semibold">No customers yet</p>
                <p className="text-sm mt-1">Customers will appear here once they place an order</p>
              </div>
            : <div className="divide-y divide-purple-50">
                {customers.map((c, i) => (
                  <div key={c.email} className="px-5 py-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-pink-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary-600">
                        {c.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-warm-900 text-sm">{c.name}</p>
                      <p className="text-xs text-warm-400">{c.email}{c.phone ? ` · ${c.phone}` : ''}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-warm-900">{formatNGN(c.total_spent)}</p>
                      <p className="text-xs text-warm-400">{c.orders} order{c.orders !== 1 && 's'}</p>
                    </div>
                    <div className="text-right flex-shrink-0 hidden sm:block">
                      <p className="text-xs text-warm-400">Last order</p>
                      <p className="text-xs text-warm-600">
                        {new Date(c.last_order).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
        }
      </div>
    </VendorLayout>
  );
}
