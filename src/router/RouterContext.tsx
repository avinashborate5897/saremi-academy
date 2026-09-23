import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { APP_ROUTES, RouteConfig, PortalType, getPortalFromPath } from './routes';
import { useAuth } from '../context/AuthContext';
import { canAccessRoute } from '../lib/rbac';

interface RouterContextType {
  currentPath: string;
  portal: PortalType;
  activeRoute: RouteConfig;
  params: Record<string, string>;
  queryParams: Record<string, string>;
  navigate: (path: string, options?: { replace?: boolean }) => void;
  canAccess: (path: string) => boolean;
}

const RouterContext = createContext<RouterContextType | null>(null);

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    const raw = window.location.pathname || '/';
    return raw.length > 1 && raw.endsWith('/') ? raw.slice(0, -1) : raw;
  });
  const [queryParams, setQueryParams] = useState<Record<string, string>>(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  });

  const { role } = useAuth();

  const handlePopState = useCallback(() => {
    const raw = window.location.pathname || '/';
    const clean = raw.length > 1 && raw.endsWith('/') ? raw.slice(0, -1) : raw;
    setCurrentPath(clean);
    const searchParams = new URLSearchParams(window.location.search);
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    setQueryParams(params);
  }, []);

  useEffect(() => {
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [handlePopState]);

  const navigate = useCallback((path: string, options?: { replace?: boolean }) => {
    if (options?.replace) {
      window.history.replaceState({}, '', path);
    } else {
      window.history.pushState({}, '', path);
    }
    
    // Split path and query
    const [pathname, search] = path.split('?');
    const cleanPath = pathname && pathname.length > 1 && pathname.endsWith('/')
      ? pathname.slice(0, -1)
      : (pathname || '/');
    setCurrentPath(cleanPath);
    
    const parsedQueryParams: Record<string, string> = {};
    if (search) {
      const searchParams = new URLSearchParams(search);
      searchParams.forEach((value, key) => {
        parsedQueryParams[key] = value;
      });
    }
    setQueryParams(parsedQueryParams);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Match route & extract params
  const portal = getPortalFromPath(currentPath);

  const matchRoute = (): { route: RouteConfig; params: Record<string, string> } => {
    const segments = currentPath.split('/').filter(Boolean);

    for (const r of APP_ROUTES) {
      const rSegments = r.path.split('/').filter(Boolean);
      if (segments.length !== rSegments.length) continue;

      let match = true;
      const extractedParams: Record<string, string> = {};

      for (let i = 0; i < rSegments.length; i++) {
        if (rSegments[i].startsWith(':')) {
          const paramName = rSegments[i].slice(1);
          extractedParams[paramName] = segments[i];
        } else if (rSegments[i] !== segments[i]) {
          match = false;
          break;
        }
      }

      if (match) {
        return { route: r, params: extractedParams };
      }
    }

    // Default to root or generic fallback
    const fallbackRoute = APP_ROUTES.find((r) => r.path === '/') || APP_ROUTES[0];
    return { route: fallbackRoute, params: {} };
  };

  const { route: activeRoute, params } = matchRoute();

  const checkCanAccess = useCallback(
    (path: string) => {
      return canAccessRoute(role, path);
    },
    [role]
  );

  return (
    <RouterContext.Provider
      value={{
        currentPath,
        portal,
        activeRoute,
        params,
        queryParams,
        navigate,
        canAccess: checkCanAccess
      }}
    >
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
};
