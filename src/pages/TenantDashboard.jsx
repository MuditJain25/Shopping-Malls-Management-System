import { useState, useEffect } from 'react';
import {
  Store, Package, Users, FileText, BarChart3, Home,
  Plus, Star, DollarSign, TrendingUp, Calendar, Phone, Mail,
  Eye, EyeOff, Building2, Download, Trash2, Clock, CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext.jsx';
import { useRouter } from '@/context/RouterContext.jsx';
import { PageHeader, StatCard, DataTable, Badge, EmptyState, LoadingSpinner, ErrorState } from '@/components/ui/index.jsx';
import Modal from '@/components/ui/Modal.jsx';
import {
  getTenantById, getStoresByTenant, getProductsByStore, getEmployeesByStore,
  getTransactionsByTenant, getRevenueByTenant, getMallById,
  tenants, stores, employees, storeProducts, products,
  getStoreById, getProductById, revenueInfo,
  getLeaveRequestsByStore, getAttendanceByStore, getEmployeeById,
  leaveRequests, attendanceRecords, productImages
} from '@/lib/mockData.js';
import {
  apiGetStoresByTenant, apiGetProductsByStore, apiGetEmployeesByStore,
  apiGetTransactionsByTenant, apiGetRevenueByTenant, apiToggleProductVisibility,
  apiAddEmployee, apiSubmitRevenue
} from '@/lib/api.js';

export default function TenantDashboard({ role = 'tenant' }) {
  const { user } = useAuth();
  const { route } = useRouter();

  if (!user) return <LoadingSpinner />;

  const isShopManager = role === 'shop_manager';
  const tenantId = isShopManager ? null : user.profileId;
  const allStores = isShopManager
    ? [getStoreById('s1')].filter(Boolean)
    : getStoresByTenant(tenantId);

  const shopManagerStore = isShopManager
    ? stores.find(s => s.store_id === 's1')
    : null;

  const activeStores = isShopManager ? [shopManagerStore].filter(Boolean) : allStores;

  const pageKey = route.split('/').pop() || (isShopManager ? 'shop-manager' : 'tenant');

  if (pageKey === (isShopManager ? 'shop-manager' : 'tenant') || pageKey === '') {
    return <Overview role={role} stores={activeStores} tenantId={tenantId} />;
  }
  if (pageKey === 'stores' || pageKey === 'store') {
    return <StoresView stores={activeStores} />;
  }
  if (pageKey === 'products') {
    return <ProductsView stores={activeStores} />;
  }
  if (pageKey === 'employees') {
    return <EmployeesView stores={activeStores} />;
  }
  if (pageKey === 'leave') {
    return <LeaveView stores={activeStores} />;
  }
  if (pageKey === 'transactions') {
    return <TransactionsView tenantId={tenantId} isShopManager={isShopManager} stores={activeStores} />;
  }
  if (pageKey === 'revenue') {
    return <RevenueView tenantId={tenantId} />;
  }
  return <Overview role={role} stores={activeStores} tenantId={tenantId} />;
}

// ════════════════════════════════════════════════════════════════
function Overview({ role, stores, tenantId }) {
  const { user } = useAuth();
  const isShopManager = role === 'shop_manager';
  const allEmployees = stores.flatMap(s => getEmployeesByStore(s.store_id));
  const allProducts = stores.flatMap(s => getProductsByStore(s.store_id));
  const topProducts = allProducts.filter(p => p.to_show);
  const transactions = isShopManager ? [] : getTransactionsByTenant(tenantId);
  const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user.firstName}`}
        subtitle={isShopManager ? `Managing ${stores[0]?.store_name}` : `${stores.length} stores across malls`}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Store} label="Active Stores" value={stores.length} color="brand" />
        <StatCard icon={Users} label="Employees" value={allEmployees.length} color="success" />
        <StatCard icon={Package} label="Total Products" value={allProducts.length} color="accent" />
        <StatCard icon={Star} label="Top Selling" value={topProducts.length} color="warning" />
      </div>

      {!isShopManager && (
        <div className="card p-5 mb-6">
          <h3 className="font-semibold text-slate-900 text-sm mb-2">Total Rent Paid</h3>
          <p className="text-2xl font-bold text-slate-900">${totalRevenue.toLocaleString()}</p>
          <p className="text-sm text-slate-500 mt-1">{transactions.length} transactions</p>
        </div>
      )}

      <h3 className="font-semibold text-slate-900 mb-4">Your Stores</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stores.map(store => {
          const mall = getMallById(store.mall_id);
          const storeEmps = getEmployeesByStore(store.store_id);
          const storeProds = getProductsByStore(store.store_id);
          return (
            <div key={store.store_id} className="card p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Store size={18} className="text-brand-600" />
                  <div>
                    <h4 className="font-medium text-slate-900 text-sm">{store.store_name}</h4>
                    <p className="text-xs text-slate-400">{mall?.city} · Floor {store.floor}</p>
                  </div>
                </div>
                <Badge variant={store.status === 'occupied' ? 'success' : 'warning'}>{store.status}</Badge>
              </div>
              <div className="flex gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Users size={12} /> {storeEmps.length} emps</span>
                <span className="flex items-center gap-1"><Package size={12} /> {storeProds.length} products</span>
                <span className="flex items-center gap-1"><Star size={12} /> {storeProds.filter(p => p.to_show).length} top</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
function StoresView({ stores }) {
  return (
    <div>
      <PageHeader title="My Stores" subtitle="All stores you operate" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stores.map(store => {
          const mall = getMallById(store.mall_id);
          return (
            <div key={store.store_id} className="card overflow-hidden">
              <img src={store.listing_media[0]} alt={store.store_name} className="w-full h-32 object-cover" />
              <div className="p-4">
                <h3 className="font-semibold text-slate-900 text-sm mb-1">{store.store_name}</h3>
                <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
                  <Building2 size={12} /> {mall?.city}, {mall?.state} · Shop {store.shop_number}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2.5 rounded-lg bg-slate-50">
                    <p className="text-slate-400 text-xs">Floor</p>
                    <p className="font-medium text-slate-800 text-sm">Floor {store.floor}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50">
                    <p className="text-slate-400 text-xs">Area</p>
                    <p className="font-medium text-slate-800 text-sm">{store.area_sqft} sqft</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
function ProductsView({ stores }) {
  const { user } = useAuth();
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

// ════════════════════════════════════════════════════════════════
function EmployeesView({ stores }) {
  const [showAdd, setShowAdd] = useState(false);
  const [selectedStore, setSelectedStore] = useState(stores[0]?.store_id || '');
  const [newEmp, setNewEmp] = useState({ first_name: '', last_name: '', email: '', base_salary: '', current_designation: '', phone_number: '' });
  const [refresh, setRefresh] = useState(0);
  const [empToRemove, setEmpToRemove] = useState(null);
  const [empForAttendance, setEmpForAttendance] = useState(null);

  const store = stores.find(s => s.store_id === selectedStore) || stores[0];
  const emps = store ? getEmployeesByStore(store.store_id) : [];

  const handleAdd = async () => {
    employees.push({
      ...newEmp,
      employee_id: `e${Date.now()}`,
      store_id: store.store_id,
      mall_id: store.mall_id,
      date_of_joining: new Date().toISOString().split('T')[0],
      base_salary: parseFloat(newEmp.base_salary) || 0,
    });
    setShowAdd(false);
    setNewEmp({ first_name: '', last_name: '', email: '', base_salary: '', current_designation: '', phone_number: '' });
    setRefresh(r => r + 1);
  };

  const handleRemove = () => {
    const idx = employees.findIndex(e => e.employee_id === empToRemove.employee_id);
    if (idx >= 0) employees.splice(idx, 1);
    setEmpToRemove(null);
    setRefresh(r => r + 1);
  };

  if (!store) return <EmptyState title="No stores" message="You don't have any stores yet." />;

  return (
    <div key={refresh}>
      <PageHeader
        title="Employees"
        subtitle="Track employees under your stores"
        action={<button onClick={() => setShowAdd(true)} className="btn-primary text-sm"><Plus size={16} /> Add Employee</button>}
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

      <div className="card overflow-hidden">
        <DataTable
          columns={[
            { key: 'name', label: 'Name', render: e => <button onClick={() => setEmpForAttendance(e)} className="font-medium text-brand-700 hover:text-brand-800 hover:underline">{e.first_name} {e.last_name}</button> },
            { key: 'designation', label: 'Designation', render: e => <Badge variant="brand">{e.current_designation}</Badge> },
            { key: 'email', label: 'Email', render: e => <span className="text-slate-600">{e.email}</span> },
            { key: 'phone', label: 'Phone', render: e => <span className="text-slate-600">{e.phone_number}</span> },
            { key: 'salary', label: 'Base Salary', render: e => <span className="font-medium text-slate-800">${e.base_salary.toLocaleString()}</span> },
            { key: 'joined', label: 'Joined', render: e => <span className="text-slate-500">{e.date_of_joining}</span> },
            { key: 'actions', label: '', render: e => (
              <button onClick={() => setEmpToRemove(e)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50" title="Remove employee">
                <Trash2 size={14} />
              </button>
            )},
          ]}
          rows={emps}
          emptyMessage="No employees hired for this store yet."
        />
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Employee" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">First Name</label>
              <input className="input" value={newEmp.first_name} onChange={e => setNewEmp({ ...newEmp, first_name: e.target.value })} />
            </div>
            <div>
              <label className="label">Last Name</label>
              <input className="input" value={newEmp.last_name} onChange={e => setNewEmp({ ...newEmp, last_name: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={newEmp.email} onChange={e => setNewEmp({ ...newEmp, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone Number</label>
            <input className="input" value={newEmp.phone_number} onChange={e => setNewEmp({ ...newEmp, phone_number: e.target.value })} />
          </div>
          <div>
            <label className="label">Designation</label>
            <input className="input" value={newEmp.current_designation} onChange={e => setNewEmp({ ...newEmp, current_designation: e.target.value })} placeholder="e.g. Sales Associate" />
          </div>
          <div>
            <label className="label">Base Salary ($)</label>
            <input type="number" className="input" value={newEmp.base_salary} onChange={e => setNewEmp({ ...newEmp, base_salary: e.target.value })} />
          </div>
          <button onClick={handleAdd} className="btn-primary w-full">Add Employee</button>
        </div>
      </Modal>

      <Modal open={!!empForAttendance} onClose={() => setEmpForAttendance(null)} title={empForAttendance ? `Attendance — ${empForAttendance.first_name} ${empForAttendance.last_name}` : 'Attendance'} size="md">
        <EmployeeAttendanceRecords employeeId={empForAttendance?.employee_id} />
      </Modal>

      <Modal open={!!empToRemove} onClose={() => setEmpToRemove(null)} title="Remove Employee" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to remove <span className="font-medium text-slate-800">{empToRemove?.first_name} {empToRemove?.last_name}</span> from this store?
          </p>
          <div className="flex gap-3">
            <button onClick={() => setEmpToRemove(null)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleRemove} className="btn bg-red-600 text-white hover:bg-red-700 flex-1 px-4 py-2 text-sm font-semibold rounded-lg">Remove</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
function EmployeeAttendanceRecords({ employeeId }) {
  if (!employeeId) return null;
  const records = attendanceRecords.filter(a => a.e_id === employeeId);
  if (records.length === 0) return <EmptyState icon={Clock} title="No attendance records" message="This employee has no attendance history yet." />;
  return (
    <div className="space-y-2 max-h-80 overflow-y-auto">
      {records.map(a => (
        <div key={a.attendance_id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center">
              <Calendar size={16} className="text-brand-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800">{a.date}</p>
              <p className="text-xs text-slate-400">{a.check_in_time || '—'} → {a.check_out_time || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {a.check_in_time && a.check_out_time ? (
              <span className="text-sm font-medium text-slate-700">{(() => {
                const [ih, im] = a.check_in_time.split(':').map(Number);
                const [oh, om] = a.check_out_time.split(':').map(Number);
                const mins = (oh * 60 + om) - (ih * 60 + im);
                return (mins / 60).toFixed(1);
              })()}h</span>
            ) : (
              <span className="text-xs text-slate-400">—</span>
            )}
            {a.check_out_time ? <Badge variant="success">Complete</Badge> : <Badge variant="warning">In Progress</Badge>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
function LeaveView({ stores }) {
  const [selectedStore, setSelectedStore] = useState(stores[0]?.store_id || '');
  const [refresh, setRefresh] = useState(0);

  const store = stores.find(s => s.store_id === selectedStore) || stores[0];
  const leaveReqs = store ? getLeaveRequestsByStore(store.store_id) : [];

  const handleApprove = (requestId) => {
    const req = leaveRequests.find(l => l.request_id === requestId);
    if (req) req.status = 'approved';
    setRefresh(r => r + 1);
  };

  const handleReject = (requestId) => {
    const req = leaveRequests.find(l => l.request_id === requestId);
    if (req) req.status = 'rejected';
    setRefresh(r => r + 1);
  };

  if (!store) return <EmptyState title="No stores" message="You don't have any stores yet." />;

  return (
    <div key={refresh}>
      <PageHeader title="Leave Requests" subtitle="Review and approve leave requests from your employees" />
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

      {leaveReqs.length === 0 ? (
        <EmptyState icon={FileText} title="No leave requests" message="No leave requests from employees in this store." />
      ) : (
        <div className="space-y-3">
          {leaveReqs.map(lr => {
            const emp = getEmployeeById(lr.e_id);
            return (
              <div key={lr.request_id} className="card p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{emp ? `${emp.first_name} ${emp.last_name}` : lr.e_id}</p>
                    <p className="text-xs text-slate-400">{emp?.current_designation || ''}</p>
                  </div>
                  {lr.status === 'approved' && <Badge variant="success"><CheckCircle2 size={12} /> Approved</Badge>}
                  {lr.status === 'rejected' && <Badge variant="error"><XCircle size={12} /> Rejected</Badge>}
                  {lr.status === 'pending' && <Badge variant="warning"><AlertCircle size={12} /> Pending</Badge>}
                </div>
                <div className="text-sm text-slate-600 mb-2">
                  <span className="text-slate-500">Dates: </span>
                  {lr.start_date} → {lr.end_date}
                </div>
                <p className="text-sm text-slate-500 mb-3">{lr.reason}</p>
                {lr.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(lr.request_id)} className="btn bg-green-600 text-white hover:bg-green-700 px-4 py-1.5 text-sm font-semibold rounded-lg">
                      <CheckCircle2 size={14} /> Approve
                    </button>
                    <button onClick={() => handleReject(lr.request_id)} className="btn bg-red-600 text-white hover:bg-red-700 px-4 py-1.5 text-sm font-semibold rounded-lg">
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
function TransactionsView({ tenantId, isShopManager, stores }) {
  const transactions = isShopManager
    ? stores.flatMap(s => getTransactionsByTenant(getTenantByStore(s)?.tenant_id || '')).filter(Boolean)
    : getTransactionsByTenant(tenantId);

  const shopMgrTransactions = isShopManager
    ? stores.flatMap(s => {
        const tenant = tenants.find(t => t.store_ids.includes(s.store_id));
        return tenant ? getTransactionsByTenant(tenant.tenant_id) : [];
      })
    : transactions;

  const displayTransactions = isShopManager ? shopMgrTransactions : transactions;

  return (
    <div>
      <PageHeader title="Transactions" subtitle="Store transaction history with the mall" />
      <div className="card overflow-hidden">
        <DataTable
          columns={[
            { key: 'transaction_id', label: 'ID', render: t => <span className="text-slate-400 font-mono text-xs">{t.transaction_id}</span> },
            { key: 'sender', label: 'From', render: t => <span className="font-medium text-slate-800">{t.sender}</span> },
            { key: 'receiver', label: 'To', render: t => <span className="text-slate-600">{t.receiver}</span> },
            { key: 'amount', label: 'Amount', render: t => <span className="font-semibold text-green-600">${t.amount.toLocaleString()}</span> },
            { key: 'date', label: 'Date', render: t => <span className="text-slate-500">{t.transaction_date}</span> },
            { key: 'remarks', label: 'Remarks', render: t => <span className="text-slate-500 text-xs">{t.remarks}</span> },
          ]}
          rows={displayTransactions}
          emptyMessage="No transactions recorded yet."
        />
      </div>

      <h3 className="font-semibold text-slate-900 mt-8 mb-4">Mall Agreement / Documents</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stores.map(store => {
          const mall = getMallById(store.mall_id);
          return (
            <div key={store.store_id} className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText size={16} className="text-brand-600" />
                <div>
                  <h4 className="font-medium text-slate-900 text-sm">{store.store_name}</h4>
                  <p className="text-xs text-slate-400">{mall?.city}, {mall?.state}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Agreement Type</span>
                  <span className="font-medium text-slate-700">Lease Agreement</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Monthly Rent</span>
                  <span className="font-medium text-slate-700">${(store.area_sqft * 5).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <Badge variant="success">Active</Badge>
                </div>
              </div>
              <button className="btn-secondary w-full mt-3 text-sm">
                <Download size={14} /> View Agreement
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getTenantByStore(store) {
  return tenants.find(t => t.store_ids.includes(store.store_id));
}

// ════════════════════════════════════════════════════════════════
function RevenueView({ tenantId }) {
  const [showSubmit, setShowSubmit] = useState(false);
  const [newReport, setNewReport] = useState({ description: '', month: '', amount: '' });
  const [refresh, setRefresh] = useState(0);

  const reports = getRevenueByTenant(tenantId);
  const totalRevenue = reports.reduce((sum, r) => sum + r.amount, 0);

  const handleSubmit = async () => {
    revenueInfo.push({
      tenant_id: tenantId,
      information_id: `ri${Date.now()}`,
      description: newReport.description,
      month: newReport.month,
      amount: parseFloat(newReport.amount),
      submitted_date: new Date().toISOString().split('T')[0],
    });
    setShowSubmit(false);
    setNewReport({ description: '', month: '', amount: '' });
    setRefresh(r => r + 1);
  };

  return (
    <div key={refresh}>
      <PageHeader
        title="Revenue Reports"
        subtitle="Share revenue information with the mall"
        action={<button onClick={() => setShowSubmit(true)} className="btn-primary text-sm"><Plus size={16} /> Submit Report</button>}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-sm text-slate-500 mb-1">Total Revenue Reported</p>
          <p className="text-xl font-bold text-slate-900">${totalRevenue.toLocaleString()}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-500 mb-1">Reports Submitted</p>
          <p className="text-xl font-bold text-slate-900">{reports.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-500 mb-1">Avg Monthly Revenue</p>
          <p className="text-xl font-bold text-slate-900">${reports.length ? Math.round(totalRevenue / reports.length).toLocaleString() : 0}</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <DataTable
          columns={[
            { key: 'month', label: 'Month', render: r => <span className="font-medium text-slate-800">{r.month}</span> },
            { key: 'description', label: 'Description', render: r => <span className="text-slate-600">{r.description}</span> },
            { key: 'amount', label: 'Amount', render: r => <span className="font-semibold text-green-600">${r.amount.toLocaleString()}</span> },
            { key: 'submitted_date', label: 'Submitted', render: r => <span className="text-slate-500">{r.submitted_date}</span> },
          ]}
          rows={reports}
          emptyMessage="No revenue reports submitted yet."
        />
      </div>

      <Modal open={showSubmit} onClose={() => setShowSubmit(false)} title="Submit Revenue Report" size="md">
        <div className="space-y-4">
          <div>
            <label className="label">Month</label>
            <input className="input" value={newReport.month} onChange={e => setNewReport({ ...newReport, month: e.target.value })} placeholder="e.g. September 2026" />
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input" value={newReport.description} onChange={e => setNewReport({ ...newReport, description: e.target.value })} placeholder="e.g. September 2026 revenue report" />
          </div>
          <div>
            <label className="label">Revenue Amount ($)</label>
            <input type="number" className="input" value={newReport.amount} onChange={e => setNewReport({ ...newReport, amount: e.target.value })} />
          </div>
          <button onClick={handleSubmit} className="btn-primary w-full">Submit Report</button>
        </div>
      </Modal>
    </div>
  );
}
