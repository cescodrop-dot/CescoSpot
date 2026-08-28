(function setupMapProviders(globalScope) {
  'use strict';

  const ESRI_IMAGERY_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
  const TOPO_URL = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
  const ESRI_ATTRIBUTION = 'Tiles © Esri — Sources: Esri, Maxar, Earthstar Geographics, and the GIS User Community';
  const TOPO_ATTRIBUTION = 'Map data © OpenStreetMap contributors, SRTM | Map style © OpenTopoMap (CC-BY-SA)';

  function installProviders() {
    if (typeof L === 'undefined') return false;

    try {
      if (typeof map === 'undefined' || !map) return false;

      if (typeof satLayer !== 'undefined' && map.hasLayer(satLayer)) {
        map.removeLayer(satLayer);
      }
      if (typeof topoLayer !== 'undefined' && map.hasLayer(topoLayer)) {
        map.removeLayer(topoLayer);
      }

      const imageryLayer = L.tileLayer(ESRI_IMAGERY_URL, {
        maxZoom: 19,
        attribution: ESRI_ATTRIBUTION
      });
      const topographicLayer = L.tileLayer(TOPO_URL, {
        maxZoom: 17,
        attribution: TOPO_ATTRIBUTION
      });

      const attributionControl = L.control.attribution({ position: 'bottomright', prefix: false }).addTo(map);
      attributionControl.setPrefix(false);

      let activeLayer = imageryLayer;
      imageryLayer.addTo(map);

      globalScope.toggleMapType = function toggleMapType() {
        if (activeLayer === imageryLayer) {
          map.removeLayer(imageryLayer);
          topographicLayer.addTo(map);
          activeLayer = topographicLayer;
        } else {
          map.removeLayer(topographicLayer);
          imageryLayer.addTo(map);
          activeLayer = imageryLayer;
        }
      };

      globalScope.CescoMapProviders = Object.freeze({
        imagery: { url: ESRI_IMAGERY_URL, attribution: ESRI_ATTRIBUTION },
        topo: { url: TOPO_URL, attribution: TOPO_ATTRIBUTION }
      });
      return true;
    } catch (error) {
      console.warn('Provider mappa CescoSpot non inizializzati:', error);
      return false;
    }
  }

  let attempts = 0;
  const timer = globalScope.setInterval(() => {
    attempts += 1;
    if (installProviders() || attempts >= 100) {
      globalScope.clearInterval(timer);
    }
  }, 50);
})(globalThis);
