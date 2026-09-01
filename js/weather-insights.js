(function setupWeatherInsights(globalScope) {
  'use strict';

  const CARD_ID = 'weatherFieldConditions';
  let latestGeneration = 0;

  const compass = degrees => {
    const dirs = ['N','NE','E','SE','S','SO','O','NO'];
    return dirs[Math.round((((Number(degrees) || 0) % 360) / 45)) % 8];
  };

  const valueAt = (series, index, fallback = null) => {
    if (!Array.isArray(series) || index < 0 || index >= series.length) return fallback;
    const value = series[index];
    return value === null || value === undefined ? fallback : value;
  };

  function ensureCard() {
    const tab = document.getElementById('tabForecasts');
    if (!tab) return null;
    let card = document.getElementById(CARD_ID);
    if (card) return card;

    card = document.createElement('div');
    card.id = CARD_ID;
    card.className = 'widget-card field-conditions-card';
    card.innerHTML = `
      <div class="widget-title"><i class="fa-solid fa-location-crosshairs"></i> Condizioni sul posto</div>
      <p class="field-conditions-note">Indicatori meteo osservabili, senza punteggi di pescabilità.</p>
      <div class="field-conditions-grid">
        <div class="field-condition"><span>Vento</span><strong id="fieldWind">--</strong><small id="fieldWindDir">--</small></div>
        <div class="field-condition"><span>Raffiche</span><strong id="fieldGust">--</strong><small>km/h</small></div>
        <div class="field-condition"><span>Pioggia 3h</span><strong id="fieldRain3h">--</strong><small id="fieldRainChance">prob. --</small></div>
        <div class="field-condition"><span>Pressione</span><strong id="fieldPressure">--</strong><small id="fieldPressureTrend">trend --</small></div>
      </div>
    `;

    const hourlyCard = document.getElementById('hourlyForecastTrack')?.closest('.widget-card');
    if (hourlyCard) hourlyCard.before(card);
    else tab.querySelector('.tab-inner')?.appendChild(card);
    return card;
  }

  function render(data) {
    ensureCard();
    if (!data?.current || !data?.hourly?.time) return;

    const now = new Date();
    let index = data.hourly.time.findIndex(t => new Date(t) >= now);
    if (index < 0) index = 0;

    const wind = Math.round(data.current.wind_speed_10m ?? 0);
    const gust = Math.round(data.current.wind_gusts_10m ?? wind);
    const dirDeg = data.current.wind_direction_10m ?? 0;
    const pressure = Math.round(data.current.surface_pressure ?? 0);

    let rain3h = 0;
    let maxChance = 0;
    for (let i = index; i < Math.min(index + 3, data.hourly.time.length); i++) {
      rain3h += Number(valueAt(data.hourly.precipitation, i, 0));
      maxChance = Math.max(maxChance, Number(valueAt(data.hourly.precipitation_probability, i, 0)));
    }

    const pLater = valueAt(data.hourly.surface_pressure, Math.min(index + 3, data.hourly.time.length - 1), pressure);
    const delta = Number(pLater) - Number(pressure);
    const pressureTrend = delta >= 1 ? `+${delta.toFixed(1)} hPa / 3h` : delta <= -1 ? `${delta.toFixed(1)} hPa / 3h` : 'stabile 3h';

    document.getElementById('fieldWind').textContent = `${wind} km/h`;
    document.getElementById('fieldWindDir').textContent = `${compass(dirDeg)} · ${Math.round(dirDeg)}°`;
    document.getElementById('fieldGust').textContent = `${gust}`;
    document.getElementById('fieldRain3h').textContent = `${rain3h.toFixed(1)} mm`;
    document.getElementById('fieldRainChance').textContent = `prob. max ${Math.round(maxChance)}%`;
    document.getElementById('fieldPressure').textContent = `${pressure} hPa`;
    document.getElementById('fieldPressureTrend').textContent = pressureTrend;
  }

  function validSnapshot(snapshot) {
    const lat = Number(snapshot?.lat);
    const lng = Number(snapshot?.lng);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }

  function refresh(snapshot, generation, isCurrentRefresh = () => true) {
    const coordinates = validSnapshot(snapshot);
    if (!coordinates) return Promise.resolve(false);
    latestGeneration = Math.max(latestGeneration, Number(generation) || 0);
    const current = () => generation === latestGeneration && isCurrentRefresh();
    const params = new URLSearchParams({
      latitude: coordinates.lat,
      longitude: coordinates.lng,
      current: 'wind_speed_10m,wind_gusts_10m,wind_direction_10m,surface_pressure',
      hourly: 'precipitation,precipitation_probability,surface_pressure',
      forecast_days: '2',
      timezone: 'auto'
    });

    return fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then(data => {
        if (!current()) return false;
        render(data);
        return true;
      })
      .catch(error => {
        if (!current()) return false;
        ensureCard();
        const note = document.querySelector(`#${CARD_ID} .field-conditions-note`);
        if (note) note.textContent = 'Riepilogo rapido temporaneamente non disponibile.';
        console.warn('Condizioni meteo rapide non disponibili:', error);
        return false;
      });
  }

  globalScope.CescoWeatherInsights = { ensureCard, refresh };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureCard, { once: true });
  } else {
    ensureCard();
  }
})(globalThis);
