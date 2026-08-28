(function setupMapProviders(globalScope) {
  'use strict';

  const ESRI_IMAGERY_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
  const ESRI_LABELS_URL = 'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';
  const ESRI_TRANSPORT_URL = 'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}';
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

      const imageryBase = L.tileLayer(ESRI_IMAGERY_URL, {
        maxZoom: 19,
        attribution: ESRI_ATTRIBUTION
      });
      const transportOverlay = L.tileLayer(ESRI_TRANSPORT_URL, {
        maxZoom: 19,
        opacity: 0.78,
        attribution: 'Reference © Esri'
      });
      const labelsOverlay = L.tileLayer(ESRI_LABELS_URL, {
        maxZoom: 19,
        opacity: 0.95,
        attribution: 'Reference © Esri'
      });
      const satelliteLayer = L.layerGroup([imageryBase, transportOverlay, labelsOverlay]);

      const topographicLayer = L.tileLayer(TOPO_URL, {
        maxZoom: 17,
        attribution: TOPO_ATTRIBUTION
      });

      const attributionControl = L.control.attribution({ position: 'bottomright', prefix: false }).addTo(map);
      attributionControl.setPrefix(false);

      let activeLayer = satelliteLayer;
      satelliteLayer.addTo(map);

      globalScope.toggleMapType = function toggleMapType() {
        if (activeLayer === satelliteLayer) {
          map.removeLayer(satelliteLayer);
          topographicLayer.addTo(map);
          activeLayer = topographicLayer;
        } else {
          map.removeLayer(topographicLayer);
          satelliteLayer.addTo(map);
          activeLayer = satelliteLayer;
        }
      };

      globalScope.CescoMapProviders = Object.freeze({
        satellite: {
          imageryUrl: ESRI_IMAGERY_URL,
          labelsUrl: ESRI_LABELS_URL,
          transportationUrl: ESRI_TRANSPORT_URL,
          attribution: ESRI_ATTRIBUTION
        },
        topo: { url: TOPO_URL, attribution: TOPO_ATTRIBUTION }
      });
      return true;
    } catch (error) {
      console.warn('Provider mappa CescoSpot non inizializzati:', error);
      return false;
    }
  }

  function installWhenReady() {
    if (installProviders()) return;
    if (typeof document !== 'undefined' && document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', installProviders, { once: true });
    }
  }

  installWhenReady();
})(globalThis);
