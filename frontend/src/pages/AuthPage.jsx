import { useState, useEffect, useRef, useCallback } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useAuth } from '@/context/AuthContext.jsx';
import { useRouter } from '@/context/RouterContext.jsx';
import { ErrorState } from '@/components/ui/index.jsx';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const ROLE_DASHBOARDS = {
  customer: '/app/customer',
  tenant: '/app/tenant',
  shop_manager: '/app/shop-manager',
  mall_manager: '/app/mall-manager',
  executive: '/app/executive',
  employee: '/app/employee',
};

export default function AuthPage() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const buttonSlot = useRef(null);

  const { loginWithGoogle } = useAuth();
  const { navigate } = useRouter();

  const goToDashboard = useCallback(
    (user) => navigate(ROLE_DASHBOARDS[user.role] || '/app/customer'),
    [navigate],
  );

  // The GIS script is loaded with async/defer, so it may not exist on first render.
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !buttonSlot.current) return undefined;
    let cancelled = false;
    let timer;

    const render = (attemptsLeft) => {
      if (cancelled) return;
      if (!window.google?.accounts?.id) {
        if (attemptsLeft > 0) {
          timer = setTimeout(() => render(attemptsLeft - 1), 150);
          return;
        }
        setError('Could not load Google sign-in. Check your internet connection.');
        return;
      }
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          setError('');
          setBusy(true);
          try {
            goToDashboard(await loginWithGoogle(response.credential));
          } catch (err) {
            setError(err.message || 'Google sign-in failed');
          } finally {
            setBusy(false);
          }
        },
      });
      window.google.accounts.id.renderButton(buttonSlot.current, {
        theme: 'outline',
        size: 'large',
        width: '320',
      });
    };

    render(40);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [goToDashboard, loginWithGoogle]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center">
            <ShoppingBag size={20} className="text-white" />
          </div>
          <h1 className="font-bold text-lg text-slate-900">Shopping Malls Management System</h1>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-1">Sign In</h2>
          <p className="text-sm text-slate-500 mb-5">Use your Google account to continue</p>

          {error && <div className="mb-4"><ErrorState message={error} /></div>}
          

          {GOOGLE_CLIENT_ID ? (
            <div className="flex justify-center">
              <div ref={buttonSlot} />
            </div>
          ) : (
            <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              Google sign-in is not configured. Set <code>VITE_GOOGLE_CLIENT_ID</code> in
              <code> frontend/.env</code>, then restart the dev server.
            </p>
          )}

          {busy && <p className="mt-3 text-center text-sm text-slate-500">Signing in…</p>}
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