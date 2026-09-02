(function installQuickDropFix(globalScope) {
  'use strict';

  function install() {
    globalScope.quickDropSpot = function quickDropSpot() {
      if (!globalScope.CescoStorageReadiness.ensureWriteReady()) return;
      if (!navigator.geolocation) {
        alert('GPS non disponibile.');
        return;
      }

      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const existingSpot = spots.find(spot => L.latLng(spot.lat, spot.lng).distanceTo(L.latLng(lat, lng)) < 20);
        if (existingSpot) {
          existingSpot.notes = `${existingSpot.notes || ''}${existingSpot.notes ? ' | ' : ''}Aggiornato al volo alle ${timeStr}`;
          if (!await persistSpots()) return;
          renderMapSpots();
          map.flyTo([lat, lng], 16);
          alert('⚡ Spot esistente aggiornato nelle vicinanze!');
          return;
        }

        const newSpot = {
          id: Date.now().toString(),
          name: `Spot Rapido (${timeStr})`,
          zone: 'In fase di rilevamento...',
          techniques: [],
          targets: [],
          spotLures: [],
          photo: '',
          radius: null,
          notes: `Salvato al volo alle ${timeStr}`,
          color: '#eab308',
          icon: '📍',
          lat,
          lng,
          catches: [],
          date: now.toLocaleDateString()
        };

        spots.push(newSpot);
        if (!await persistSpots()) {
          spots = spots.filter(spot => spot !== newSpot);
          return;
        }
        renderMapSpots();
        map.flyTo([lat, lng], 16);
        alert('⚡ Spot salvato al volo!');

        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`)
          .then(response => {
            if (!response.ok) throw new Error(`Reverse geocoding HTTP ${response.status}`);
            return response.json();
          })
          .then(async data => {
            if (!data || !data.address) return;
            const city = data.address.city || data.address.town || data.address.village || data.address.county || '';
            const state = data.address.state || '';
            newSpot.zone = [city, state].filter(Boolean).join(', ') || 'Generale';
            if (await persistSpots()) renderSavedSpotsUI();
          })
          .catch(error => {
            console.warn('Reverse geocoding spot rapido non disponibile:', error);
            newSpot.zone = 'Generale';
          });
      }, () => {
        alert('Attiva il GPS.');
      }, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once: true });
  } else {
    install();
  }
})(globalThis);
