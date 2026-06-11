import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useSEO } from '../../hooks/useSEO';
import { formatNGN } from '../../utils/currency';
import toast from 'react-hot-toast';

const BASE = () => import.meta.env.VITE_API_URL || '/api';

export default function VendorStorefrontPublic() {
  const { slug } = useParams();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState('');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);

  useSEO({ title: store ? `${store.business_name} — Thankeeu Marketplace` : 'Vendor Store' });

  useEffect(() => {
    fetch(`${BASE()}/vendor/store/${slug}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setLoading(false); return; }
        setStore(d.vendor);
        setProducts(d.products || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const addToCart = (product) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === product.id);
      if (ex) return prev.map(i => i.id === product.id ? {...i, qty: i.qty+1} : i);
      return [...prev, { ...product, qty: 1 }];
    });
    toast.success(`${product.name} added!`);
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cats = [...new Set(products.map(p => p.category).filter(Boolean))];
  const visible = catFilter ? products.filter(p => p.category === catFilter) : products;

  const CATEGORY_ICON = {
    cakes:'🎂', flowers:'🌸', chocolates:'🍫', jewellery:'💍',
    hampers:'🧺', balloons:'🎈', gift_wrapping:'🎁', general:'🛍️',
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"/>
    </div>
  );

  if (!store) return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center text-center px-4">
        <div>
          <p className="text-5xl mb-4">🏪</p>
          <h1 className="text-2xl font-bold text-warm-900 mb-2">Store not found</h1>
          <p className="text-warm-500 mb-6">This store may not exist or may have been removed.</p>
          <Link to="/" className="btn-primary px-6 py-3">Go to Thankeeu</Link>
        </div>
      </div>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: '#FAFAFA' }}>
      <Navbar />

      {/* Banner */}
      <div className="relative h-40 sm:h-56 overflow-hidden"
        style={{ background: store.banner_url ? 'transparent' : 'linear-gradient(135deg,#7C3AED,#EC4899)' }}>
        {store.banner_url && <img src={store.banner_url} className="w-full h-full object-cover" alt=""/>}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Store header */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-end gap-4 -mt-10 mb-6 relative z-10">
          <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg overflow-hidden flex-shrink-0"
            style={{ background: '#EDE9FF' }}>
            {store.logo_url
              ? <img src={store.logo_url} className="w-full h-full object-cover"/>
              : <div className="w-full h-full flex items-center justify-center text-3xl">
                  {CATEGORY_ICON[store.category] || '🛍️'}
                </div>}
          </div>
          <div className="pb-2 flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-warm-900">{store.business_name}</h1>
            <p className="text-sm text-warm-500 capitalize">{store.category}{store.country ? ` · ${store.country}${store.state ? `, ${store.state}` : ''}` : ''}</p>
          </div>
          {cart.length > 0 && (
            <button onClick={() => setShowCart(true)}
              className="flex-shrink-0 relative px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold shadow-md">
              🛒 Cart · {cart.length}
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-pink-500 text-white text-xs flex items-center justify-center font-bold">
                {cart.reduce((s,i)=>s+i.qty,0)}
              </span>
            </button>
          )}
        </div>

        {store.description && (
          <p className="text-warm-600 mb-6 leading-relaxed">{store.description}</p>
        )}

        {/* Info pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {store.delivery_info && (
            <span className="px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-100">
              🚚 {store.delivery_info}
            </span>
          )}
          {store.return_policy && (
            <span className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
              ↩️ {store.return_policy}
            </span>
          )}
        </div>

        {/* Category filter */}
        {cats.length > 1 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            <button onClick={() => setCatFilter('')}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${!catFilter ? 'bg-primary-600 text-white' : 'bg-white border border-purple-200 text-warm-600'}`}>
              All ({products.length})
            </button>
            {cats.map(cat => (
              <button key={cat} onClick={() => setCatFilter(cat)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap capitalize ${catFilter===cat ? 'bg-primary-600 text-white' : 'bg-white border border-purple-200 text-warm-600'}`}>
                {CATEGORY_ICON[cat]||'🛍️'} {cat}
              </button>
            ))}
          </div>
        )}

        {/* Products grid */}
        {visible.length === 0
          ? <div className="text-center py-20 text-warm-400">
              <p className="text-4xl mb-3">📦</p>
              <p className="font-semibold">No products available right now</p>
            </div>
          : <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pb-12">
              {visible.map(p => (
                <div key={p.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-purple-50 hover:shadow-md transition-shadow">
                  <div className="aspect-square bg-purple-50 overflow-hidden">
                    {p.images?.[0]
                      ? <img src={p.images[0]} className="w-full h-full object-cover"/>
                      : <div className="w-full h-full flex items-center justify-center text-4xl">
                          {CATEGORY_ICON[p.category] || '🎁'}
                        </div>}
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-warm-900 text-sm leading-tight">{p.name}</p>
                    {p.description && <p className="text-xs text-warm-400 mt-1 line-clamp-2">{p.description}</p>}
                    <p className="text-primary-600 font-bold mt-2">{formatNGN(p.price)}</p>
                    <button onClick={() => addToCart(p)}
                      className="w-full mt-2 py-2 rounded-xl bg-primary-600 text-white text-xs font-bold hover:bg-primary-700 transition-colors">
                      Add to cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
        }
      </div>

      {/* Cart drawer */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setShowCart(false)}/>
          <div className="w-full max-w-sm bg-white h-full flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="font-bold text-warm-900">Your cart</h3>
              <button onClick={() => setShowCart(false)} className="text-warm-400 text-xl">×</button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {item.images?.[0]
                      ? <img src={item.images[0]} className="w-full h-full object-cover"/>
                      : <span className="text-xl">{CATEGORY_ICON[item.category]||'🎁'}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-warm-900 truncate">{item.name}</p>
                    <p className="text-xs text-primary-600 font-bold">{formatNGN(item.price)} × {item.qty}</p>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-400 text-sm font-bold">✕</button>
                </div>
              ))}
            </div>
            <div className="px-5 py-4 border-t">
              <div className="flex justify-between mb-3 text-sm font-semibold">
                <span>Total</span><span className="text-primary-600">{formatNGN(cartTotal)}</span>
              </div>
              <button
                onClick={() => toast('Contact vendor to place your order', {duration:4000})}
                className="w-full py-3 rounded-xl bg-primary-600 text-white font-bold text-sm">
                Proceed to checkout
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
