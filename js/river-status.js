(function setupRiverStatus() {
  function classifyRiverStatus(values) {
    const discharges = Array.isArray(values)
      ? values.filter(value => Number.isFinite(value) && value >= 0)
      : [];

    if (discharges.length < 2) {
      return {
        available: false,
        status: 'Dati idrologici insufficienti',
        trend: 'Non disponibile',
        tone: 'muted',
        icon: 'fa-circle-info',
        current: discharges.length ? discharges[discharges.length - 1] : null
      };
    }

    const current = discharges[discharges.length - 1];
    const previous = discharges[0];
    const diff = current - previous;
    const baseline = Math.max(Math.abs(previous), 1);
    const relativeChange = diff / baseline;

    if (relativeChange >= 0.35) {
      return { available: true, status: 'Portata in forte aumento', trend: 'Forte aumento', tone: 'danger', icon: 'fa-triangle-exclamation', current };
    }
    if (relativeChange >= 0.12) {
      return { available: true, status: 'Portata in aumento', trend: 'In aumento', tone: 'warning', icon: 'fa-arrow-trend-up', current };
    }
    if (relativeChange <= -0.12) {
      return { available: true, status: 'Portata in diminuzione', trend: 'In diminuzione', tone: 'info', icon: 'fa-arrow-trend-down', current };
    }

    return { available: true, status: 'Portata relativamente stabile', trend: 'Stabile', tone: 'info', icon: 'fa-water', current };
  }

  function renderRiverStatus(values) {
    const statusEl = document.getElementById('riverStatusText');
    const iconEl = document.getElementById('riverTrendIcon');
    const trendEl = document.getElementById('riverTrend');
    const dischargeEl = document.getElementById('riverDischarge');
    if (!statusEl || !iconEl || !trendEl || !dischargeEl) return;

    const result = classifyRiverStatus(values);
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

  window.CescoRiverStatus = { classifyRiverStatus, renderRiverStatus };
})();
