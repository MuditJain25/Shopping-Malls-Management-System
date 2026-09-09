import { useState } from 'react';
import { ShoppingBag, Mail, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext.jsx';
import { useRouter } from '@/context/RouterContext.jsx';
import { ErrorState } from '@/components/ui/index.jsx';

const ROLE_DASHBOARDS = {
  customer: '/app/customer',
  tenant: '/app/tenant',
  shop_manager: '/app/shop-manager',
  mall_manager: '/app/mall-manager',
  executive: '/app/executive',
  employee: '/app/employee',
};

const DEMO_ACCOUNTS = [
  { role: 'Customer', email: 'customer@demo.com', password: 'demo123' },
  { role: 'Tenant', email: 'tenant@demo.com', password: 'demo123' },
  { role: 'Shop Manager', email: 'shopmgr@demo.com', password: 'demo123' },
  { role: 'Mall Manager', email: 'mallmgr@demo.com', password: 'demo123' },
  { role: 'Executive', email: 'exec@demo.com', password: 'demo123' },
  { role: 'Employee', email: 'employee@demo.com', password: 'demo123' },
];

export default function AuthPage({ mode: initialMode }) {
  const [mode, setMode] = useState(initialMode || 'signin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'customer' });

  const { login, signup } = useAuth();
  const { navigate } = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signin') {
        const user = await login(form.email, form.password);
        navigate(ROLE_DASHBOARDS[user.role] || '/app/customer');
      } else {
        const user = await signup(form);
        navigate(ROLE_DASHBOARDS[user.role] || '/app/customer');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (account) => {
    setForm(f => ({ ...f, email: account.email, password: account.password }));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center">
            <ShoppingBag size={20} className="text-white" />
          </div>
          <h1 className="font-bold text-lg text-slate-900">MallHub</h1>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-1">
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </h2>
          <p className="text-sm text-slate-500 mb-5">
            {mode === 'signin' ? 'Sign in to access your dashboard' : 'Sign up to get started'}
          </p>

          {error && <div className="mb-4"><ErrorState message={error} /></div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">First Name</label>
                  <input
                    type="text"
                    required
                    value={form.firstName}
                    onChange={e => setForm({ ...form, firstName: e.target.value })}
                    className="input"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="label">Last Name</label>
                  <input
                    type="text"
                    required
                    value={form.lastName}
                    onChange={e => setForm({ ...form, lastName: e.target.value })}
                    className="input"
                    placeholder="Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="input pl-10"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="input pl-10 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="label">Account Type</label>
                <select
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  className="input"
                >
                  <option value="customer">Customer</option>
                  <option value="tenant">Tenant</option>
                  <option value="mall_manager">Mall Manager</option>
                  <option value="executive">Executive</option>
                  <option value="employee">Employee</option>
                </select>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
              className="text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>

        <div className="mt-5">
          <p className="text-xs text-slate-400 text-center mb-2">Quick demo access — click to fill</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {DEMO_ACCOUNTS.map(acc => (
              <button
                key={acc.email}
                onClick={() => fillDemo(acc)}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-600 hover:border-brand-300 hover:text-brand-600"
              >
                {acc.role}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 text-center">
          <button onClick={() => navigate('/')} className="text-sm text-slate-500 hover:text-slate-700">
            Back to home
          </button>
        </div>
      </div>
    </div>
  );
}
