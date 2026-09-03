(function generateManifest() {
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
  }

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
