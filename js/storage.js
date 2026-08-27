(function exposeCescoStorage(globalScope) {
  'use strict';

  const DATABASE_NAME = 'CescoSpotDB';
  const DATABASE_VERSION = 1;
  const STATE_STORE = 'appState';
  const SPOTS_RECORD = 'spots';

  function requestToPromise(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Operazione IndexedDB non riuscita.'));
    });
  }

  function openDatabase() {
    if (!globalScope.indexedDB) return Promise.resolve(null);

    return new Promise((resolve, reject) => {
      const request = globalScope.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(STATE_STORE)) database.createObjectStore(STATE_STORE);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Impossibile aprire IndexedDB.'));
      request.onblocked = () => reject(new Error('Aggiornamento dell’archivio bloccato da un’altra scheda aperta.'));
    });
  }

  async function openDatabaseOrFallback() {
    try {
      return await openDatabase();
    } catch (error) {
      console.warn('IndexedDB non disponibile, uso temporaneamente l’archivio precedente:', error);
      return null;
    }
  }

  async function readDatabaseRecord(database, key) {
    const transaction = database.transaction(STATE_STORE, 'readonly');
    return requestToPromise(transaction.objectStore(STATE_STORE).get(key));
  }

  async function writeDatabaseRecord(database, key, value) {
    const transaction = database.transaction(STATE_STORE, 'readwrite');
    const completion = new Promise((resolve, reject) => {
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error('Salvataggio IndexedDB non riuscito.'));
      transaction.onabort = () => reject(transaction.error || new Error('Salvataggio IndexedDB annullato.'));
    });
    await requestToPromise(transaction.objectStore(STATE_STORE).put(value, key));
    await completion;
  }

  function readLegacySpots() {
    try {
      const savedData = globalScope.localStorage?.getItem(STORAGE_KEY);
      return savedData ? normalizeBackupPayload(JSON.parse(savedData)) : [];
    } catch (error) {
      throw new Error(`Archivio precedente non leggibile: ${error.message}`);
    }
  }

  async function loadStoredSpots() {
    const database = await openDatabaseOrFallback();
    if (!database) return readLegacySpots();

    try {
      const storedSpots = await readDatabaseRecord(database, SPOTS_RECORD);
      if (storedSpots !== undefined) return normalizeBackupPayload(storedSpots);

      const legacySpots = readLegacySpots();
      if (legacySpots.length > 0) {
        await writeDatabaseRecord(database, SPOTS_RECORD, {
          format: BACKUP_FORMAT,
          version: BACKUP_VERSION,
          updatedAt: new Date().toISOString(),
          spots: legacySpots,
        });
      }
      return legacySpots;
    } finally {
      database.close();
    }
  }

  async function persistSpots() {
    try {
      const safeSpots = normalizeBackupPayload(spots);
      const database = await openDatabaseOrFallback();
      if (!database) {
        globalScope.localStorage.setItem(STORAGE_KEY, JSON.stringify(safeSpots));
        return true;
      }

      try {
        await writeDatabaseRecord(database, SPOTS_RECORD, {
          format: BACKUP_FORMAT,
          version: BACKUP_VERSION,
          updatedAt: new Date().toISOString(),
          spots: safeSpots,
        });
      } finally {
        database.close();
      }
      return true;
    } catch (error) {
      console.error('Salvataggio CescoSpot non riuscito:', error);
      alert('Impossibile salvare i dati. Lo spazio del dispositivo potrebbe essere esaurito: esporta subito un backup JSON.');
      return false;
    }
  }

  function exportGPX() {
    if (spots.length === 0) { alert('Nessuno spot da esportare.'); return; }
    let gpx = '<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="CescoSpot PRO" xmlns="http://www.topografix.com/GPX/1/1">\n';
    spots.forEach(spot => {
      const techs = spot.techniques ? spot.techniques.join(', ') : (spot.technique || '');
      const targets = spot.targets ? spot.targets.join(', ') : (spot.target || '');
      const lures = spot.spotLures ? spot.spotLures.join(', ') : '';
      gpx += `  <wpt lat="${spot.lat}" lon="${spot.lng}">\n`;
      gpx += `    <name>${escapeXml(spot.name)}</name>\n`;
      gpx += `    <desc>${escapeXml((techs ? `Tecniche: ${techs} | ` : '') + (targets ? `Target: ${targets} | ` : '') + (lures ? `Esche: ${lures} | ` : '') + (spot.notes || ''))}</desc>\n`;
      gpx += '  </wpt>\n';
    });
    gpx += '</gpx>';
    downloadTextFile(gpx, 'application/gpx+xml', `CescoSpot_${new Date().toISOString().slice(0, 10)}.gpx`);
  }

  function escapeXml(value) {
    return String(value ?? '').replace(/[<>&'"]/g, char => ({
      '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;'
    })[char]);
  }

  function downloadTextFile(content, type, filename) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  }

  function exportSpots() {
    if (spots.length === 0) { alert('Nessuno spot da esportare.'); return; }
    const backup = {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      spots
    };
    downloadTextFile(
      JSON.stringify(backup, null, 2),
      'application/json',
      `CescoSpot_Backup_${new Date().toISOString().slice(0, 10)}.json`
    );
  }

  function handleCustomImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      alert('Il backup supera il limite di sicurezza di 50 MB. Nessun dato è stato modificato.');
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = loadEvent => {
      try {
        pendingImportData = normalizeBackupPayload(JSON.parse(loadEvent.target.result));
        document.getElementById('importDialogText').innerHTML = `Trovati <b>${pendingImportData.length} spot</b> validi nel file di backup.<br>Come desideri procedere?`;
        document.getElementById('importDialogOverlay').classList.add('open');
      } catch (error) {
        pendingImportData = null;
        alert(`Backup non valido: ${normalizeText(error.message, 180) || 'struttura non riconosciuta'}. Nessun dato è stato modificato.`);
      }
      event.target.value = '';
    };
    reader.onerror = () => {
      pendingImportData = null;
      event.target.value = '';
      alert('Impossibile leggere il file selezionato. Nessun dato è stato modificato.');
    };
    reader.readAsText(file);
  }

  async function confirmImportAction(action) {
    document.getElementById('importDialogOverlay').classList.remove('open');
    if (!pendingImportData || action === 'cancel') {
      pendingImportData = null;
      return;
    }

    const previousSpots = spots;
    let successMessage = '';
    if (action === 'merge') {
      let addedCount = 0;
      const mergedSpots = [...spots];
      pendingImportData.forEach(importedSpot => {
        if (!mergedSpots.some(spot => spot.id === importedSpot.id)) {
          mergedSpots.push(importedSpot);
          addedCount++;
        }
      });
      spots = mergedSpots;
      successMessage = `Importazione completata! Aggiunti ${addedCount} nuovi spot.`;
    } else if (action === 'replace') {
      spots = [...pendingImportData];
      successMessage = 'Backup sostituito con successo.';
    } else {
      pendingImportData = null;
      return;
    }

    if (!await persistSpots()) {
      spots = previousSpots;
      pendingImportData = null;
      return;
    }
    renderMapSpots();
    alert(successMessage);
    pendingImportData = null;
  }

  Object.assign(globalScope, {
    loadStoredSpots,
    persistSpots,
    escapeXml,
    exportGPX,
    exportSpots,
    handleCustomImport,
    confirmImportAction
  });
})(globalThis);
