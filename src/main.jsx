import React from 'react'
import ReactDOM from 'react-dom/client'
// cache-bust: 2026-07-05b
import App from '@/App.jsx'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
  <App />
  // </React.StrictMode>,
)

if ('serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    // Dev mode: do NOT register the service worker. Unregister any stale workers
    // and clear caches so stale dev JS (which loads a duplicate React copy and
    // breaks hooks like useState) is never served.
    window.addEventListener('load', () => {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => reg.unregister());
      }).catch(() => {});
      if (window.caches && caches.keys) {
        caches.keys().then((keys) => {
          keys.forEach((k) => caches.delete(k));
        }).catch(() => {});
      }
    });
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js');
    });
  }
}

if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:beforeUpdate' }, '*');
  });
  import.meta.hot.on('vite:afterUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:afterUpdate' }, '*');
  });
}