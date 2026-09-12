import { useState } from 'react';
import { Star, Plus } from 'lucide-react';
import { PageHeader, Badge, EmptyState } from '@/components/ui/index.jsx';
import Modal from '@/components/ui/Modal.jsx';
import {
  getProductsByStore, products, storeProducts, productImages
} from '@/lib/mockData.js';

export default function ProductsView({ stores }) {
  const [refresh, setRefresh] = useState(0);
  const [selectedStore, setSelectedStore] = useState(stores[0]?.store_id || '');
  const [showAdd, setShowAdd] = useState(false);
  const [newProduct, setNewProduct] = useState({ product_name: '', category: 'Fashion', price: '', imageUrl: '' });

  const store = stores.find(s => s.store_id === selectedStore) || stores[0];
  const storeProductList = store ? getProductsByStore(store.store_id) : [];

  const handleToggle = async (productId, currentShow) => {
    const sp = storeProducts.find(sp => sp.store_id === store.store_id && sp.product_id === productId);
    if (sp) sp.to_show = !currentShow;
    setRefresh(r => r + 1);
  };

  const handleAddProduct = () => {
    const productId = `p${Date.now()}`;
    products.push({
      product_id: productId,
      product_name: newProduct.product_name,
      category: newProduct.category,
      price: parseFloat(newProduct.price) || 0,
      imageUrl: newProduct.imageUrl || productImages.fashion[0],
    });
    storeProducts.push({
      store_id: store.store_id,
      product_id: productId,
      to_show: false,
    });
    setShowAdd(false);
    setNewProduct({ product_name: '', category: 'Fashion', price: '', imageUrl: '' });
    setRefresh(r => r + 1);
  };

  if (!store) return <EmptyState title="No stores" message="You don't have any stores yet." />;

  const CATEGORIES = ['Fashion', 'Electronics', 'Home & Decor', 'Beauty'];

  return (
    <div key={refresh}>
      <PageHeader
        title="Products"
        subtitle="Manage your product listings and top-selling flags"
        action={<button onClick={() => setShowAdd(true)} className="btn-primary text-sm"><Plus size={16} /> Add Product</button>}
      />
      {stores.length > 1 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {stores.map(s => (
            <button
              key={s.store_id}
              onClick={() => setSelectedStore(s.store_id)}
              className={`px-3 py-1.5 rounded-lg text-sm ${selectedStore === s.store_id ? 'bg-brand-600 text-white' : 'bg-white border border-slate-300 text-slate-600'}`}
            >
              {s.store_name}
            </button>
          ))}
        </div>
      )}

      <div className="card p-3 mb-4 bg-brand-50 border-brand-200">
        <p className="text-sm text-slate-600 flex items-center gap-2">
          <Star size={14} className="text-amber-500" />
          Toggle the star to feature products as "Top Selling"
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {storeProductList.map(product => (
          <div key={product.product_id} className="card overflow-hidden">
            <div className="relative h-32 overflow-hidden bg-slate-100">
              <img src={product.imageUrl} alt={product.product_name} className="w-full h-full object-cover" />
              <button
                onClick={() => handleToggle(product.product_id, product.to_show)}
                className={`absolute top-1.5 right-1.5 w-8 h-8 rounded-full flex items-center justify-center ${product.to_show ? 'bg-amber-500 text-white' : 'bg-white/80 text-slate-400'}`}
              >
                {product.to_show ? <Star size={14} fill="currentColor" /> : <Star size={14} />}
              </button>
            </div>
            <div className="p-3">
              <p className="text-xs text-slate-400">{product.category}</p>
              <h3 className="font-medium text-slate-800 text-sm">{product.product_name}</h3>
              <div className="flex items-center justify-between">
                <p className="font-semibold text-brand-600 text-sm">${product.price.toFixed(2)}</p>
                {product.to_show ? <Badge variant="warning">Top Selling</Badge> : <Badge variant="neutral">Hidden</Badge>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Product" size="md">
        <div className="space-y-4">
          <div>
            <label className="label">Product Name</label>
            <input className="input" value={newProduct.product_name} onChange={e => setNewProduct({ ...newProduct, product_name: e.target.value })} placeholder="e.g. Cotton Shirt" />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Price ($)</label>
            <input type="number" className="input" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} placeholder="e.g. 49.99" />
          </div>
          <div>
            <label className="label">Image URL (optional)</label>
            <input className="input" value={newProduct.imageUrl} onChange={e => setNewProduct({ ...newProduct, imageUrl: e.target.value })} placeholder="Leave blank for default" />
          </div>
          <button onClick={handleAddProduct} className="btn-primary w-full">Add Product</button>
        </div>
      </Modal>
    </div>
  );
}
