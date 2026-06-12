import { useState, useEffect } from 'react';
import VendorLayout from './VendorLayout';
import Icon from '../../components/ui/Icon';
import { vendorAxios, vendorAPI } from '../../utils/api';
import { formatNGN } from '../../utils/currency';
import toast from 'react-hot-toast';

const BLANK = { name:'', description:'', price:'', category:'', stock:'', images:[], is_available:true };

export default function VendorProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | product obj
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);

  const load = () => vendorAxios.get('/vendor/products').then(r => setProducts(r.data || [])).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openAdd  = () => { setForm(BLANK); setModal('add'); };
  const openEdit = p  => { setForm({ ...p, price: p.price?.toString(), stock: p.stock?.toString()||'' }); setModal(p); };
  const close    = () => { setModal(null); setForm(BLANK); };
  const set = (k,v) => setForm(p => ({...p, [k]: v}));

  const addImage = async (file) => {
    if (!file) return;
    if ((form.images||[]).length >= 6) return toast.error('Maximum 6 images per product');
    setUploadingImg(true);
    try {
      const res = await vendorAPI.uploadProductImage(file);
      setForm(p => ({ ...p, images: [...(p.images||[]), res.data.url] }));
    } catch { toast.error('Image upload failed'); }
    finally { setUploadingImg(false); }
  };
  const removeImage = (idx) => setForm(p => ({ ...p, images: p.images.filter((_,i)=>i!==idx) }));
  const moveImage = (idx, dir) => setForm(p => {
    const imgs = [...p.images];
    const j = idx + dir;
    if (j < 0 || j >= imgs.length) return p;
    [imgs[idx], imgs[j]] = [imgs[j], imgs[idx]];
    return { ...p, images: imgs };
  });

  const save = async () => {
    if (!form.name.trim() || !form.price) return toast.error('Name and price are required');
    setSaving(true);
    try {
      const body = { ...form, price: Number(form.price), stock: form.stock ? Number(form.stock) : null };
      if (modal === 'add') await vendorAxios.post('/vendor/products', body);
      else await vendorAxios.put(`/vendor/products/${modal.id}`, body);
      toast.success(modal === 'add' ? 'Product added!' : 'Product updated!');
      load(); close();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!confirm('Delete this product?')) return;
    await vendorAxios.delete(`/vendor/products/${id}`).catch(() => {});
    toast.success('Product deleted'); load();
  };

  const toggle = async (p) => {
    await vendorAxios.put(`/vendor/products/${p.id}`, { is_available: !p.is_available });
    load();
  };

  return (
    <VendorLayout title="Products" subtitle="Manage your product listings">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-warm-500">{products.length} product{products.length !== 1 && 's'}</p>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors">
          <Icon name="Plus" size={16} /> Add product
        </button>
      </div>

      {loading
        ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_,i)=><div key={i} className="h-48 bg-purple-50 rounded-2xl animate-pulse"/>)}</div>
        : products.length === 0
          ? <div className="text-center py-20 text-warm-400">
              <Icon name="Package" size={48} className="mx-auto mb-4 text-purple-200" />
              <p className="font-semibold">No products yet</p>
              <p className="text-sm mt-1">Add your first product to start selling</p>
              <button onClick={openAdd} className="mt-4 px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold">Add product</button>
            </div>
          : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(p => (
                <div key={p.id} className="bg-white rounded-2xl border border-purple-100 overflow-hidden">
                  <div className="aspect-video bg-purple-50 relative">
                    {p.images?.[0]
                      ? <img src={p.images[0]} className="w-full h-full object-cover"/>
                      : <div className="w-full h-full flex items-center justify-center"><Icon name="Image" size={32} className="text-purple-200"/></div>}
                    {(p.images?.length||0) > 1 && (
                      <span className="absolute bottom-2 left-2 bg-black/50 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Icon name="Image" size={11}/> {p.images.length}
                      </span>
                    )}
                    <button onClick={() => toggle(p)}
                      className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold ${p.is_available ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                      {p.is_available ? 'Live' : 'Hidden'}
                    </button>
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-warm-900 truncate">{p.name}</p>
                    <p className="text-xs text-warm-400 mt-0.5 capitalize">{p.category||'General'} {p.stock !== null ? `· ${p.stock} in stock` : ''}</p>
                    <p className="text-lg font-bold text-primary-600 mt-2">{formatNGN(p.price)}</p>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => openEdit(p)} className="flex-1 py-2 rounded-xl border border-purple-200 text-xs font-semibold text-warm-600 hover:bg-purple-50">Edit</button>
                      <button onClick={() => del(p.id)} className="py-2 px-3 rounded-xl border border-red-100 text-xs font-semibold text-red-500 hover:bg-red-50"><Icon name="Trash" size={14}/></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
      }

      {/* Add/Edit modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-warm-900">{modal==='add' ? 'Add product' : 'Edit product'}</h3>
              <button onClick={close}><Icon name="X" size={20} className="text-warm-400"/></button>
            </div>
            <div className="space-y-4">
              {/* Image carousel manager */}
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">
                  Product photos (up to 6 — first photo is the cover)
                </label>
                <div className="flex gap-2 flex-wrap">
                  {(form.images||[]).map((img, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-purple-100 group flex-shrink-0">
                      <img src={img} className="w-full h-full object-cover"/>
                      {idx === 0 && (
                        <span className="absolute top-0.5 left-0.5 bg-primary-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">Cover</span>
                      )}
                      <button type="button" onClick={() => removeImage(idx)}
                        className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        ×
                      </button>
                      <div className="absolute bottom-0.5 left-0.5 right-0.5 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                        {idx > 0 && <button type="button" onClick={() => moveImage(idx,-1)} className="w-5 h-5 rounded bg-black/60 text-white text-xs">‹</button>}
                        {idx < form.images.length-1 && <button type="button" onClick={() => moveImage(idx,1)} className="w-5 h-5 rounded bg-black/60 text-white text-xs ml-auto">›</button>}
                      </div>
                    </div>
                  ))}
                  {(form.images||[]).length < 6 && (
                    <label className="w-20 h-20 rounded-xl border-2 border-dashed border-purple-200 flex items-center justify-center cursor-pointer hover:border-primary-300 transition-colors flex-shrink-0">
                      {uploadingImg
                        ? <span className="w-4 h-4 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin"/>
                        : <Icon name="Plus" size={20} className="text-purple-300"/>}
                      <input type="file" accept="image/*" className="hidden" disabled={uploadingImg}
                        onChange={e => { addImage(e.target.files?.[0]); e.target.value=''; }}/>
                    </label>
                  )}
                </div>
                <p className="text-xs text-warm-400 mt-1.5">Tap a photo to reorder or remove. The first photo shows as the cover everywhere.</p>
              </div>

              {[
                { key:'name', label:'Product name *', type:'text', placeholder:'e.g. Red velvet cake' },
                { key:'price', label:'Price (₦) *', type:'number', placeholder:'5000' },
                { key:'category', label:'Category', type:'text', placeholder:'cakes, flowers, chocolates...' },
                { key:'stock', label:'Stock quantity (leave blank = unlimited)', type:'number', placeholder:'' },
                { key:'description', label:'Description', type:'textarea', placeholder:'Describe your product...' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">{f.label}</label>
                  {f.type === 'textarea'
                    ? <textarea rows={3} value={form[f.key]} onChange={e=>set(f.key,e.target.value)} placeholder={f.placeholder} className="input w-full"/>
                    : <input type={f.type} value={form[f.key]} onChange={e=>set(f.key,e.target.value)} placeholder={f.placeholder} className="input w-full"/>}
                </div>
              ))}
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.is_available} onChange={e=>set('is_available',e.target.checked)} className="w-4 h-4 accent-primary-600"/>
                <span className="text-sm font-medium text-warm-700">Available for purchase</span>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={close} className="flex-1 py-3 rounded-xl border border-purple-200 text-sm font-semibold text-warm-600">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 py-3 rounded-xl bg-primary-600 text-white text-sm font-semibold disabled:opacity-60">
                {saving ? 'Saving...' : modal==='add' ? 'Add product' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </VendorLayout>
  );
}
