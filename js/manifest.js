(function generateManifest() {
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
  }

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

  const mobilePolishStyles = document.createElement('link');
  mobilePolishStyles.rel = 'stylesheet';
  mobilePolishStyles.href = 'styles/mobile-polish.css';
  document.head.appendChild(mobilePolishStyles);

  const weatherInsightsStyles = document.createElement('link');
  weatherInsightsStyles.rel = 'stylesheet';
  weatherInsightsStyles.href = 'styles/weather-insights.css';
  document.head.appendChild(weatherInsightsStyles);

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

  const weatherInsightsScript = document.createElement('script');
  weatherInsightsScript.src = 'js/weather-insights.js';
  document.head.appendChild(weatherInsightsScript);

  const wikiImagesScript = document.createElement('script');
  wikiImagesScript.src = 'js/wiki-images.js';
  document.head.appendChild(wikiImagesScript);

  const photoUploadScript = document.createElement('script');
  photoUploadScript.src = 'js/photo-upload.js';
  document.head.appendChild(photoUploadScript);

  const lightboxScript = document.createElement('script');
  lightboxScript.src = 'js/lightbox.js';
  document.head.appendChild(lightboxScript);

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(error => {
        console.warn('Service worker CescoSpot non registrato:', error);
      });
    });
  }
})();
