(function generateManifest() {
  const manifest = {
    name: 'CescoSpot Pro',
    short_name: 'CescoSpot PRO',
    start_url: '.',
    display: 'standalone',
    background_color: '#070d1d',
    theme_color: '#070d1d',
    icons: [{ src: 'map.png', sizes: '512x512', type: 'image/png' }]
  };

  const stringManifest = JSON.stringify(manifest);
  const blob = new Blob([stringManifest], { type: 'application/json' });
  document.getElementById('manifestLink').setAttribute('href', URL.createObjectURL(blob));

  const riverStatusScript = document.createElement('script');
  riverStatusScript.src = 'js/river-status.js';
  document.head.appendChild(riverStatusScript);

  const quickDropScript = document.createElement('script');
  quickDropScript.src = 'js/quick-drop.js';
  document.head.appendChild(quickDropScript);

  const mapProvidersScript = document.createElement('script');
  mapProvidersScript.src = 'js/map-providers.js';
  document.head.appendChild(mapProvidersScript);

  const modalAccessibilityScript = document.createElement('script');
  modalAccessibilityScript.src = 'js/modal-accessibility.js';
  document.head.appendChild(modalAccessibilityScript);

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(error => {
        console.warn('Service worker CescoSpot non registrato:', error);
      });
    });
  }
})();
