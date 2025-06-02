// CSS imports
import '../styles/styles.css';
import '../styles/responsives.css';
import 'tiny-slider/dist/tiny-slider.css';
import 'leaflet/dist/leaflet.css';

// Override default Leaflet icon path agar tidak error 404
import L from 'leaflet';
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/images/marker-icon-2x.png',
  iconUrl: '/images/marker-icon.png',
  shadowUrl: '/images/marker-shadow.png',
});

// Components
import App from './pages/app';
import Camera from './utils/camera';
import { registerServiceWorkerAndSubscribe } from './utils';
import { getAccessToken } from './utils/auth';

document.addEventListener('DOMContentLoaded', async () => {
  const app = new App({
    content: document.getElementById('main-content'),
    drawerButton: document.getElementById('drawer-button'),
    drawerNavigation: document.getElementById('navigation-drawer'),
    skipLinkButton: document.getElementById('skip-link'),
  });
  await app.renderPage();

  // Daftarkan service worker & subscribe push notification setelah login
  if (getAccessToken()) {
    registerServiceWorkerAndSubscribe(getAccessToken());
  }

  // Daftarkan service worker untuk push notification
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => {
          console.log('Service Worker terdaftar:', reg);
        })
        .catch(err => {
          console.error('Service Worker gagal didaftarkan:', err);
        });
    });
  }

  window.addEventListener('hashchange', async () => {
    await app.renderPage();

    // Stop all active media
    Camera.stopAllStreams();
  });
});
