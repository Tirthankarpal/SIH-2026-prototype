import { registerSW } from 'virtual:pwa-register';

registerSW({
  onNeedRefresh() {
    // We could show a toast here to prompt the user to reload
    // For now, autoUpdate is set in vite.config.ts so it will reload quietly
    console.log('[PWA] New content available, please refresh.');
  },
  onOfflineReady() {
    console.log('[PWA] App is ready to work offline.');
  },
});
