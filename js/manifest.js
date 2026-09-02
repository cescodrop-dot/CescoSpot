(function generateManifest() {
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover');
  }

  const manifest = {
    name: 'CescoSpot Pro',
    short_name: 'CescoSpot PRO',
    start_url: '.',
    display: 'standalone',
    background_color: '#070d1d',
    theme_color: '#070d1d',
    icons: [{ src: 'assets/images/app/map.png', sizes: '512x512', type: 'image/png' }]
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

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(error => {
        console.warn('Service worker CescoSpot non registrato:', error);
      });
    });
  }
})();
