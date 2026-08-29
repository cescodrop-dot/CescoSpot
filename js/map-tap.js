(function installMapTap(globalScope) {
  'use strict';
  function create({ onSingleTap, schedule = globalScope.setTimeout, cancel = globalScope.clearTimeout, threshold = 320 }) {
    let pendingTimer = null;
    return Object.freeze({
      handleClick(event) {
        if (pendingTimer !== null) {
          cancel(pendingTimer);
          pendingTimer = null;
          return false;
        }
        // Leaflet events are transient interaction objects. Capture only the
        // coordinates now; never retain the event until the deferred callback.
        const lat = event?.latlng?.lat;
        const lng = event?.latlng?.lng;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
        pendingTimer = schedule(() => {
          pendingTimer = null;
          onSingleTap({ lat, lng });
        }, threshold);
        return true;
      },
      cancel() { if (pendingTimer !== null) cancel(pendingTimer); pendingTimer = null; },
      hasPendingTap() { return pendingTimer !== null; }
    });
  }
  globalScope.CescoMapTap = Object.freeze({ create });
})(globalThis);
