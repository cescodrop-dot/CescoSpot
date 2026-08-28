(function setupRiverStatus(globalScope) {
  'use strict';

  function classifyRiverStatus(values, todayIndex = 2) {
    if (!Array.isArray(values) || values.length === 0) {
      return {
        available: false,
        status: 'Dati idrologici non disponibili',
        trend: 'Non disponibile',
        tone: 'muted',
        icon: 'fa-circle-info',
        current: null,
        relativeChange: null
      };
    }

    const normalized = values.map(value => {
      if (value === null || value === undefined || value === '') return null;
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
    });
    const safeTodayIndex = Math.min(Math.max(todayIndex, 0), normalized.length - 1);
    const current = normalized[safeTodayIndex];
    const history = normalized.slice(0, safeTodayIndex).filter(Number.isFinite);

    if (!Number.isFinite(current) || history.length === 0) {
      return {
        available: false,
        status: 'Dati idrologici insufficienti',
        trend: 'Non disponibile',
        tone: 'muted',
        icon: 'fa-circle-info',
        current: Number.isFinite(current) ? current : null,
        relativeChange: null
      };
    }

    const baseline = history.reduce((sum, value) => sum + value, 0) / history.length;
    const relativeChange = (current - baseline) / Math.max(Math.abs(baseline), 1);

    if (relativeChange >= 0.35) {
      return { available: true, status: 'Portata in forte aumento', trend: 'Forte aumento', tone: 'danger', icon: 'fa-triangle-exclamation', current, relativeChange };
    }
    if (relativeChange >= 0.12) {
      return { available: true, status: 'Portata in aumento', trend: 'In aumento', tone: 'warning', icon: 'fa-arrow-trend-up', current, relativeChange };
    }
    if (relativeChange <= -0.35) {
      return { available: true, status: 'Portata in forte diminuzione', trend: 'Forte calo', tone: 'info', icon: 'fa-arrow-trend-down', current, relativeChange };
    }
    if (relativeChange <= -0.12) {
      return { available: true, status: 'Portata in diminuzione', trend: 'In diminuzione', tone: 'info', icon: 'fa-arrow-trend-down', current, relativeChange };
    }

    return { available: true, status: 'Portata relativamente stabile', trend: 'Stabile', tone: 'info', icon: 'fa-water', current, relativeChange };
  }

  function renderRiverStatus(values) {
    if (typeof document === 'undefined') return;
    const statusEl = document.getElementById('riverStatusText');
    const iconEl = document.getElementById('riverTrendIcon');
    const trendEl = document.getElementById('riverTrend');
    const dischargeEl = document.getElementById('riverDischarge');
    if (!statusEl || !iconEl || !trendEl || !dischargeEl) return;

    const result = classifyRiverStatus(values, 2);
    const colors = {
      danger: 'var(--accent-red)',
      warning: 'var(--accent-amber)',
      info: 'var(--accent-light-blue)',
      muted: 'var(--text-muted)'
    };
    const color = colors[result.tone] || colors.muted;

    dischargeEl.innerText = Number.isFinite(result.current) ? `${result.current.toFixed(1)} m³/s` : '-- m³/s';
    statusEl.innerText = result.status;
    statusEl.style.color = color;
    trendEl.innerText = result.trend;
    trendEl.style.color = color;
    iconEl.innerHTML = `<i class="fa-solid ${result.icon}" style="color:${color};"></i>`;
  }

  function installFloodResponseObserver() {
    if (typeof document === 'undefined' || typeof globalScope.fetch !== 'function') return;
    const nativeFetch = globalScope.fetch.bind(globalScope);

    globalScope.fetch = function cescoFetch(...args) {
      return nativeFetch(...args).then(response => {
        const request = args[0];
        const url = typeof request === 'string' ? request : request && request.url;
        if (typeof url === 'string' && url.includes('flood-api.open-meteo.com')) {
          response.clone().json()
            .then(payload => {
              const values = payload?.daily?.river_discharge;
              setTimeout(() => renderRiverStatus(values), 0);
              setTimeout(() => renderRiverStatus(values), 150);
            })
            .catch(() => setTimeout(() => renderRiverStatus([]), 0));
        }
        return response;
      });
    };
  }

  globalScope.CescoRiverStatus = Object.freeze({ classifyRiverStatus, renderRiverStatus });
  installFloodResponseObserver();
})(globalThis);
