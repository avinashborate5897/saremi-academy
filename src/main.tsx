import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Only register Service Worker in production build to avoid dev proxy / iframe conflicts
if (import.meta.env.PROD) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({ 
      immediate: true,
      onNeedRefresh() {
        console.log('[PWA] New content available, updating service worker...');
      },
      onOfflineReady() {
        console.log('[PWA] Application cached and ready for offline usage!');
      }
    });
  }).catch((err) => {
    console.warn('[PWA] Service worker registration notice:', err);
  });
} else if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  // Clear any existing service worker in dev/preview mode
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister().catch(() => {});
    }
  }).catch(() => {});
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

