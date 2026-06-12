import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useSEO } from '../../hooks/useSEO';
import { formatNGN } from '../../utils/currency';
import { vendorAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const BASE = () => import.meta.env.VITE_API_URL || '/api';
const CATEGORY_ICON = {
  cakes:'🎂', flowers:'🌸', chocolates:'🍫', jewellery:'💍',
  hampers:'🧺', balloons:'🎈', gift_wrapping:'🎁', general:'🛍️',
};

/* ── Image carousel for a single product ─────────────────────────── */
function ProductCarousel({ images, name, category }) {
  const [idx, setIdx] = useState(0);
  const imgs = images?.length ? images : [];
  if (!imgs.length) return (
    <div className="aspect-square bg-purple-50 flex items-center justify-center text-5xl">
      {CATEGORY_ICON[category] || '🎁'}
    </div>
  );
  return (
    <div className="relative aspect-square bg-purple-50 overflow-hidden group">
      <img src={imgs[idx]} alt={name} className="w-full h-full object-cover transition-opacity"/>
      {imgs.length > 1 && (
        <>
          <button onClick={e => { e.stopPropagation(); setIdx(i => (i - 1 + imgs.length) % imgs.length); }}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70">
            ‹
          </button>
          <button onClick={e => { e.stopPropagation(); setIdx(i => (i + 1) % imgs.length); }}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70">
            ›
          </button>
          <div className="absolute bottom-1.5 left-0 right-0 flex justify-center gap-1">
            {imgs.map((_,i) => (
              <button key={i} onClick={e => { e.stopPropagation(); setIdx(i); }}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i===idx ? 'bg-white' : 'bg-white/50'}`}/>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Product modal with full carousel ────────────────────────────── */
function ProductModal({ product, onClose, onAddToCart }) {
  const [imgIdx, setImgIdx] = useState(0);
  const imgs = product.images?.length ? product.images : [];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}>
        {/* Carousel */}
        <div className="relative bg-purple-50 rounded-t-3xl overflow-hidden" style={{ aspectRatio:'4/3' }}>
          {imgs.length ? (
            <>
              <img src={imgs[imgIdx]} alt={product.name} className="w-full h-full object-cover"/>
              {imgs.length > 1 && (
                <>
                  <button onClick={() => setImgIdx(i => (i-1+imgs.length)%imgs.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white text-lg font-bold flex items-center justify-center hover:bg-black/70">
                    ‹
                  </button>
                  <button onClick={() => setImgIdx(i => (i+1)%imgs.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white text-lg font-bold flex items-center justify-center hover:bg-black/70">
                    ›
                  </button>
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                    {imgs.map((_,i) => (
                      <button key={i} onClick={() => setImgIdx(i)}
                        className={`w-2 h-2 rounded-full ${i===imgIdx?'bg-white':'bg-white/50'}`}/>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">
              {CATEGORY_ICON[product.category] || '🎁'}
            </div>
          )}
          <button onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white text-lg flex items-center justify-center hover:bg-black/70">
            ×
          </button>
        </div>

        <div className="p-5">
          <h3 className="text-xl font-bold text-warm-900 mb-1">{product.name}</h3>
          <p className="text-2xl font-extrabold text-primary-600 mb-3">{formatNGN(product.price)}</p>
          {product.description && (
            <p className="text-warm-600 text-sm leading-relaxed mb-5">{product.description}</p>
          )}
          <button onClick={() => { onAddToCart(product); onClose(); }}
            className="w-full py-3.5 rounded-2xl bg-primary-600 text-white font-bold hover:bg-primary-700 transition-colors">
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Checkout modal ───────────────────────────────────────────────── */
function CheckoutModal({ cart, storeSlug, onClose, onSuccess }) {
  const [form, setForm] = useState({ name:'', email:'', phone:'', address:'' });
  const [paying, setPaying] = useState(false);
  const total = cart.reduce((s,i) => s + i.price * i.qty, 0);
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const handlePay = async () => {
    if (!form.name.trim())  return toast.error('Name is required');
    if (!form.email.trim()) return toast.error('Email is required');
    if (!form.address.trim()) return toast.error('Delivery address is required so the vendor knows where to send your order');
    setPaying(true);
    try {
      const res = await vendorAPI.checkout(storeSlug, {
        items: cart.map(i => ({ product_id: i.id, quantity: i.qty })),
        customer_name:    form.name.trim(),
        customer_email:   form.email.trim(),
        customer_phone:   form.phone.trim(),
        delivery_address: form.address.trim(),
        currency: 'NGN',
      });
      toast.success('Redirecting to payment…');
      window.location.assign(res.data.payment_link);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start payment. Please try again.');
      setPaying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white z-10">
          <h3 className="font-bold text-warm-900 text-lg">Checkout</h3>
          <button onClick={onClose} className="text-warm-400 text-2xl leading-none">×</button>
        </div>

        {/* Order summary */}
        <div className="px-5 py-4 border-b bg-purple-50/50">
          <p className="text-xs font-bold text-warm-500 uppercase tracking-wide mb-3">Order summary</p>
          {cart.map(item => (
            <div key={item.id} className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                {item.images?.[0]
                  ? <img src={item.images[0]} className="w-8 h-8 rounded-lg object-cover"/>
                  : <span className="text-lg">{CATEGORY_ICON[item.category]||'🎁'}</span>}
                <span className="text-sm font-medium text-warm-800">{item.name} × {item.qty}</span>
              </div>
              <span className="text-sm font-bold text-primary-600">{formatNGN(item.price * item.qty)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2 border-t border-purple-100 mt-2">
            <span className="font-bold text-warm-900">Total</span>
            <span className="font-extrabold text-primary-600 text-lg">{formatNGN(total)}</span>
          </div>
        </div>

        {/* Customer details */}
        <div className="px-5 py-4 space-y-3">
          <p className="text-xs font-bold text-warm-500 uppercase tracking-wide mb-1">Your details</p>
          {[
            { k:'name',    l:'Full name *',          t:'text',  p:'Your name' },
            { k:'email',   l:'Email address *',       t:'email', p:'For order confirmation' },
            { k:'phone',   l:'Phone number',          t:'tel',   p:'+234...' },
            { k:'address', l:'Delivery address *',    t:'text',  p:'Street, city, state' },
          ].map(f => (
            <div key={f.k}>
              <label className="block text-xs font-semibold text-warm-600 mb-1">{f.l}</label>
              <input type={f.t} placeholder={f.p} value={form[f.k]}
                onChange={e => set(f.k, e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-purple-100 focus:border-primary-400 focus:outline-none text-sm text-warm-900"/>
            </div>
          ))}
        </div>

        <div className="px-5 pb-6">
          <button onClick={handlePay} disabled={paying}
            className="w-full py-4 rounded-2xl font-extrabold text-white disabled:opacity-60 transition-all text-base"
            style={{ background:'linear-gradient(135deg,#7C3AED,#EC4899)', boxShadow:'0 4px 20px rgba(124,58,237,0.35)' }}>
            {paying
              ? <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  Connecting to payment…
                </span>
              : `💳 Pay ${formatNGN(total)} securely →`}
          </button>
          <p className="text-center text-xs text-warm-400 mt-3">
            Powered by Flutterwave · Secured payment
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Main storefront ──────────────────────────────────────────────── */
export default function VendorStorefrontPublic() {
  const { slug } = useParams();
  const [store, setStore]         = useState(null);
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [catFilter, setCatFilter] = useState('');
  const [cart, setCart]           = useState([]);
  const [showCart, setShowCart]   = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

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
    toast.success(`${product.name} added to cart!`);
  };

  const removeFromCart = (id)        => setCart(prev => prev.filter(i => i.id !== id));
  const updateQty      = (id, delta) => setCart(prev =>
    prev.map(i => i.id === id ? {...i, qty: Math.max(1, i.qty + delta)} : i)
  );
  const cartTotal = cart.reduce((s,i) => s + i.price * i.qty, 0);
  const cats      = [...new Set(products.map(p => p.category).filter(Boolean))];
  const visible   = catFilter ? products.filter(p => p.category === catFilter) : products;

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
    <div className="min-h-screen" style={{ background:'#FAFAFA' }}>
      <Navbar />

      {/* Banner */}
      <div className="relative h-40 sm:h-56 overflow-hidden"
        style={{ background: store.banner_url ? 'transparent' : 'linear-gradient(135deg,#7C3AED,#EC4899)' }}>
        {store.banner_url && <img src={store.banner_url} className="w-full h-full object-cover" alt=""/>}
        <div className="absolute inset-0 bg-black/20"/>
      </div>

      {/* Store header */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-end gap-4 -mt-10 mb-6 relative z-10">
          <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg overflow-hidden flex-shrink-0"
            style={{ background:'#EDE9FF' }}>
            {store.logo_url
              ? <img src={store.logo_url} className="w-full h-full object-cover"/>
              : <div className="w-full h-full flex items-center justify-center text-3xl">
                  {CATEGORY_ICON[store.category] || '🛍️'}
                </div>}
          </div>
          <div className="pb-2 flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-warm-900">{store.business_name}</h1>
            <p className="text-sm text-warm-500 capitalize">
              {store.category}
              {store.country ? ` · ${store.country}${store.state ? `, ${store.state}` : ''}` : ''}
            </p>
          </div>
          {cart.length > 0 && (
            <button onClick={() => setShowCart(true)}
              className="flex-shrink-0 relative px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold shadow-md">
              🛒 Cart · {cart.reduce((s,i)=>s+i.qty,0)}
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
                <ProductCard key={p.id} product={p} onAddToCart={addToCart}
                  onViewDetails={() => setSelectedProduct(p)} />
              ))}
            </div>
        }
      </div>

      {/* Cart drawer */}
      {showCart && !showCheckout && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setShowCart(false)}/>
          <div className="w-full max-w-sm bg-white h-full flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="font-bold text-warm-900">Your cart ({cart.reduce((s,i)=>s+i.qty,0)} items)</h3>
              <button onClick={() => setShowCart(false)} className="text-warm-400 text-2xl">×</button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-purple-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {item.images?.[0]
                      ? <img src={item.images[0]} className="w-full h-full object-cover"/>
                      : <span className="text-2xl">{CATEGORY_ICON[item.category]||'🎁'}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-warm-900 truncate">{item.name}</p>
                    <p className="text-xs text-primary-600 font-bold">{formatNGN(item.price)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <button onClick={() => updateQty(item.id, -1)}
                        className="w-6 h-6 rounded-full border border-purple-200 text-warm-600 text-sm font-bold flex items-center justify-center hover:bg-purple-50">
                        −
                      </button>
                      <span className="text-sm font-bold">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)}
                        className="w-6 h-6 rounded-full border border-purple-200 text-warm-600 text-sm font-bold flex items-center justify-center hover:bg-purple-50">
                        +
                      </button>
                    </div>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-400 font-bold">✕</button>
                </div>
              ))}
            </div>
            <div className="px-5 py-4 border-t">
              <div className="flex justify-between mb-4 text-sm font-semibold">
                <span>Total</span>
                <span className="text-primary-600 font-extrabold text-lg">{formatNGN(cartTotal)}</span>
              </div>
              <button
                onClick={() => { setShowCart(false); setShowCheckout(true); }}
                className="w-full py-3.5 rounded-2xl font-extrabold text-white text-sm transition-all"
                style={{ background:'linear-gradient(135deg,#7C3AED,#EC4899)', boxShadow:'0 4px 20px rgba(124,58,237,0.35)' }}>
                Proceed to checkout →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout modal */}
      {showCheckout && (
        <CheckoutModal
          cart={cart}
          storeSlug={slug}
          onClose={() => setShowCheckout(false)}
          onSuccess={() => { setCart([]); setShowCheckout(false); }}
        />
      )}

      {/* Product detail modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
        />
      )}

      <Footer />
    </div>
  );
}

/* ── Product card component ───────────────────────────────────────── */
function ProductCard({ product: p, onAddToCart, onViewDetails }) {
  const [showFull, setShowFull] = useState(false);
  const TRUNCATE = 80;
  const longDesc = p.description?.length > TRUNCATE;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-purple-50 hover:shadow-md transition-shadow flex flex-col">
      {/* Image with carousel */}
      <div className="cursor-pointer" onClick={onViewDetails}>
        <ProductCarousel images={p.images} name={p.name} category={p.category}/>
      </div>

      <div className="p-3 flex flex-col flex-1">
        <p className="font-semibold text-warm-900 text-sm leading-tight cursor-pointer hover:text-primary-600"
          onClick={onViewDetails}>
          {p.name}
        </p>

        {p.description && (
          <div className="mt-1">
            <p className="text-xs text-warm-400 leading-relaxed">
              {showFull || !longDesc ? p.description : p.description.slice(0, TRUNCATE) + '…'}
            </p>
            {longDesc && (
              <button onClick={() => setShowFull(f => !f)}
                className="text-xs text-primary-500 font-semibold mt-0.5 hover:underline">
                {showFull ? 'Show less' : 'See more'}
              </button>
            )}
          </div>
        )}

        <p className="text-primary-600 font-bold mt-2">{formatNGN(p.price)}</p>
        <button onClick={() => onAddToCart(p)}
          className="w-full mt-2 py-2 rounded-xl bg-primary-600 text-white text-xs font-bold hover:bg-primary-700 transition-colors mt-auto">
          Add to cart
        </button>
      </div>
    </div>
  );
}
