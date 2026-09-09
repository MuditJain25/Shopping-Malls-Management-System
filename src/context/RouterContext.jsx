import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const RouterContext = createContext(null);

export function RouterProvider({ children }) {
  const [route, setRoute] = useState(() => {
    const hash = window.location.hash.slice(1) || '/';
    return hash;
  });

  const navigate = useCallback((to) => {
    window.location.hash = to;
    setRoute(to);
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const handler = () => {
      setRoute(window.location.hash.slice(1) || '/');
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  return (
    <RouterContext.Provider value={{ route, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  return ctx;
}
