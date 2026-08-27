(function exposeCescoDataSafety(globalScope) {
  'use strict';

  const STORAGE_KEY = 'cescospot_data';
  const BACKUP_FORMAT = 'CescoSpot';
  const BACKUP_VERSION = 1;

  function normalizeText(value, maxLength = 500) {
    return String(value ?? '')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
      .trim()
      .slice(0, maxLength);
  }

  function normalizeTextArray(value, maxItems = 30) {
    if (!Array.isArray(value)) return [];
    return Array.from(new Set(value.map(item => normalizeText(item, 100)).filter(Boolean))).slice(0, maxItems);
  }

  function normalizeId(value, fallbackPrefix = 'item') {
    const cleaned = String(value ?? '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
    return cleaned || `${fallbackPrefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function normalizeNumber(value, min, max, fallback = null) {
    if (value === '' || value === null || value === undefined) return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
  }

  function normalizePhoto(value) {
    if (!value) return '';
    const photo = String(value);
    const isSupportedImage = /^data:image\/(jpeg|png|webp);base64,[a-z0-9+/=\s]+$/i.test(photo);
    return isSupportedImage && photo.length <= 3_500_000 ? photo : '';
  }

  function normalizeIcon(value) {
    const icon = normalizeText(value, 50);
    if (/^fa-[a-z0-9-]+$/i.test(icon)) return icon;
    const plainIcon = icon.replace(/[<>&"']/g, '').slice(0, 12);
    return plainIcon || '📍';
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    })[char]);
  }

  function encodeInlineValue(value) {
    return encodeURIComponent(String(value ?? '')).replace(/'/g, '%27');
  }

  function normalizeCatch(rawCatch, index = 0) {
    if (!rawCatch || typeof rawCatch !== 'object' || Array.isArray(rawCatch)) {
      throw new Error(`Cattura ${index + 1} non valida`);
    }
    const speciesList = normalizeTextArray(
      rawCatch.speciesList || (rawCatch.species ? [rawCatch.species] : []),
      20
    );
    if (speciesList.length === 0) throw new Error(`Cattura ${index + 1} senza specie`);
    return {
      id: normalizeId(rawCatch.id, 'catch'),
      species: speciesList.join(', '),
      speciesList,
      weight: normalizeNumber(rawCatch.weight, 0, 1000),
      length: normalizeNumber(rawCatch.length, 0, 1000),
      lures: normalizeTextArray(rawCatch.lures || (rawCatch.lure ? [rawCatch.lure] : []), 30),
      photo: normalizePhoto(rawCatch.photo),
      date: normalizeText(rawCatch.date, 40),
      time: normalizeText(rawCatch.time, 20)
    };
  }

  function normalizeSpot(rawSpot, index = 0) {
    if (!rawSpot || typeof rawSpot !== 'object' || Array.isArray(rawSpot)) {
      throw new Error(`Spot ${index + 1} non valido`);
    }
    const lat = normalizeNumber(rawSpot.lat, -90, 90);
    const lng = normalizeNumber(rawSpot.lng, -180, 180);
    if (lat === null || lng === null) throw new Error(`Coordinate non valide nello spot ${index + 1}`);
    const rawCatches = Array.isArray(rawSpot.catches) ? rawSpot.catches : [];
    if (rawCatches.length > 1000) throw new Error(`Troppe catture nello spot ${index + 1}`);
    const catches = rawCatches.map(normalizeCatch);
    const catchIds = new Set();
    catches.forEach(catchItem => {
      if (catchIds.has(catchItem.id)) throw new Error(`ID cattura duplicato nello spot ${index + 1}`);
      catchIds.add(catchItem.id);
    });
    const color = /^#[0-9a-f]{6}$/i.test(String(rawSpot.color || '')) ? rawSpot.color : '#22c55e';
    return {
      id: normalizeId(rawSpot.id, 'spot'),
      name: normalizeText(rawSpot.name, 120) || 'Nuovo Spot',
      zone: normalizeText(rawSpot.zone, 160) || 'Generale',
      techniques: normalizeTextArray(rawSpot.techniques || (rawSpot.technique ? [rawSpot.technique] : [])),
      targets: normalizeTextArray(rawSpot.targets || (rawSpot.target ? [rawSpot.target] : [])),
      spotLures: normalizeTextArray(rawSpot.spotLures || []),
      photo: normalizePhoto(rawSpot.photo),
      radius: normalizeNumber(rawSpot.radius, 0, 10000),
      notes: normalizeText(rawSpot.notes, 2000),
      color,
      icon: normalizeIcon(rawSpot.icon),
      lat,
      lng,
      catches,
      date: normalizeText(rawSpot.date, 40)
    };
  }

  function normalizeBackupPayload(payload) {
    if (payload && !Array.isArray(payload) && payload.format === BACKUP_FORMAT && payload.version > BACKUP_VERSION) {
      throw new Error(`Versione backup ${payload.version} non ancora supportata`);
    }
    const rawSpots = Array.isArray(payload)
      ? payload
      : (payload && payload.format === BACKUP_FORMAT && Array.isArray(payload.spots) ? payload.spots : null);
    if (!rawSpots) throw new Error('Formato backup non riconosciuto');
    if (rawSpots.length > 10000) throw new Error('Il backup contiene troppi spot');
    const normalized = rawSpots.map(normalizeSpot);
    const ids = new Set();
    normalized.forEach(spot => {
      if (ids.has(spot.id)) throw new Error(`ID spot duplicato: ${spot.id}`);
      ids.add(spot.id);
    });
    return normalized;
  }

  const api = {
    STORAGE_KEY,
    BACKUP_FORMAT,
    BACKUP_VERSION,
    normalizeText,
    normalizeTextArray,
    normalizeId,
    normalizeNumber,
    normalizePhoto,
    normalizeIcon,
    escapeHtml,
    encodeInlineValue,
    normalizeCatch,
    normalizeSpot,
    normalizeBackupPayload
  };

  globalScope.CescoDataSafety = Object.freeze(api);
  Object.assign(globalScope, api);
})(globalThis);
