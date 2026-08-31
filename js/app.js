// --- PWA E INSTALLAZIONE ---
    let deferredPrompt;
    const installBanner = document.getElementById('installBanner');
    const installBtn = document.getElementById('installBtn');
    const installText = document.getElementById('installText');

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

    if (isIOS && !isStandalone) {
      installBanner.style.display = 'flex';
      setTimeout(() => installBanner.classList.add('show'), 500);
      installText.innerHTML = `Installa CescoSpot PRO!<br><small>Tocca <i class="fa-solid fa-arrow-up-from-bracket"></i> e "Aggiungi alla schermata Home"</small>`;
      installBtn.style.display = 'none'; 
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      installBanner.style.display = 'flex';
      setTimeout(() => installBanner.classList.add('show'), 500);
    });

    installBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') closeInstallBanner();
        deferredPrompt = null;
      }
    });

    function closeInstallBanner() {
      installBanner.classList.remove('show');
      setTimeout(() => installBanner.style.display = 'none', 400);
    }

    // --- GESTIONE CATEGORIE ENCICLOPEDIA ---
    function switchWikiCat(catId, chipEl) {
      document.querySelectorAll('.wiki-section').forEach(sec => sec.classList.remove('active'));
      document.querySelectorAll('.wiki-chip').forEach(ch => ch.classList.remove('active'));
      document.getElementById(catId).classList.add('active');
      chipEl.classList.add('active');
    }


    // --- MAPPA ---
    const map = L.map('map', { zoomControl: false, attributionControl: false, doubleClickZoom: false }).setView([41.9028, 12.4964], 6);

    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

    // --- LISTE TECNICHE, SPECIE E ESCHE ---
    const allTechniques = ["Spinning", "Feeder", "Carpfishing", "Mosca", "Galleggiante / Bolognese", "Fondo / Surfcasting", "Trout Area", "Baitcasting", "Spinning UL", "Eging", "Bolentino", "Pesca al tocco", "Esche siliconiche piombate", "Altro"];
    const freshwaterSpecies = ["Amur", "Anguilla", "Barbo", "Carassio", "Carpa Comune", "Carpa Specchio", "Cavedano", "Cheppia", "Luccio", "Luccioperca", "Persico Reale", "Black Bass", "Pesce Gatto", "Scardola", "Siluro", "Storione", "Temolo", "Tinca", "Trota Fario", "Trota Iridea", "Trota Marmorata", "Vairone"];
    const saltwaterSpecies = ["Spigola / Branzino", "Orata", "Sarago", "Mormora", "Serra", "Leccia", "Palamita", "Dentice", "Cefalo", "Ombrina", "Triglia", "Grongo", "Murena", "Sgombro", "Lattarino"];
    const allLures = ["Minnow", "Jerkbait", "Crankbait", "VIB / Lipless", "Spoon", "Rotante (Mepps)", "Onde / Jighead", "Siliconico (Shad/Grub)", "Carolina / Texas Rig", "Drop Shot", "Boilie Spezie / Frutta", "Pellet", "Mais / Lombrico", "Cagnotto / Vermara", "Pane", "Artificiale Eging", "Altro"];

    let currentEnvironmentSpecies = freshwaterSpecies;
    let selectedTechniquesSet = new Set();
    let selectedSpeciesSet = new Set();
    let selectedSpotLuresSet = new Set();

    let selectedCatchSpeciesSet = new Set();
    let selectedLuresSet = new Set();

    // Gestione Tecniche Spot
    function renderTechniqueSelect(selectedList = []) {
      selectedTechniquesSet = new Set(selectedList);
      const selectEl = document.getElementById('techniqueSelect');
      const badgesBox = document.getElementById('selectedTechniquesBadges');

      let badgesHtml = '';
      selectedTechniquesSet.forEach(tech => {
        badgesHtml += `<div class="multi-badge">${escapeHtml(tech)} <i class="fa-solid fa-xmark" onclick="removeTechnique(decodeURIComponent('${encodeInlineValue(tech)}'))"></i></div>`;
      });
      badgesBox.innerHTML = badgesHtml;

      let optionsHtml = `<option value="">+ Aggiungi Tecnica...</option>`;
      allTechniques.forEach(tech => {
        if (!selectedTechniquesSet.has(tech)) {
          optionsHtml += `<option value="${escapeHtml(tech)}">${escapeHtml(tech)}</option>`;
        }
      });
      selectEl.innerHTML = optionsHtml;
    }

    function selectTechnique(selectEl) {
      const val = selectEl.value;
      if (!val) return;
      selectedTechniquesSet.add(val);
      renderTechniqueSelect(Array.from(selectedTechniquesSet));
    }

    function removeTechnique(tech) {
      selectedTechniquesSet.delete(tech);
      renderTechniqueSelect(Array.from(selectedTechniquesSet));
    }

    // Gestione Specie Target Spot
    function renderSpeciesSelector(selectedList = []) {
      selectedSpeciesSet = new Set(selectedList);
      const selectEl = document.getElementById('speciesSelect');
      const badgesBox = document.getElementById('selectedSpeciesBadges');

      let badgesHtml = '';
      selectedSpeciesSet.forEach(specie => {
        badgesHtml += `<div class="multi-badge">${escapeHtml(specie)} <i class="fa-solid fa-xmark" onclick="removeSpecies(decodeURIComponent('${encodeInlineValue(specie)}'))"></i></div>`;
      });
      badgesBox.innerHTML = badgesHtml;

      let availableList = [...currentEnvironmentSpecies];
      selectedSpeciesSet.forEach(specie => {
        if (!availableList.includes(specie)) availableList.push(specie);
      });

      let optionsHtml = `<option value="">+ Aggiungi Specie Target...</option>`;
      availableList.forEach(specie => {
        if (!selectedSpeciesSet.has(specie)) {
          optionsHtml += `<option value="${escapeHtml(specie)}">${escapeHtml(specie)}</option>`;
        }
      });
      selectEl.innerHTML = optionsHtml;
    }

    function selectSpecies(selectEl) {
      const val = selectEl.value;
      if (!val) return;
      selectedSpeciesSet.add(val);
      renderSpeciesSelector(Array.from(selectedSpeciesSet));
    }

    function removeSpecies(specie) {
      selectedSpeciesSet.delete(specie);
      renderSpeciesSelector(Array.from(selectedSpeciesSet));
    }

    function addCustomSpecies() {
      const input = document.getElementById('customSpeciesInput');
      const val = normalizeText(input.value, 100);
      if (!val) return;
      selectedSpeciesSet.add(val);
      input.value = '';
      renderSpeciesSelector(Array.from(selectedSpeciesSet));
    }

    // Gestione Esche Spot
    function renderSpotLureSelect(selectedList = []) {
      selectedSpotLuresSet = new Set(selectedList);
      const selectEl = document.getElementById('spotLureSelect');
      const badgesBox = document.getElementById('selectedSpotLuresBadges');

      let badgesHtml = '';
      selectedSpotLuresSet.forEach(lure => {
        badgesHtml += `<div class="multi-badge">${escapeHtml(lure)} <i class="fa-solid fa-xmark" onclick="removeSpotLure(decodeURIComponent('${encodeInlineValue(lure)}'))"></i></div>`;
      });
      badgesBox.innerHTML = badgesHtml;

      let optionsHtml = `<option value="">+ Aggiungi Esca / Artificiale...</option>`;
      allLures.forEach(lure => {
        if (!selectedSpotLuresSet.has(lure)) {
          optionsHtml += `<option value="${escapeHtml(lure)}">${escapeHtml(lure)}</option>`;
        }
      });
      selectEl.innerHTML = optionsHtml;
    }

    function selectSpotLure(selectEl) {
      const val = selectEl.value;
      if (!val) return;
      selectedSpotLuresSet.add(val);
      renderSpotLureSelect(Array.from(selectedSpotLuresSet));
    }

    function removeSpotLure(lure) {
      selectedSpotLuresSet.delete(lure);
      renderSpotLureSelect(Array.from(selectedSpotLuresSet));
    }

    function addCustomSpotLure() {
      const input = document.getElementById('customSpotLureInput');
      const val = normalizeText(input.value, 100);
      if (!val) return;
      selectedSpotLuresSet.add(val);
      input.value = '';
      renderSpotLureSelect(Array.from(selectedSpotLuresSet));
    }

    // Gestione Specie Cattura Diario
    function renderCatchSpeciesSelect(selectedList = []) {
      selectedCatchSpeciesSet = new Set(selectedList);
      const selectEl = document.getElementById('catchSpeciesSelect');
      const badgesBox = document.getElementById('selectedCatchSpeciesBadges');

      let badgesHtml = '';
      selectedCatchSpeciesSet.forEach(specie => {
        badgesHtml += `<div class="multi-badge">${escapeHtml(specie)} <i class="fa-solid fa-xmark" onclick="removeCatchSpecies(decodeURIComponent('${encodeInlineValue(specie)}'))"></i></div>`;
      });
      badgesBox.innerHTML = badgesHtml;

      let fullList = [...freshwaterSpecies, ...saltwaterSpecies];
      selectedCatchSpeciesSet.forEach(specie => {
        if (!fullList.includes(specie)) fullList.push(specie);
      });

      let optionsHtml = `<option value="">+ Seleziona Specie Cattura...</option>`;
      fullList.forEach(specie => {
        if (!selectedCatchSpeciesSet.has(specie)) {
          optionsHtml += `<option value="${escapeHtml(specie)}">${escapeHtml(specie)}</option>`;
        }
      });
      selectEl.innerHTML = optionsHtml;
    }

    function selectCatchSpecies(selectEl) {
      const val = selectEl.value;
      if (!val) return;
      selectedCatchSpeciesSet.add(val);
      renderCatchSpeciesSelect(Array.from(selectedCatchSpeciesSet));
    }

    function removeCatchSpecies(specie) {
      selectedCatchSpeciesSet.delete(specie);
      renderCatchSpeciesSelect(Array.from(selectedCatchSpeciesSet));
    }

    function addCustomCatchSpecies() {
      const input = document.getElementById('customCatchSpeciesInput');
      const val = normalizeText(input.value, 100);
      if (!val) return;
      selectedCatchSpeciesSet.add(val);
      input.value = '';
      renderCatchSpeciesSelect(Array.from(selectedCatchSpeciesSet));
    }

    // Gestione Esche / Artificiali Diario
    function renderLureSelect(selectedList = []) {
      selectedLuresSet = new Set(selectedList);
      const selectEl = document.getElementById('lureSelect');
      const badgesBox = document.getElementById('selectedLuresBadges');

      let badgesHtml = '';
      selectedLuresSet.forEach(lure => {
        badgesHtml += `<div class="multi-badge">${escapeHtml(lure)} <i class="fa-solid fa-xmark" onclick="removeLure(decodeURIComponent('${encodeInlineValue(lure)}'))"></i></div>`;
      });
      badgesBox.innerHTML = badgesHtml;

      let optionsHtml = `<option value="">+ Seleziona Esca / Artificiale...</option>`;
      allLures.forEach(lure => {
        if (!selectedLuresSet.has(lure)) {
          optionsHtml += `<option value="${escapeHtml(lure)}">${escapeHtml(lure)}</option>`;
        }
      });
      selectEl.innerHTML = optionsHtml;
    }

    function selectLure(selectEl) {
      const val = selectEl.value;
      if (!val) return;
      selectedLuresSet.add(val);
      renderLureSelect(Array.from(selectedLuresSet));
    }

    function removeLure(lure) {
      selectedLuresSet.delete(lure);
      renderLureSelect(Array.from(selectedLuresSet));
    }

    function addCustomLure() {
      const input = document.getElementById('customLureInput');
      const val = normalizeText(input.value, 100);
      if (!val) return;
      selectedLuresSet.add(val);
      input.value = '';
      renderLureSelect(Array.from(selectedLuresSet));
    }

    function detectWaterEnvironment(lat, lng, zoneStr) {
      const badge = document.getElementById('waterEnvironmentBadge');
      const lowerZone = zoneStr.toLowerCase();
      const isSea = lowerZone.includes('mare') || lowerZone.includes('spiaggia') || lowerZone.includes('marina') || lowerZone.includes('porto') || lowerZone.includes('costa') || lowerZone.includes('golfo');

      if (isSea) {
        currentEnvironmentSpecies = saltwaterSpecies;
        badge.innerText = "Acqua Salata (Mare)";
        badge.style.background = "rgba(2,132,199,0.2)";
        badge.style.color = "var(--accent-light-blue)";
      } else {
        currentEnvironmentSpecies = freshwaterSpecies;
        badge.innerText = "Acqua Dolce (Fiume/Lago)";
        badge.style.background = "rgba(34,197,94,0.2)";
        badge.style.color = "var(--accent-green)";
      }
      renderSpeciesSelector(Array.from(selectedSpeciesSet));
    }

    function removePhoto(hiddenInputId, previewBoxId) {
      document.getElementById(hiddenInputId).value = '';
      const box = document.getElementById(previewBoxId);
      box.innerHTML = `
        <i class="fa-solid fa-camera" style="font-size:2rem; color:var(--accent-light-blue);"></i>
        <span style="font-size:0.85rem; font-weight:700;">Tocca per scattare o caricare foto</span>
      `;
    }

    function toggleMapSearch() {
      const overlay = document.getElementById('mapSearchOverlay');
      overlay.classList.toggle('open');
      if (overlay.classList.contains('open')) document.getElementById('mapSearchInput').focus();
    }

    function performMapSearch() {
      const q = document.getElementById('mapSearchInput').value;
      if (!q) return;
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`)
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0) {
            map.flyTo([data[0].lat, data[0].lon], 13);
            toggleMapSearch();
            document.getElementById('mapSearchInput').value = '';
          } else { alert("Luogo non trovato."); }
        }).catch(() => { alert("Errore di connessione."); });
    }

    const iconList = [
      { id: '📍', type: 'emoji', name: 'Pin Esatto' },
      { id: '🐟', type: 'emoji', name: 'Pesce / Spot' },
      { id: '🌲', type: 'emoji', name: 'Albero / Riva' },
      { id: '🌊', type: 'emoji', name: 'Acqua / Buca' },
      { id: '🚗', type: 'emoji', name: 'Parcheggio / Accesso' },
      { id: '🌉', type: 'emoji', name: 'Ponte / Manfatto' },
      { id: '⚓', type: 'emoji', name: 'Scogliera / Molo' },
      { id: '⛺', type: 'emoji', name: 'Postazione Tenda' },
      { id: '⚠️', type: 'emoji', name: 'Ostacolo / Incastro' }
    ];

    let selectedColor = '#22c55e';
    let selectedIcon = '📍';
    let selectedIconType = 'emoji';
    let selectedTechFilter = 'all';
    let spots = [];
    let mapMarkers = {};
    let mapCircles = {};
    let editingSpotId = null;
    let tempMarker = null;
    let pendingImportData = null; 

    const iconPickerEl = document.getElementById('iconPicker');
    iconList.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = `icon-card ${index === 0 ? 'selected' : ''}`;
      card.dataset.icon = item.id;
      let iconHtml = item.type === 'emoji' ? `<span class="emoji-icon">${item.id}</span>` : `<i class="fa-solid ${item.id}"></i>`;
      card.innerHTML = `${iconHtml}<span class="name">${item.name}</span>`;
      card.onclick = () => {
        document.querySelectorAll('.icon-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedIcon = item.id;
        selectedIconType = item.type;
        document.getElementById('selectedIconLabel').innerText = item.name;
      };
      iconPickerEl.appendChild(card);
    });

    function selectColor(colorHex, el) {
      document.querySelectorAll('.color-opt').forEach(c => { c.classList.remove('selected'); c.innerHTML = ''; });
      if(el) { el.classList.add('selected'); el.innerHTML = colorHex === '#f8fafc' ? '<i class="fa-solid fa-check" style="color:#0f172a"></i>' : '<i class="fa-solid fa-check"></i>'; }
      selectedColor = colorHex;
    }

    function shareSpot(name, lat, lng) {
      const shareUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      if (navigator.share) {
        navigator.share({ title: 'CescoSpot PRO', text: `Spot di pesca: ${name}! 🎣`, url: shareUrl }).catch(() => {});
      } else { prompt("Copia questo link:", shareUrl); }
    }

    function shareSpotById(id) {
      const spot = spots.find(item => item.id === id);
      if (spot) shareSpot(spot.name, spot.lat, spot.lng);
    }

    function focusSpot(id) {
      const spot = spots.find(s => s.id === id);
      if (!spot) return;
      switchTab('tabMap', document.querySelectorAll('.nav-item')[0]);
      map.setView([spot.lat, spot.lng], 16);
      if (mapMarkers[id]) setTimeout(() => mapMarkers[id].openPopup(), 400); 
    }

    // FUNZIONE PER APRIRE E SCORRERE DIRETTAMENTE ALLO SPOT NELL'ARCHIVIO DALLA MAPPA
    function openSpotInArchive(spotId) {
      map.closePopup();
      switchTab('tabMe', document.querySelectorAll('.nav-item')[3]);
      
      setTimeout(() => {
        const spotEl = document.getElementById(`spot_card_${spotId}`);
        if (spotEl) {
          const sectionEl = spotEl.closest('.zone-section');
          if (sectionEl) {
            const contentEl = sectionEl.querySelector('.zone-content');
            const iconEl = sectionEl.querySelector('.zone-header i');
            if (contentEl && contentEl.style.display === 'none') {
              contentEl.style.display = 'block';
              if (iconEl) iconEl.classList.replace('fa-chevron-right', 'fa-chevron-down');
            }
          }
          spotEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          spotEl.classList.add('spot-highlight');
          setTimeout(() => spotEl.classList.remove('spot-highlight'), 3000);
        }
      }, 350);
    }

    function openInMaps(lat, lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    }

    function openAddSpotModal(lat, lng) {
      editingSpotId = null;
      document.getElementById('modalTitle').innerText = 'Salva Posizione';
      const center = Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : map.getCenter();
      document.getElementById('tempLat').value = center.lat;
      document.getElementById('tempLng').value = center.lng;
      document.getElementById('spotName').value = '';
      document.getElementById('spotZone').value = 'Generale';
      document.getElementById('spotRadius').value = '';
      document.getElementById('spotNotes').value = '';
      selectedTechniquesSet = new Set();
      selectedSpeciesSet = new Set();
      selectedSpotLuresSet = new Set();
      currentEnvironmentSpecies = freshwaterSpecies;
      document.getElementById('modalAddSpot').classList.add('open');
    }

    function closeModals() {
      document.querySelectorAll('.modal').forEach(m => {
        m.classList.remove('open');
        if (globalThis.CescoModalAccessibility && typeof CescoModalAccessibility.deactivate === 'function') {
          CescoModalAccessibility.deactivate(m);
        }
      });
      if(tempMarker) { map.removeLayer(tempMarker); tempMarker = null; }
      editingSpotId = null;
    }

    async function saveSpotFromModal() {
      const previousSpots = normalizeBackupPayload(spots);
      const name = normalizeText(document.getElementById('spotName').value, 120) || 'Nuovo Spot';
      const zone = normalizeText(document.getElementById('spotZone').value, 160) || 'Generale';
      const techniques = normalizeTextArray(Array.from(selectedTechniquesSet));
      const radius = normalizeNumber(document.getElementById('spotRadius').value, 0, 10000);
      const targets = normalizeTextArray(Array.from(selectedSpeciesSet));
      const spotLures = normalizeTextArray(Array.from(selectedSpotLuresSet));
      const photo = normalizePhoto(document.getElementById('spotPhotoData').value);
      const notes = normalizeText(document.getElementById('spotNotes').value, 2000);
      const lat = normalizeNumber(document.getElementById('tempLat').value, -90, 90);
      const lng = normalizeNumber(document.getElementById('tempLng').value, -180, 180);

      if (lat === null || lng === null) {
        alert('Coordinate dello spot non valide. Seleziona nuovamente la posizione sulla mappa.');
        return;
      }

      if (editingSpotId) {
        const idx = spots.findIndex(s => s.id === editingSpotId);
        if (idx !== -1) {
          spots[idx] = { ...spots[idx], name, zone, techniques, radius, targets, spotLures, photo, notes, color: selectedColor, icon: selectedIcon };
        }
      } else {
        let existingSpot = spots.find(s => L.latLng(s.lat, s.lng).distanceTo(L.latLng(lat, lng)) < 20);

        if (existingSpot) {
          existingSpot.techniques = Array.from(new Set([...(existingSpot.techniques || []), ...techniques]));
          existingSpot.targets = Array.from(new Set([...(existingSpot.targets || []), ...targets]));
          existingSpot.spotLures = Array.from(new Set([...(existingSpot.spotLures || []), ...spotLures]));
          if (photo) existingSpot.photo = photo;
          if (notes) existingSpot.notes += ` | ${notes}`;
          alert(`⚡ Posizione già esistente! I nuovi dati sono stati accorpati nello spot "${existingSpot.name}".`);
        } else {
          spots.push({ id: Date.now().toString(), name, zone, techniques, radius, targets, spotLures, photo, notes, color: selectedColor, icon: selectedIcon, lat, lng, catches: [], date: new Date().toLocaleDateString() });
        }
      }
      
      if (!await persistSpots()) {
        spots = previousSpots;
        return;
      }
      renderMapSpots();
      closeModals();
      
      const searchInput = document.getElementById('searchSpotInput');
      if (searchInput) { searchInput.value = ''; filterSpots(); }
    }

    function editSpot(id) {
      const spot = spots.find(s => s.id === id);
      if(!spot) return;
      editingSpotId = id;
      
      document.getElementById('modalTitle').innerText = "Modifica Spot";
      document.getElementById('spotName').value = spot.name;
      document.getElementById('spotZone').value = spot.zone || 'Generale';
      document.getElementById('spotRadius').value = spot.radius || '';
      document.getElementById('spotNotes').value = spot.notes || '';
      document.getElementById('tempLat').value = spot.lat;
      document.getElementById('tempLng').value = spot.lng;

      detectWaterEnvironment(spot.lat, spot.lng, spot.zone || '');
      renderTechniqueSelect(spot.techniques || (spot.technique ? [spot.technique] : []));
      renderSpeciesSelector(spot.targets || (spot.target ? [spot.target] : []));
      renderSpotLureSelect(spot.spotLures || []);
      
      if (spot.photo) {
        document.getElementById('spotPhotoData').value = spot.photo;
        document.getElementById('spotPhotoBox').innerHTML = `<img src="${spot.photo}"><button type="button" class="btn-remove-photo" onclick="event.stopPropagation(); removePhoto('spotPhotoData', 'spotPhotoBox')"><i class="fa-solid fa-trash"></i></button>`;
      } else {
        removePhoto('spotPhotoData', 'spotPhotoBox');
      }

      selectColor(spot.color, document.querySelector(`.color-opt[data-color="${spot.color}"]`));
      document.querySelectorAll('.icon-card').forEach(c => {
        c.classList.remove('selected');
        if(c.dataset.icon === spot.icon) {
          c.classList.add('selected');
          selectedIcon = spot.icon;
          document.getElementById('selectedIconLabel').innerText = iconList.find(i => i.id === spot.icon)?.name || '';
        }
      });
      document.getElementById('modalAddSpot').classList.add('open');
    }

    async function deleteSpot(id) {
      if(confirm("Eliminare definitivamente questo spot?")) {
        spots = spots.filter(s => s.id !== id);
        if (!await persistSpots()) return;
        renderMapSpots();
      }
    }

    // --- GESTIONE DIARIO CATTURE (LOGBOOK) & MODIFICA CATTURA ---
    function openLogbook(spotId) {
      const spot = spots.find(s => s.id === spotId);
      if (!spot) return;
      document.getElementById('catchSpotId').value = spotId;
      document.getElementById('logbookTitle').innerText = `Catture: ${spot.name}`;
      resetCatchForm();
      renderCatchesList(spot);
      document.getElementById('modalLogbook').classList.add('open');
    }

    function closeLogbookModal() { document.getElementById('modalLogbook').classList.remove('open'); }

    function resetCatchForm() {
      document.getElementById('catchEditId').value = '';
      document.getElementById('catchFormTitle').innerHTML = `<i class="fa-solid fa-plus"></i> Nuova Cattura`;
      document.getElementById('btnSaveCatch').innerText = "Registra nel Diario";
      document.getElementById('btnCancelCatchEdit').style.display = 'none';

      renderCatchSpeciesSelect([]);
      renderLureSelect([]);
      document.getElementById('catchWeight').value = '';
      document.getElementById('catchLength').value = '';
      removePhoto('catchPhotoData', 'catchPhotoBox');
    }

    async function saveCatch() {
      const spotId = document.getElementById('catchSpotId').value;
      const editId = document.getElementById('catchEditId').value;
      const spot = spots.find(s => s.id === spotId);
      if (!spot) return;

      const speciesList = normalizeTextArray(Array.from(selectedCatchSpeciesSet), 20);
      if (speciesList.length === 0) { alert("Seleziona almeno una specie!"); return; }

      const weight = normalizeNumber(document.getElementById('catchWeight').value, 0, 1000);
      const length = normalizeNumber(document.getElementById('catchLength').value, 0, 1000);
      const luresList = normalizeTextArray(Array.from(selectedLuresSet), 30);
      const photo = normalizePhoto(document.getElementById('catchPhotoData').value);

      if (!spot.catches) spot.catches = [];

      if (editId) {
        const cIdx = spot.catches.findIndex(c => c.id === editId);
        if (cIdx !== -1) {
          spot.catches[cIdx] = {
            ...spot.catches[cIdx],
            species: speciesList.join(', '),
            speciesList,
            weight,
            length,
            lures: luresList,
            photo: photo || spot.catches[cIdx].photo
          };
        }
      } else {
        spot.catches.unshift({
          id: Date.now().toString(),
          species: speciesList.join(', '),
          speciesList,
          weight,
          length,
          lures: luresList,
          photo: photo || '',
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }

      if (!await persistSpots()) return;
      renderCatchesList(spot);
      renderSavedSpotsUI();
      resetCatchForm();
    }

    function editCatch(spotId, catchId) {
      const spot = spots.find(s => s.id === spotId);
      if (!spot || !spot.catches) return;
      const catchItem = spot.catches.find(c => c.id === catchId);
      if (!catchItem) return;

      document.getElementById('catchEditId').value = catchId;
      document.getElementById('catchFormTitle').innerHTML = `<i class="fa-solid fa-pen"></i> Modifica Cattura`;
      document.getElementById('btnSaveCatch').innerText = "Salva Modifiche";
      document.getElementById('btnCancelCatchEdit').style.display = 'block';

      renderCatchSpeciesSelect(catchItem.speciesList || [catchItem.species]);
      renderLureSelect(catchItem.lures || (catchItem.lure ? [catchItem.lure] : []));
      document.getElementById('catchWeight').value = catchItem.weight !== null ? catchItem.weight : '';
      document.getElementById('catchLength').value = catchItem.length !== null ? catchItem.length : '';

      if (catchItem.photo) {
        document.getElementById('catchPhotoData').value = catchItem.photo;
        document.getElementById('catchPhotoBox').innerHTML = `<img src="${catchItem.photo}"><button type="button" class="btn-remove-photo" onclick="event.stopPropagation(); removePhoto('catchPhotoData', 'catchPhotoBox')"><i class="fa-solid fa-trash"></i></button>`;
      } else {
        removePhoto('catchPhotoData', 'catchPhotoBox');
      }
    }

    async function deleteCatch(spotId, catchId) {
      const spot = spots.find(s => s.id === spotId);
      if (!spot || !spot.catches) return;
      if (confirm("Eliminare questa cattura?")) {
        spot.catches = spot.catches.filter(c => c.id !== catchId);
        if (!await persistSpots()) return;
        renderCatchesList(spot);
        renderSavedSpotsUI();
      }
    }

    function renderCatchesList(spot) {
      const container = document.getElementById('catchesListContainer');
      if (!spot.catches || spot.catches.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:var(--text-muted); font-size:0.9rem; padding:10px;">Nessuna cattura registrata.</p>`;
        return;
      }
      container.innerHTML = spot.catches.map(c => `
        <div class="catch-item">
          <div class="catch-thumb">${c.photo ? `<img src="${c.photo}" onclick="openLightbox(this.src)" style="cursor:zoom-in; pointer-events:auto;">` : `<i class="fa-solid fa-fish" style="font-size:1.6rem; color:var(--text-muted);"></i>`}</div>
          <div style="flex:1; overflow:hidden;">
            <b style="color:#fff; font-size:1rem;">${escapeHtml(c.species)}</b>
            <div style="font-size:0.8rem; color:var(--accent-orange); font-weight:700;">${c.weight ? `${c.weight} kg` : ''} ${c.length ? `• ${c.length} cm` : ''}</div>
            ${c.lures && c.lures.length > 0 ? `<div style="font-size:0.75rem; color:var(--text-muted);">Esche: ${escapeHtml(c.lures.join(', '))}</div>` : (c.lure ? `<div style="font-size:0.75rem; color:var(--text-muted);">Esca: ${escapeHtml(c.lure)}</div>` : '')}
            <div style="font-size:0.7rem; color:var(--text-muted); margin-top:2px;">${escapeHtml(c.date)} ${escapeHtml(c.time)}</div>
          </div>
          <div style="display:flex; gap:4px;">
            <button type="button" style="background:none; border:none; color:var(--accent-light-blue); font-size:1rem; padding:6px; cursor:pointer;" onclick="editCatch('${spot.id}', '${c.id}')" title="Modifica"><i class="fa-solid fa-pen"></i></button>
            <button type="button" style="background:none; border:none; color:var(--accent-red); font-size:1rem; padding:6px; cursor:pointer;" onclick="deleteCatch('${spot.id}', '${c.id}')" title="Elimina"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
      `).join('');
    }

    function renderMapSpots() {
      Object.values(mapMarkers).forEach(m => map.removeLayer(m));
      Object.values(mapCircles).forEach(c => map.removeLayer(c));
      mapMarkers = {};
      mapCircles = {};

      spots.forEach(s => {
        const safeName = escapeHtml(s.name);
        const safeZone = escapeHtml(s.zone || 'Generale');
        let iconInnerHtml = '';
        if (s.photo) {
          iconInnerHtml = `<img src="${s.photo}">`;
        } else {
          const isEmoji = s.icon && !s.icon.startsWith('fa-');
          iconInnerHtml = isEmoji ? `<span style="font-size:1.4rem;">${escapeHtml(s.icon)}</span>` : `<i class="fa-solid ${escapeHtml(s.icon)}"></i>`;
        }

        const markerBorder = s.color === '#f8fafc' ? '#0f172a' : 'white';

        const customIcon = L.divIcon({
          className: '',
          html: `<div class="custom-map-icon" style="background-color: ${s.photo ? 'transparent' : s.color}; border-color: ${markerBorder};">${iconInnerHtml}<div style="position: absolute; bottom: -14px; left: 50%; transform: translateX(-50%); border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 14px solid ${s.photo ? 'white' : s.color};"></div></div>`,
          iconSize: [44, 58], iconAnchor: [22, 56], popupAnchor: [0, -48]
        });

        const techsList = s.techniques && s.techniques.length > 0 ? s.techniques.join(', ') : (s.technique || '');
        const targetsList = s.targets && s.targets.length > 0 ? s.targets.join(', ') : (s.target || '');
        const luresList = s.spotLures && s.spotLures.length > 0 ? s.spotLures.join(', ') : '';
        const safeTechsList = escapeHtml(techsList);
        const safeTargetsList = escapeHtml(targetsList);
        const safeLuresList = escapeHtml(luresList);
        const safeNotes = escapeHtml(s.notes || '');
        
        let popup = `
          <div style="min-width: 220px;">
            <b style="font-size:1.15rem; color:#fff; display:block; margin-bottom:2px;">${safeName}</b>
            <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:4px;">Zona: ${safeZone}</div>
            ${techsList ? `<div style="font-size:0.8rem; color:var(--accent-orange); font-weight:700;">Tecniche: ${safeTechsList}</div>` : ''}
            ${s.radius ? `<div style="font-size:0.8rem; color:var(--accent-light-blue);">Raggio lancio: ${s.radius}m</div>` : ''}
            ${targetsList ? `<div style="font-size:0.8rem; color:var(--text-light); margin-top:2px;">Target: ${safeTargetsList}</div>` : ''}
            ${luresList ? `<div style="font-size:0.75rem; color:var(--accent-amber);">Esche: ${safeLuresList}</div>` : ''}
            ${s.catches && s.catches.length > 0 ? `<div style="font-size:0.8rem; color:var(--accent-green); font-weight:800; margin-top:3px;"><i class="fa-solid fa-fish"></i> Catture: ${s.catches.length}</div>` : ''}
            ${s.notes ? `<div style="font-size:0.78rem; color:var(--text-muted); margin-top:4px; font-style:italic; border-top:1px solid rgba(255,255,255,0.08); padding-top:4px;">${safeNotes}</div>` : ''}
            
            <button type="button" class="popup-action-btn" onclick="openSpotInArchive('${s.id}')">
              <i class="fa-solid fa-bookmark"></i> Vedi nell'Archivio
            </button>
            <div style="display:flex; gap:6px; margin-top:6px;">
              <button type="button" class="popup-action-btn" style="flex:1; margin-top:0; border-color:rgba(34,197,94,0.3); background:rgba(34,197,94,0.2); color:var(--accent-green);" onclick="openInMaps(${s.lat}, ${s.lng})">
                <i class="fa-solid fa-route"></i> Naviga
              </button>
              <button type="button" class="popup-action-btn" style="flex:1; margin-top:0; border-color:rgba(249,115,22,0.3); background:rgba(249,115,22,0.2); color:var(--accent-orange);" onclick="openLogbook('${s.id}')">
                <i class="fa-solid fa-book-bookmark"></i> Diario
              </button>
            </div>
          </div>
        `;

        mapMarkers[s.id] = L.marker([s.lat, s.lng], { icon: customIcon }).addTo(map).bindPopup(popup);

        if (s.radius && s.radius > 0) {
          mapCircles[s.id] = L.circle([s.lat, s.lng], { radius: s.radius, color: s.color || '#38bdf8', fillColor: s.color || '#38bdf8', fillOpacity: 0.15, weight: 1.5, dashArray: '4, 6' }).addTo(map);
        }
      });
      renderSavedSpotsUI();
    }

    function setTechFilter(tech, element) {
      selectedTechFilter = tech;
      document.querySelectorAll('.tech-chip').forEach(c => c.classList.remove('active'));
      element.classList.add('active');
      filterSpots();
    }

    function toggleZoneList(zoneId) {
      const content = document.getElementById(`zone-content-${zoneId}`);
      const icon = document.getElementById(`zone-icon-${zoneId}`);
      if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.classList.replace('fa-chevron-right', 'fa-chevron-down');
      } else {
        content.style.display = 'none';
        icon.classList.replace('fa-chevron-down', 'fa-chevron-right');
      }
    }

    function renderSavedSpotsUI() {
      const container = document.getElementById('savedSpotsContainer');
      if(!container) return;
      
      if(spots.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted); text-align:center; margin-top:30px; font-weight:600;">Nessun spot salvato.</p>';
        return;
      }

      const grouped = {};
      spots.forEach(s => {
        const zone = s.zone || 'Altre Zone';
        if (!grouped[zone]) grouped[zone] = [];
        grouped[zone].push(s);
      });

      container.innerHTML = '';
      Object.keys(grouped).sort().forEach((zone, index) => {
        const safeZoneId = 'zone_' + index; 
        const safeZoneLabel = escapeHtml(zone);
        let htmlSec = `
          <div class="zone-section" data-zone-name="${escapeHtml(zone.toLowerCase())}">
            <div class="zone-header" onclick="toggleZoneList('${safeZoneId}')">
              <span><i class="fa-solid fa-map-pin" style="margin-right:10px;"></i> ${safeZoneLabel} <span style="opacity:0.6;">(${grouped[zone].length})</span></span>
              <i class="fa-solid fa-chevron-down" id="zone-icon-${safeZoneId}"></i>
            </div>
            <div class="zone-content" id="zone-content-${safeZoneId}">
        `;
        
        grouped[zone].forEach(s => {
          const safeName = escapeHtml(s.name);
          let iconInnerHtml = '';
          if (s.photo) {
            // FOTO CLICKABILE (Lightbox) NELL'ARCHIVIO
            iconInnerHtml = `<img src="${s.photo}" onclick="event.stopPropagation(); openLightbox(this.src)" style="cursor:zoom-in; pointer-events:auto;">`;
          } else {
            const isEmoji = s.icon && !s.icon.startsWith('fa-');
            iconInnerHtml = isEmoji ? `<span style="font-size:1.4rem; pointer-events:none;">${escapeHtml(s.icon)}</span>` : `<i class="fa-solid ${escapeHtml(s.icon)}" style="pointer-events:none;"></i>`;
          }

          const markerBorder = s.color === '#f8fafc' ? '#0f172a' : 'white';
          const catchCount = s.catches ? s.catches.length : 0;
          const techsList = s.techniques && s.techniques.length > 0 ? s.techniques.join(', ') : (s.technique || '');
          const targetsList = s.targets && s.targets.length > 0 ? s.targets.join(', ') : (s.target || '');
          const luresList = s.spotLures && s.spotLures.length > 0 ? s.spotLures.join(', ') : '';
          const techsSearch = s.techniques ? s.techniques.join(' ') : (s.technique || '');
          const targetsSearch = s.targets ? s.targets.join(' ') : (s.target || '');
          const luresSearch = s.spotLures ? s.spotLures.join(' ') : '';
          const searchText = `${s.name} ${techsSearch} ${targetsSearch} ${luresSearch} ${s.notes || ''}`.toLowerCase();
          const safeTechsList = escapeHtml(techsList);
          const safeTargetsList = escapeHtml(targetsList);
          const safeLuresList = escapeHtml(luresList);

          htmlSec += `
            <div class="widget-card spot-item" 
                 id="spot_card_${s.id}"
                 data-technique="${safeTechsList}"
                 data-search-text="${escapeHtml(searchText)}"
                 style="display:flex; justify-content:space-between; align-items:center; gap:12px; padding:16px; margin-bottom:12px; background:rgba(15,23,42,0.8); border-radius:16px; border:1px solid rgba(255,255,255,0.05); transition: border-color 0.3s, box-shadow 0.3s;">
              
              <div onclick="focusSpot('${s.id}')" style="display:flex; align-items:flex-start; gap:12px; flex:1; min-width:0; cursor:pointer;">
                <div class="custom-map-icon" style="background-color: ${s.photo ? 'transparent' : s.color}; border-color: ${markerBorder}; position:static; width:44px; height:44px; flex-shrink:0; margin-top:2px;">${iconInnerHtml}</div>
                <div style="flex:1; min-width:0; overflow:hidden;">
                  <b style="color:#fff; display:block; word-break:break-word; font-size:1.05rem; line-height:1.25; margin-bottom:4px;">${safeName}</b>
                  <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:4px;">
                    ${techsList ? `<span style="background:rgba(249,115,22,0.2); color:var(--accent-orange); font-size:0.7rem; font-weight:800; padding:2px 8px; border-radius:10px;">${safeTechsList}</span>` : ''}
                    ${s.radius ? `<span style="background:rgba(56,189,248,0.2); color:var(--accent-light-blue); font-size:0.7rem; font-weight:800; padding:2px 8px; border-radius:10px;"><i class="fa-solid fa-bullseye"></i> ${s.radius}m</span>` : ''}
                    ${catchCount > 0 ? `<span style="background:rgba(34,197,94,0.2); color:var(--accent-green); font-size:0.7rem; font-weight:800; padding:2px 8px; border-radius:10px;"><i class="fa-solid fa-fish"></i> ${catchCount}</span>` : ''}
                  </div>
                  ${targetsList ? `<div style="color:var(--accent-light-blue); font-size:0.8rem; font-weight:700; line-height:1.2;">Target: ${safeTargetsList}</div>` : ''}
                  ${luresList ? `<div style="color:var(--accent-amber); font-size:0.75rem; font-weight:700; line-height:1.2; margin-top:2px;">Esche: ${safeLuresList}</div>` : ''}
                </div>
              </div>

              <div class="spot-actions-compact">
                <div class="spot-actions-row">
                  <button class="btn-nav" onclick="openInMaps(${s.lat}, ${s.lng})" title="Naviga"><i class="fa-solid fa-route"></i></button>
                  <button class="btn-share" onclick="shareSpotById('${s.id}')" title="Condividi"><i class="fa-solid fa-share-nodes"></i></button>
                  <button class="btn-log" onclick="openLogbook('${s.id}')" title="Diario Catture"><i class="fa-solid fa-book-bookmark"></i></button>
                </div>
                <div class="spot-actions-row">
                  <button class="btn-edit" onclick="editSpot('${s.id}')" title="Modifica"><i class="fa-solid fa-pen"></i></button>
                  <button class="btn-delete" onclick="deleteSpot('${s.id}')" title="Elimina"><i class="fa-solid fa-trash"></i></button>
                </div>
              </div>

            </div>`;
        });
        htmlSec += `</div></div>`;
        container.innerHTML += htmlSec;
      });
    }

    function filterSpots() {
      const q = document.getElementById('searchSpotInput').value.toLowerCase();
      document.querySelectorAll('.zone-section').forEach(section => {
        let visibleCount = 0;
        section.querySelectorAll('.spot-item').forEach(item => {
          const matchesText = item.getAttribute('data-search-text').includes(q) || section.getAttribute('data-zone-name').includes(q);
          const techAttr = item.getAttribute('data-technique');
          const matchesTech = selectedTechFilter === 'all' || techAttr.includes(selectedTechFilter);
          if (matchesText && matchesTech) { item.style.display = 'flex'; visibleCount++; } else { item.style.display = 'none'; }
        });
        section.style.display = visibleCount === 0 ? 'none' : 'block';
      });
    }

    let rulerActive = false;
    let rulerPoints = [];
    let rulerLine = null;
    let rulerMarkers = L.layerGroup().addTo(map);

    function toggleRuler() {
      rulerActive = !rulerActive;
      const btn = document.getElementById('rulerBtn');
      const box = document.getElementById('measureBox');
      if (rulerActive) {
        btn.classList.add('active'); box.style.display = 'block'; box.innerText = 'Tocca per misurare';
        rulerPoints = []; rulerMarkers.clearLayers(); if (rulerLine) map.removeLayer(rulerLine);
      } else {
        btn.classList.remove('active'); box.style.display = 'none';
        if (rulerLine) map.removeLayer(rulerLine); rulerMarkers.clearLayers();
      }
    }

    function startSpotFromMap({ lat, lng }) {
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      if (tempMarker) map.removeLayer(tempMarker);
      const latLng = L.latLng(lat, lng);
      tempMarker = L.marker(latLng, {icon: L.divIcon({className: '', html: `<div style="width:24px; height:24px; background:var(--accent-blue); border:3px solid #fff; border-radius:50%; animation: pulse 1s infinite alternate;"></div>`, iconSize: [24, 24], iconAnchor: [12, 12]})}).addTo(map);
      openAddSpotModal(lat, lng);
    }

    // The map module is loaded before app.js, but keep startup safe if an old
    // PWA cache serves a partial shell. A plain single tap remains usable.
    const mapTapFactory = window.CescoMapTap && typeof window.CescoMapTap.create === 'function'
      ? window.CescoMapTap
      : null;
    const spotTap = mapTapFactory
      ? mapTapFactory.create({ onSingleTap: startSpotFromMap })
      : { handleClick: (e) => { startSpotFromMap(e.latlng); return true; }, cancel: () => {} };

    map.on('click', function(e) {
      if (rulerActive) {
        rulerPoints.push([e.latlng.lat, e.latlng.lng]);
        L.circleMarker(e.latlng, {radius: 5, color: '#38bdf8', fillColor: '#fff', fillOpacity: 1}).addTo(rulerMarkers);
        if (rulerPoints.length > 1) {
          if (rulerLine) map.removeLayer(rulerLine);
          rulerLine = L.polyline(rulerPoints, { color: '#38bdf8', weight: 5, dashArray: '8, 8' }).addTo(map);
          let dist = 0;
          for (let i = 0; i < rulerPoints.length - 1; i++) dist += L.latLng(rulerPoints[i]).distanceTo(L.latLng(rulerPoints[i+1]));
          document.getElementById('measureBox').innerText = dist > 1000 ? `Distanza: ${(dist/1000).toFixed(2)} km` : `Distanza: ${Math.round(dist)} m`;
        }
      } else {
        spotTap.handleClick(e);
      }
    });

    // Leaflet emits dblclick after the two clicks. Keep native double-click
    // zoom disabled and cancel any still-pending single-tap action explicitly.
    map.on('dblclick', () => spotTap.cancel());

    function updateForecastData(btnElement) {
      let originalHtml = '';
      if(btnElement) { originalHtml = btnElement.innerHTML; btnElement.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sincronizzazione...'; btnElement.disabled = true; }

      const center = map.getCenter();
      const now = new Date();

      const formatClock = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const formatWindow = (date, minutes) => {
        const start = new Date(date.getTime() - minutes * 60000);
        const end = new Date(date.getTime() + minutes * 60000);
        return `${formatClock(start)} - ${formatClock(end)}`;
      };

      if (window.SunCalc) {
        const illumination = SunCalc.getMoonIllumination(now);
        const phase = illumination.phase;
        const phaseName = phase < 0.03 || phase >= 0.97 ? 'Luna Nuova'
          : phase < 0.22 ? 'Luna Crescente' : phase < 0.28 ? 'Primo Quarto'
          : phase < 0.47 ? 'Gibbosa Crescente' : phase < 0.53 ? 'Luna Piena'
          : phase < 0.72 ? 'Gibbosa Calante' : phase < 0.78 ? 'Ultimo Quarto' : 'Luna Calante';
        document.getElementById('moonPhaseText').innerText = `Luna: ${phaseName} · ${Math.round(illumination.fraction * 100)}% illuminata`;

        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        let highest = { time: startOfDay, altitude: -Infinity };
        let lowest = { time: startOfDay, altitude: Infinity };
        for (let minute = 0; minute < 24 * 60; minute += 5) {
          const time = new Date(startOfDay.getTime() + minute * 60000);
          const altitude = SunCalc.getMoonPosition(time, center.lat, center.lng).altitude;
          if (altitude > highest.altitude) highest = { time, altitude };
          if (altitude < lowest.altitude) lowest = { time, altitude };
        }
        const chronological = [highest.time, lowest.time].sort((a, b) => a - b);
        const minorOne = new Date((chronological[0].getTime() + chronological[1].getTime()) / 2);
        const minorTwo = new Date(minorOne.getTime() + 12 * 60 * 60000);
        document.getElementById('major1').innerText = formatWindow(highest.time, 60);
        document.getElementById('major2').innerText = formatWindow(lowest.time, 60);
        document.getElementById('minor1').innerText = formatWindow(minorOne, 30);
        document.getElementById('minor2').innerText = formatWindow(minorTwo, 30);
        document.getElementById('fishActivityText').innerText = 'Finestre astronomiche locali';
        document.getElementById('fishActivityText').style.color = 'var(--accent-green)';
      } else {
        document.getElementById('moonPhaseText').innerText = 'Calcolo lunare non disponibile';
        document.getElementById('fishActivityText').innerText = 'Dati astronomici non disponibili';
      }
      document.getElementById('wTideState').innerText = 'Non disponibile';

      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${center.lat}&longitude=${center.lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,cloud_cover&hourly=temperature_2m,weather_code,precipitation,wind_speed_10m,surface_pressure&daily=sunrise,sunset&timezone=auto`)
        .then(res => res.json())
        .then(data => {
            const code = data.current.weather_code || 0;
            let weatherIconStr = '<i class="fa-solid fa-sun" style="color:#eab308;"></i>';
            let descText = "Sereno";
            if(code >= 1 && code <= 3) { weatherIconStr = '<i class="fa-solid fa-cloud-sun"></i>'; descText = "Poco Nuvoloso"; }
            else if(code === 45 || code === 48) { weatherIconStr = '<i class="fa-solid fa-smog"></i>'; descText = "Nebbia"; }
            else if(code >= 51 && code <= 67) { weatherIconStr = '<i class="fa-solid fa-cloud-rain" style="color:#38bdf8;"></i>'; descText = "Pioggia"; }
            else if(code >= 71 && code <= 77) { weatherIconStr = '<i class="fa-solid fa-snowflake" style="color:#fff;"></i>'; descText = "Neve"; }
            else if(code >= 80 && code <= 82) { weatherIconStr = '<i class="fa-solid fa-cloud-showers-heavy" style="color:#38bdf8;"></i>'; descText = "Rovesci"; }
            else if(code >= 95) { weatherIconStr = '<i class="fa-solid fa-cloud-bolt" style="color:#eab308;"></i>'; descText = "Temporale"; }
            
            document.getElementById('wIconLarge').innerHTML = weatherIconStr;
            document.getElementById('wTempLarge').innerText = `${Math.round(data.current.temperature_2m)}°`;
            document.getElementById('wDesc').innerText = descText;
            document.getElementById('wFeelsLike').innerText = `${Math.round(data.current.apparent_temperature)}°C`;
            document.getElementById('wHumidity').innerText = `${data.current.relative_humidity_2m}%`;
            
            const windDir = data.current.wind_direction_10m;
            document.getElementById('wWind').innerHTML = `${Math.round(data.current.wind_speed_10m)} <i class="fa-solid fa-arrow-up" style="transform: rotate(${windDir}deg); font-size:1rem; color:var(--accent-light-blue);"></i>`;
            document.getElementById('wPressure').innerText = `${Math.round(data.current.surface_pressure)} hPa`;
            document.getElementById('wRain').innerText = `${data.current.precipitation} mm`;
            document.getElementById('wClouds').innerText = `${data.current.cloud_cover}%`;
            document.getElementById('weatherDataStatus').innerHTML = `<i class="fa-solid fa-cloud-sun"></i> Open-Meteo · aggiornato alle ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

            if (data.hourly && data.hourly.time) {
              const curH = now.getHours();
              const track = document.getElementById('hourlyForecastTrack');
              let htmlH = '';
              for (let i = curH; i < curH + 24 && i < data.hourly.time.length; i++) {
                const hTime = data.hourly.time[i].slice(-5);
                const hCode = data.hourly.weather_code[i] || 0;
                let hIcon = 'fa-sun" style="color:#eab308;';
                if(hCode >= 1 && hCode <= 3) hIcon = 'fa-cloud-sun';
                else if(hCode >= 51 && hCode <= 67) hIcon = 'fa-cloud-rain" style="color:#38bdf8;';
                else if(hCode >= 80) hIcon = 'fa-cloud-showers-heavy" style="color:#38bdf8;';
                else if(hCode >= 95) hIcon = 'fa-bolt" style="color:#eab308;';

                htmlH += `<div class="hourly-box"><div class="hourly-time">${hTime}</div><div class="hourly-icon"><i class="fa-solid ${hIcon}"></i></div><div class="hourly-temp">${Math.round(data.hourly.temperature_2m[i])}°</div><div class="hourly-wind">${Math.round(data.hourly.wind_speed_10m[i])}k/h</div></div>`;
              }
              track.innerHTML = htmlH;
            }

            if (data.hourly && data.hourly.surface_pressure) {
              const currentHour = now.getHours();
              const pNow = data.current.surface_pressure;
              const p6hAgo = data.hourly.surface_pressure[Math.max(0, currentHour - 6)] || pNow;
              const diff = pNow - p6hAgo;
              const trendText = document.getElementById('pTrendText');
              const trendIcon = document.getElementById('pTrendIcon');
              if (diff <= -1.5) { trendText.innerText = `In calo (${diff.toFixed(1)} hPa)`; trendText.style.color = 'var(--accent-red)'; trendIcon.innerHTML = `<i class="fa-solid fa-arrow-trend-down" style="color:var(--accent-red);"></i>`; }
              else if (diff >= 1.5) { trendText.innerText = `In salita (+${diff.toFixed(1)} hPa)`; trendText.style.color = 'var(--accent-green)'; trendIcon.innerHTML = `<i class="fa-solid fa-arrow-trend-up" style="color:var(--accent-green);"></i>`; }
              else { trendText.innerText = `Stabile`; trendText.style.color = 'var(--accent-light-blue)'; trendIcon.innerHTML = `<i class="fa-solid fa-arrows-left-right" style="color:var(--accent-light-blue);"></i>`; }
            }

            if (data.daily && data.daily.sunrise && data.daily.sunset) {
              const sr = new Date(data.daily.sunrise[0]);
              const ss = new Date(data.daily.sunset[0]);
              document.getElementById('wSunrise').innerText = sr.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              document.getElementById('wSunset').innerText = ss.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              document.getElementById('wGoldenMorn').innerText = `${new Date(sr.getTime() - 20*60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(sr.getTime() + 45*60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
              document.getElementById('wGoldenEve').innerText = `${new Date(ss.getTime() - 45*60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(ss.getTime() + 20*60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            }

            if(btnElement) { btnElement.innerHTML = '<i class="fa-solid fa-check"></i> Aggiornato'; setTimeout(() => { btnElement.innerHTML = originalHtml; btnElement.disabled = false; }, 2000); }
        }).catch(() => {
          document.getElementById('wDesc').innerText = 'Errore di Rete';
          document.getElementById('weatherDataStatus').innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Impossibile aggiornare i dati meteo';
        });

      fetch(`https://flood-api.open-meteo.com/v1/flood?latitude=${center.lat}&longitude=${center.lng}&daily=river_discharge&past_days=2&forecast_days=3`)
        .then(res => res.json())
        .then(fdata => {
          CescoRiverStatus.renderRiverStatus(fdata?.daily?.river_discharge);
        })
        .catch(() => CescoRiverStatus.renderRiverStatus([]));

      fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${center.lat}&longitude=${center.lng}&current=wave_height,wave_period,sea_surface_temperature`)
        .then(res => res.json())
        .then(mdata => {
          if (mdata && mdata.current && mdata.current.wave_height !== null) {
            document.getElementById('wWaveHeight').innerText = `${mdata.current.wave_height.toFixed(1)} m`;
            document.getElementById('wWavePeriod').innerText = `${Math.round(mdata.current.wave_period || 0)} s`;
            document.getElementById('wSeaTemp').innerText = mdata.current.sea_surface_temperature !== null ? `${Math.round(mdata.current.sea_surface_temperature)}°C` : `--°C`;
          } else {
            document.getElementById('wWaveHeight').innerText = "Acque Interne";
            document.getElementById('wWavePeriod').innerText = "--";
            document.getElementById('wSeaTemp').innerText = "Interno";
          }
        }).catch(() => {});
    }

    function useCurrentLocationForForecast(button) {
      if (!navigator.geolocation) { document.getElementById('weatherLocationText').innerText = 'GPS non supportato da questo dispositivo'; return; }
      const original = button.innerHTML;
      button.disabled = true;
      button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Localizzo';
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => { map.setView([coords.latitude, coords.longitude], Math.max(map.getZoom(), 13)); updateForecastData(); button.innerHTML = original; button.disabled = false; },
        error => {
          const message = error && error.code === 1
            ? 'Permesso posizione negato: abilita il GPS nelle impostazioni'
            : error && error.code === 3
              ? 'Timeout GPS: riprova o usa il centro della mappa'
              : 'Posizione non disponibile: usa il centro della mappa';
          document.getElementById('weatherLocationText').innerText = message;
          button.innerHTML = original;
          button.disabled = false;
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    }

    const weatherLocationButton = document.getElementById('btnWeatherCurrentLocation');
    if (weatherLocationButton && !weatherLocationButton.__cescoWeatherBound) {
      weatherLocationButton.addEventListener('click', () => useCurrentLocationForForecast(weatherLocationButton));
      weatherLocationButton.__cescoWeatherBound = true;
    }

    function switchTab(tabId, btn) {
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      document.getElementById(tabId).classList.add('active');
      btn.classList.add('active');
      if(tabId === 'tabMap') setTimeout(() => map.invalidateSize(), 300);
      if(tabId === 'tabForecasts') updateForecastData();
    }

    let watchId = null;
    let userMarker = null;
    let userAccuracyCircle = null;

    function startTracking() {
      const btn = document.getElementById('gpsBtn');
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
        btn.classList.remove('active');
        if(userMarker) { map.removeLayer(userMarker); userMarker = null; }
        if(userAccuracyCircle) { map.removeLayer(userAccuracyCircle); userAccuracyCircle = null; }
        return;
      }
      btn.classList.add('active');
      if ("geolocation" in navigator) {
        watchId = navigator.geolocation.watchPosition((pos) => {
          const { latitude: lat, longitude: lng, accuracy } = pos.coords;
          if(!userMarker) {
            userMarker = L.circleMarker([lat, lng], { radius: 8, color: '#fff', weight: 2, fillColor: '#0284c7', fillOpacity: 1 }).addTo(map);
            userAccuracyCircle = L.circle([lat, lng], { radius: accuracy, color: '#38bdf8', fillColor: '#38bdf8', fillOpacity: 0.2, weight: 1 }).addTo(map);
            map.flyTo([lat, lng], 15);
          } else {
            userMarker.setLatLng([lat, lng]);
            userAccuracyCircle.setLatLng([lat, lng]);
            userAccuracyCircle.setRadius(accuracy);
          }
        }, () => { alert("Errore GPS."); btn.classList.remove('active'); watchId = null; }, { enableHighAccuracy: true, maximumAge: 0 });
      }
    }

    // --- GESTIONE BUSSOLA ON / OFF (TOGGLE) ---
    let compassActive = false;
    let lastHeading = 0;

    function toggleCompass() {
      const btn = document.querySelector('.btn-compass-perm');
      
      if (compassActive) {
        window.removeEventListener('deviceorientation', handleOrientation, true);
        btn.classList.remove('active');
        document.getElementById('hdgVal').innerHTML = `<i class="fa-regular fa-compass" style="font-size: 1rem; color: var(--text-muted);"></i> --° <small>HDG</small>`;
        const pointer = document.getElementById('compassPointer');
        if (pointer) pointer.style.left = '50%';
        document.querySelectorAll('.compass-ticks span').forEach(span => {
          span.style.color = 'var(--text-muted)';
          span.style.transform = 'scale(1)';
        });
        compassActive = false;
      } else {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
          DeviceOrientationEvent.requestPermission().then(response => {
            if (response === 'granted') {
              window.addEventListener('deviceorientation', handleOrientation, true);
              btn.classList.add('active');
              compassActive = true;
            } else { alert("Permesso bussola negato."); }
          }).catch(console.error);
        } else if (window.DeviceOrientationEvent) {
          window.addEventListener('deviceorientation', handleOrientation, true);
          btn.classList.add('active');
          compassActive = true;
        } else { alert("Sensore bussola non supportato su questo dispositivo."); }
      }
    }

    function handleOrientation(event) {
      if (!compassActive) return;
      let heading = event.webkitCompassHeading || (event.alpha !== null ? 360 - event.alpha : null);
      if (heading !== null && !isNaN(heading)) {
        document.getElementById('hdgVal').innerHTML = `<i class="fa-regular fa-compass" style="font-size: 1rem; color: var(--text-muted);"></i> ${Math.round(heading)}° <small>HDG</small>`;
        const pointer = document.getElementById('compassPointer');
        if(pointer) {
          if (Math.abs(heading - lastHeading) > 180) pointer.style.transition = 'none'; else pointer.style.transition = 'left 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)';
          pointer.style.left = (heading / 360 * 100) + '%';
          lastHeading = heading;
        }
        const normalizedHeading = (Math.round(heading) + 360) % 360;
        const index = Math.round(normalizedHeading / 45) % 8; 
        document.querySelectorAll('.compass-ticks span').forEach((span, i) => {
          if (i === index || (index === 0 && i === 8)) { span.style.color = 'var(--accent-light-blue)'; span.style.transform = 'scale(1.4)'; span.style.fontWeight = '900'; }
          else { span.style.color = 'var(--text-muted)'; span.style.transform = 'scale(1)'; span.style.fontWeight = '800'; }
        });
      }
    }

    const style = document.createElement('style');
    style.innerHTML = `@keyframes pulse { from { transform: scale(1); opacity: 1; } to { transform: scale(1.3); opacity: 0.7; } }`;
    document.head.appendChild(style);

    async function initializeStoredData() {
      try {
        spots = await loadStoredSpots();
      } catch (error) {
        console.warn('Archivio locale non leggibile:', error);
        alert('I dati locali non sono leggibili. Non verranno sovrascritti: prova a ripristinare un backup valido.');
      }
      renderMapSpots();
      if (spots.length > 0) map.setView([spots[spots.length - 1].lat, spots[spots.length - 1].lng], 13);
    }

    initializeStoredData();
    setTimeout(() => updateForecastData(null), 1000);
  

    // ===== RIG LAB - LOGICA INTEGRATA =====
// --- DATI PER LE TENDINE MULTIPULTIPLE ---
    const dataFondali = [
      "Sabbia fine", "Sabbia grossolana", "Fango morbido", "Limo profondo", "Melma", 
      "Ghiaia", "Ciottoli piccoli", "Sassi grandi", "Scogli frastagliati", "Lastroni di roccia", 
      "Alghe superficiali", "Posidonia fitta", "Erbai sommersi", "Tronchi sommersi", "Relitti o Rottami"
    ];

    const dataEsche = {
      "Esche Naturali e Vive": [
        "Bigattino, Cagnotto", "Lombrico", "Mais", "Sarda, Trancio di pesce", "Sarda intera", 
        "Trancio di Cefalo", "Gambero vivo", "Gambero sgusciato", "Koreano", "Arenicola", 
        "Bibi", "Muriddu", "Tremolina", "Americano", "Pane, Fiocco", "Formaggio, Pastella", 
        "Muggine vivo", "Anguillina viva"
      ],
      "Pellet e Boiles": [
        "Boiles, Frutta", "Boiles, Pesce o Spezie", "Pellet affondante", "Pop-up", "Wafter"
      ],
      "Artificiali Rigidi": [
        "Minnow, Hardbait", "Jerkbait", "Crankbait", "WTD", "Popper", "Lipless, VIB"
      ],
      "Artificiali Siliconici": [
        "Soft Shad, Gomma", "Grub", "Creature, Craw", "Vermi siliconici, Worm", "Tube"
      ],
      "Metallo e Speciali": [
        "Cucchiaino Rotante", "Ondulante", "Spinnerbait", "Chatterbait", "Jig con gonna", 
        "Metal Jig", "Totanara, Egi", "Kabura", "Inchiku", "Sabiki"
      ]
    };

    const dataAttrezzi = {
      "Canne in uso": [
        "Bolognese", "Inglese", "Roubaisienne", "Canna fissa", 
        "Canna da Feeder", "Canna da Spinning", "Canna da Surfcasting",
        "Canna da Bolentino", "Canna da Traina"
      ],
      "Mulinelli": [
        "Mulinello a frizione anteriore", "Mulinello a frizione posteriore", "Mulinello baitrunner", 
        "Mulinello taglia piccola (1000 - 2500)", "Mulinello taglia media (3000 - 4000)", "Mulinello taglia grande (5000+)"
      ],
      "Fili Madre": [
        "Filo imbobinato dello 0.12 - 0.16", "Filo imbobinato dello 0.18 - 0.22", 
        "Filo imbobinato dello 0.25 - 0.30", "Filo imbobinato dello 0.35+", 
        "Trecciato PE 0.6 - 1.0", "Trecciato PE 1.2+"
      ]
    };

    const targetGenerici = ["Pesci piccoli e sospettosi", "Pesci grossi e combattivi", "Predatori da inseguimento", "Pesci da fondo, Grufolatori"];
    const targetDolce = ["Cavedano", "Barbo", "Carpa", "Amur", "Pesce Gatto", "Siluro", "Anguilla", "Tinca", "Storione", "Trota Fario", "Trota Iridea", "Trota Marmorata", "Luccio", "Black Bass", "Persico Reale", "Scardola", "Pigo", "Temolo", "Lucioperca, Zander", "Salmerino"];
    const targetMare = ["Spigola, Branzino", "Orata", "Sarago", "Mormora", "Pagello", "Triglia", "Pesce Serra", "Leccia", "Barracuda", "Grongo", "Murena", "Ricciola", "Tonnetto", "Cefalo, Muggine", "Calamaro", "Seppia", "Polpo", "Palamita", "Sgombro", "Salpa", "Occhiata", "Corvina", "Dentice", "Lampuga", "Sugarello"];

    function getTargetData() {
      const acq = document.getElementById("acqua").value;
      const isMare = ['porto', 'darsena', 'molo', 'scogliera_nat', 'scogliera_art', 'spiaggia_calma', 'spiaggia_ciottoli', 'spiaggia_mosso', 'laguna', 'offshore'].includes(acq);
      const isMisto = acq === 'foce';
      
      let data = { "Approcci Generici": targetGenerici };
      if (isMisto) {
        data["Specie Salmastre"] = [...new Set([...targetDolce, ...targetMare])].sort();
      } else if (isMare) {
        data["Specie di Mare"] = targetMare;
      } else {
        data["Specie Acqua Dolce"] = targetDolce;
      }
      return data;
    }

    // --- MOTORE MULTI-SELECT CUSTOM ---
    function initMultiSelect(config) {
      const container = document.getElementById(config.containerId);
      const input = document.getElementById(config.inputId);
      const dropdown = document.getElementById(config.dropdownId);
      const badges = document.getElementById(config.badgesId);
      
      window[`multi_${config.inputId}`] = {
        selected: [],
        renderBadges: function() {
          badges.innerHTML = this.selected.map(item => `<div class="multi-badge">${item} <i class="fa-solid fa-xmark" onmousedown="event.preventDefault(); event.stopPropagation(); removeBadge('${config.inputId}', '${item}')"></i></div>`).join('');
          input.placeholder = this.selected.length > 0 ? "Aggiungi..." : config.placeholder;
        },
        renderDropdown: function() {
          const filter = input.value.toLowerCase();
          let itemsHtml = '';
          const data = config.dataFn(); 
          
          if(Array.isArray(data)) {
            data.forEach(item => {
              if(!this.selected.includes(item) && item.toLowerCase().includes(filter)) {
                itemsHtml += `<div class="dropdown-item" onmousedown="event.preventDefault(); selectItem('${config.inputId}', '${item}')">${item}</div>`;
              }
            });
          } else {
            for(const [group, arr] of Object.entries(data)) {
              const filteredArr = arr.filter(item => !this.selected.includes(item) && item.toLowerCase().includes(filter));
              if(filteredArr.length > 0) {
                itemsHtml += `<div class="dropdown-group-title">${group}</div>`;
                filteredArr.forEach(item => {
                  itemsHtml += `<div class="dropdown-item" onmousedown="event.preventDefault(); selectItem('${config.inputId}', '${item}')">${item}</div>`;
                });
              }
            }
          }
          dropdown.innerHTML = itemsHtml || '<div style="padding:12px 16px; color:var(--text-muted); font-size:0.9rem;">Nessun risultato trovato</div>';
        }
      };

      const ms = window[`multi_${config.inputId}`];

      container.addEventListener('click', () => input.focus());
      input.addEventListener('focus', () => {
        container.classList.add('focused');
        ms.renderDropdown();
        dropdown.classList.add('show');
      });
      input.addEventListener('blur', () => {
        container.classList.remove('focused');
        dropdown.classList.remove('show');
      });
      input.addEventListener('input', () => ms.renderDropdown());
    }

    function selectItem(inputId, item) {
      const ms = window[`multi_${inputId}`];
      ms.selected.push(item);
      document.getElementById(inputId).value = '';
      ms.renderBadges();
      ms.renderDropdown();
    }
    function removeBadge(inputId, item) {
      const ms = window[`multi_${inputId}`];
      ms.selected = ms.selected.filter(i => i !== item);
      ms.renderBadges();
      ms.renderDropdown();
    }

    initMultiSelect({
      containerId: 'ms-fondale-container', inputId: 'ms-fondale-input', dropdownId: 'ms-fondale-dropdown', badgesId: 'ms-fondale-badges',
      placeholder: 'Sabbia, Fango, Alghe...', dataFn: () => dataFondali
    });

    initMultiSelect({
      containerId: 'ms-target-container', inputId: 'ms-target-input', dropdownId: 'ms-target-dropdown', badgesId: 'ms-target-badges',
      placeholder: 'Spigola, Carpa, Serra...', dataFn: () => getTargetData()
    });

    initMultiSelect({
      containerId: 'ms-esca-container', inputId: 'ms-esca-input', dropdownId: 'ms-esca-dropdown', badgesId: 'ms-esca-badges',
      placeholder: 'Bigattino, Minnow, Coreano...', dataFn: () => dataEsche
    });

    initMultiSelect({
      containerId: 'ms-attrezzi-container', inputId: 'ms-attrezzi-input', dropdownId: 'ms-attrezzi-dropdown', badgesId: 'ms-attrezzi-badges',
      placeholder: 'Bolognese, Mulinello 2500, Filo 0.20...', dataFn: () => dataAttrezzi
    });

    function onAcquaChange() {
      const msTar = window[`multi_ms-target-input`];
      msTar.selected = [];
      msTar.renderBadges();
    }


    // --- DATABASE BLUEPRINTS E DESCRIZIONI PROFESSIONALI ---

    const rigBoloScorrevole = {
      title: "Bolognese, Galleggiante Scorrevole",
      desc: "Montatura obbligatoria quando devi sondare fondali che superano la lunghezza della canna. Il galleggiante non è fisso, ma scorre lungo il filo durante il lancio per poi fermarsi alla profondità esatta desiderata, permettendoti di calare a 5, 8 o 10 metri senza intralci.",
      steps: [
        { dist: "Fondale", bp_dist: "Nodo Fermo", bp_short: "Stopper", icon: "weight", fa: "fa-minus", title: "Nodo di Stop in cotone", desc: "<b>Misura della profondità:</b> Nodo scorsoio in filo legato sulla lenza. Imposta la profondità e passa agilmente attraverso gli anelli della canna durante il lancio e il recupero." },
        { dist: "Scorrevole", bp_dist: "Libero", bp_short: "Galleggiante", icon: "float", fa: "fa-map-pin", title: "Galleggiante Scorrevole", desc: "<b>Foro passante o anellino:</b> Il galleggiante scivola sulla lenza madre fino a battere contro il nodo di stop, mettendo il sistema in pesca." },
        { dist: "A 60 cm dall'amo", bp_dist: "Taratura", bp_short: "Torpille", icon: "weight", fa: "fa-cubes", title: "Torpille o Bulk Pesante", desc: "<b>Discesa rapida nell'abisso:</b> Concentra l'80% del peso per far scendere l'esca in verticale a grandi profondità, bucando le correnti superficiali ed evitando garbugli in volo." },
        { dist: "In 40 cm", bp_dist: "Spie", bp_short: "2 Pallini", icon: "weight", fa: "fa-cube", title: "Pallini Spia", desc: "<b>Distensione finale:</b> Due pallini medi posizionati sotto la torpille per ammorbidire la geometria prima della girella." },
        { dist: "Fine Trave", bp_dist: "Chiusura", bp_short: "Girella", icon: "swivel", fa: "fa-link", title: "Girella Rolling", desc: "<b>Scaricatore obbligatorio:</b> I lunghi recuperi da grandi profondità tendono a far avvitare paurosamente l'esca. La girella previene parrucche disastrose." },
        { dist: "50-80 cm", bp_dist: "Disteso", bp_short: "Terminale", icon: "hook", fa: "fa-fish", title: "Terminale in Fluorocarbon", desc: "<b>Assetto perfetto:</b> Lungo a sufficienza per presentarsi naturale sul fondo, ma non troppo per evitare che si attorcigli al bulk durante la lunghissima caduta in acqua profonda." }
      ]
    };

    const rigEging = {
      title: "Montatura Eging",
      desc: "Lenza diretta, priva di elasticità e fronzoli. Ottimizzata per trasmettere istantaneamente le classiche jerkate alla totanara, garantendo una sensibilità estrema anche sulle tocche più timide in fase di calata.",
      steps: [
        { dist: "", bp_dist: "", bp_short: "Treccia PE", icon: "float", fa: "fa-bars-staggered", title: "Treccia Lenza Madre", desc: "<b>Treccia PE 0.6 - 0.8:</b> L'uso della treccia sottile è obbligatorio. Taglia perfettamente il vento e l'acqua riducendo la pancia della lenza." },
        { dist: "Giunzione", bp_dist: "Nodo FG", bp_short: "Nodo", icon: "swivel", fa: "fa-link", title: "Nodo FG o Tony Peña", desc: "<b>Nessuna girella metallica:</b> Unisci direttamente treccia e fluoro per garantire uno scorrimento fluido negli anelli durante i lanci lunghi." },
        { dist: "100-150 cm", bp_dist: "1.5m", bp_short: "Leader", icon: "weight", fa: "fa-minus", title: "Terminale in Fluorocarbon", desc: "<b>Leader 0.22 - 0.25 mm:</b> Invisibile e rigido. Protegge la treccia dalle abrasioni contro gli scogli tipici degli habitat di seppie e calamari." },
        { dist: "Fine linea", bp_dist: "Egi Snap", bp_short: "Totanara", icon: "hook", fa: "fa-anchor", title: "Egi Snap e Totanara", desc: "<b>Moschettone dedicato:</b> Usa un Egi Snap a goccia ampia. Permette alla totanara di muoversi liberamente a zig-zag." }
      ]
    };

    const rigSpinningLuccio = {
      title: "Terminale Spinning Anti-Tranciatura",
      desc: "Architettura da combattimento pesante. Disegnata specificamente per resistere alla formidabile dentatura tranciante di predatori voraci, senza sacrificare la naturalezza del nuoto dell'artificiale.",
      steps: [
        { dist: "", bp_dist: "", bp_short: "Treccia", icon: "float", fa: "fa-bars-staggered", title: "Treccia Principale", desc: "<b>Libraggio elevato:</b> Treccia PE 1.5 - 2.5. Deve sopportare shock violenti e ferrate poderose su apparati boccali molto duri." },
        { dist: "Giunzione", bp_dist: "Nodo FG", bp_short: "Knot", icon: "swivel", fa: "fa-link", title: "Giunzione FG Knot", desc: "<b>Transizione fluida:</b> Nodo perfetto per unire diametri molto diversi mantenendo il 100% del carico di rottura." },
        { dist: "80-100 cm", bp_dist: "1m", bp_short: "Shock Leader", icon: "weight", fa: "fa-minus", title: "Shock Leader Fluorocarbon", desc: "<b>Fluoro 0.50 - 0.70 mm:</b> Agisce da ammortizzatore contro le testate violente del pesce e protegge la lenza principale dallo sfregamento su ostacoli sommersi." },
        { dist: "Ultimi 20 cm", bp_dist: "20cm", bp_short: "Cavetto", icon: "hook", fa: "fa-paperclip", title: "Cavetto d'Acciaio e Snap", desc: "<b>Barriera finale:</b> 20-30 cm di cavetto termosaldante in acciaio o titanio chiuso su un robusto moschettone a sgancio rapido per l'artificiale." }
      ]
    };

    const rigSpinningClassico = {
      title: "Leader Classico da Spinning",
      desc: "Il setup più bilanciato per la ricerca di predatori marini e d'acqua dolce a vista. Privilegia la totale invisibilità e la corretta presentazione dell'hardbait.",
      steps: [
        { dist: "", bp_dist: "", bp_short: "Treccia", icon: "float", fa: "fa-bars-staggered", title: "Treccia Principale", desc: "<b>Treccia PE 0.8 - 1.2:</b> Diametro sottile per lanci molto lunghi e precisione chirurgica nell'animazione." },
        { dist: "Diretto", bp_dist: "Nodo", bp_short: "Giunzione", icon: "swivel", fa: "fa-link", title: "Nodo FG o Albright", desc: "<b>Connessione invisibile:</b> Evita girelle che appesantirebbero inutilmente il fronte dell'esca e causerebbero attrito nel lancio." },
        { dist: "100-150 cm", bp_dist: "1.5m", bp_short: "Leader", icon: "hook", fa: "fa-fish-fins", title: "Fluorocarbon Leader", desc: "<b>Fluoro 0.25 - 0.35 mm:</b> Terminale lungo, legato alla fine a un moschettone a profilo tondo che lascia all'esca massima libertà di scodinzolare." }
      ]
    };

    const rigTexas = {
      title: "Texas Rig Antialga",
      desc: "L'innesco antialga supremo. Il profilo aerodinamico e la punta dell'amo nascosta permettono a questa geometria di insinuarsi tra tronchi, sassi e posidonia fitta senza mai incagliarsi.",
      steps: [
        { dist: "", bp_dist: "", bp_short: "Mainline", icon: "weight", fa: "fa-minus", title: "Lenza Madre o Fluoro", desc: "<b>Nylon o Fluoro diretto:</b> Diametri sostenuti per estrarre di forza il pesce dalle cover intricate." },
        { dist: "Scorrevole", bp_dist: "Libero", bp_short: "Bullet", icon: "weight", fa: "fa-caret-up", title: "Piombo a Proiettile", desc: "<b>Tungsteno o Piombo:</b> La punta a cono rivolta verso la lenza gli fa deviare rami e alghe fluidamente." },
        { dist: "Fermo Amo", bp_dist: "Click", bp_short: "Perlina", icon: "swivel", fa: "fa-circle", title: "Perlina di Vetro", desc: "<b>Richiamo acustico:</b> Protegge il nodo e, sbattendo contro il piombo a ogni jerkata, emette un suono sordo che fa impazzire i predatori in agguato." },
        { dist: "Innesco", bp_dist: "Weedless", bp_short: "Offset", icon: "hook", fa: "fa-worm", title: "Amo Offset ed Esca Softbait", desc: "<b>Innesco Weedless:</b> Amo a gomito. Infila la punta nella testa della gomma, falla uscire, ruotala e nascondi leggermente la punta nella schiena dell'esca." }
      ]
    };

    const rigJighead = {
      title: "Testina Piombata (Jig Head)",
      desc: "La presentazione più reattiva ed elementare per le esche siliconiche. Perfetta per sondare fondali puliti facendola saltellare o recuperandola a dente di sega.",
      steps: [
        { dist: "", bp_dist: "", bp_short: "Leader", icon: "weight", fa: "fa-minus", title: "Fluorocarbon Leader", desc: "<b>Fluoro 0.25 - 0.35 mm:</b> Almeno un metro di terminale per difendersi dallo sfregamento sul fondo." },
        { dist: "Diretto", bp_dist: "Nodo", bp_short: "Jig Head", icon: "hook", fa: "fa-anchor", title: "Jig Head", desc: "<b>Niente Snap:</b> Lega il fluorocarbon direttamente all'occhiello della testina per trasmettere in asse perfetto ogni tuo movimento. Infila la gomma perfettamente dritta." }
      ]
    };

    const rigRoubaisienne = {
      title: "Lenza Roubaisienne",
      desc: "La pesca di precisione al millimetro. L'esca non viene lanciata, ma appoggiata e trattenuta in linea retta sopra il pastore. Costruzione estremamente leggera e geometrica.",
      steps: [
        { dist: "Apicale", bp_dist: "Ammort.", bp_short: "Elastico", icon: "float", fa: "fa-minus", title: "Elastico Interno", desc: "<b>Ammortizzatore:</b> Il vettino della canna è cavo e contiene un elastico calibrato che si estende durante la fuga del pesce, permettendo l'uso di fili capillari." },
        { dist: "Pelo d'acqua", bp_dist: "Millimetri", bp_short: "Galleggiante", icon: "float", fa: "fa-map-pin", title: "Galleggiante a filo d'antenna", desc: "<b>Portate irrisorie (0.10g - 0.75g):</b> Tarato a bolla, scende non appena il pesce sfiora l'esca. Forma a carota o a goccia." },
        { dist: "Su 40 cm", bp_dist: "Geometria", bp_short: "Piombini", icon: "weight", fa: "fa-ellipsis-vertical", title: "Pallini Spaccati o Styl", desc: "<b>Micro-taratura:</b> Pallini minuscoli disposti a corona o a bulk a seconda della velocità dell'acqua, per presentare l'esca in caduta ultra-naturale." },
        { dist: "Micro asola", bp_dist: "Loop", bp_short: "Amo", icon: "hook", fa: "fa-fish", title: "Terminale corto (15-20cm)", desc: "<b>Fili capillari:</b> Nylon o Fluoro da 0.08 o 0.10. Amo dal n.18 al n.24 a filo tondo e leggero per non appesantire il bigattino." }
      ]
    };

    const rigFondoSporco = {
      title: "Fondo Cieco per Ostacoli e Melma",
      desc: "Montatura spartana per estrarre la preda di forza dagli ambienti peggiori prima che si intani. Anguille, Siluri e grossi Gatti non hanno scampo.",
      steps: [
        { dist: "", bp_dist: "Diretto", bp_short: "Mainline", icon: "weight", fa: "fa-minus", title: "Nylon di diametro importante", desc: "<b>Filo 0.35 - 0.50 mm:</b> Bandita la leggerezza. Serve un filo estremamente resistente all'abrasione da sfregamento su rami e rocce sommerse." },
        { dist: "Scorrevole", bp_dist: "Scorr.", bp_short: "Piombo", icon: "weight", fa: "fa-weight-hanging", title: "Piombo compatto a Pera", desc: "<b>Zero fronzoli:</b> Forma liscia e compatta per non bloccarsi sui legni. Libero di scorrere sulla lenza." },
        { dist: "Fermo", bp_dist: "Tutela", bp_short: "Perla Gomma", icon: "weight", fa: "fa-circle-stop", title: "Gommino Salva-nodo Max", desc: "<b>Ammortizzazione:</b> Goccia in gomma spessa per assorbire i continui urti del piombo sul nodo della girella." },
        { dist: "Fine Trave", bp_dist: "Forte", bp_short: "Girella", icon: "swivel", fa: "fa-link", title: "Girella Rolling Oversize", desc: "<b>Misura 6 - 8:</b> Indispensabile, specialmente con le anguille, per sopportare i paurosi avvitamenti del pesce allamato sul fondo." },
        { dist: "15-20 cm", bp_dist: "Corto", bp_short: "Esca bassa", icon: "hook", fa: "fa-worm", title: "Terminale Cortissimo anti-garbuglio", desc: "<b>Terminale rigido 0.30+:</b> Deve essere così corto da tenere l'esca voluminosa a ridosso del piombo, impedendo che fluttui allargandosi e andando ad arrotolarsi tra le frasche sommerse." }
      ]
    };

    const rigFondoRoccia = {
      title: "Paternoster Fondo con Piombo a Perdere",
      desc: "L'unico rig di sopravvivenza concepito per pescare in mezzo a scogliere frastagliate e tane di gronghi. Sacrifica la zavorra per salvare la preda e il resto della lenza.",
      steps: [
        { dist: "Sul Trave", bp_dist: "Fisso", bp_short: "Girella 3 Vie", icon: "swivel", fa: "fa-link", title: "Girella a 3 Vie", desc: "<b>Cuore del sistema:</b> Una girella a tre occhielli. Dall'occhiello superiore arriva la lenza madre potente." },
        { dist: "Derivazione Giù", bp_dist: "0.20 Sottile", bp_short: "Scarto", icon: "weight", fa: "fa-weight-hanging", title: "Filo a perdere e Piombo", desc: "<b>Punto di rottura calibrato:</b> Lega all'occhiello inferiore 30cm di filo molto più sottile del resto e chiudi con piombo allungato. Se si incastra nelle fessure, tirando si spaccherà solo questo sottile pezzo, liberando pesce e montatura." },
        { dist: "Derivazione Lato", bp_dist: "Sospeso", bp_short: "Terminale", icon: "hook", fa: "fa-fish", title: "Terminale laterale alto", desc: "<b>Esche staccate dai sassi:</b> Sull'occhiello laterale, aggancia un finale corto e tenace. L'amo lavorerà sollevato e perpendicolare rispetto alle rocce, lontano dai granchi." }
      ]
    };

    const rigFondoScorrevole = {
      title: "Fondo Classico Scorrevole",
      desc: "La lenza regina e senza tempo per sabbia e ghiaia. Il pesce afferra l'esca, il filo scorre libero nel foro del piombo e la tocca si trasmette in canna senza alcun attrito o insospettimento.",
      steps: [
        { dist: "Scorrevole", bp_dist: "Libero", bp_short: "Piombo", icon: "weight", fa: "fa-weight-hanging", title: "Piombo a Oliva o Saponetta", desc: "<b>Da 30g a 100g:</b> La lenza madre vi passa attraverso. La forma schiacciata tiene bene la corrente, la forma a oliva vola lontano." },
        { dist: "Fermo", bp_dist: "Salvanodo", bp_short: "Perlina", icon: "weight", fa: "fa-circle-stop", title: "Perlina in gomma morbida", desc: "<b>Tutela vitale:</b> Evita che il foro di ottone del piombo usuri o tranci il nodo sottostante durante i lanci." },
        { dist: "Fine linea", bp_dist: "Chiusura", bp_short: "Girella", icon: "swivel", fa: "fa-link", title: "Girella Rolling n.12", desc: "<b>Antitorsione:</b> Impedisce che le rotazioni di inneschi voluminosi o asimmetrici sfilaccino la lenza madre." },
        { dist: "80-150 cm", bp_dist: "Allungato", bp_short: "Terminale", icon: "hook", fa: "fa-fish", title: "Terminale lungo e fluttuante", desc: "<b>Invisibilità e naturalità:</b> Spezzone lungo in fluorocarbon per allontanare l'esca dall'imponente ingombro metallico del piombo sul fondo pulito." }
      ]
    };

    const rigCarpfishing = {
      title: "Safety Clip Rig",
      desc: "L'innesco più celebre, sicuro e mortale al mondo per i ciprinidi. Combina la devastante auto-ferrata meccanica con un sistema fish-friendly che espelle il piombo incagliato.",
      steps: [
        { dist: "Ultimi 80 cm", bp_dist: "Pesante", bp_short: "Leadcore", icon: "weight", fa: "fa-minus", title: "Leadcore o Tubing", desc: "<b>Mimetismo:</b> Guaina flessibile piombata che aderisce e si mimetizza perfettamente sul fondale, spiaccicando la lenza per non far spaventare le carpe al contatto con le pinne." },
        { dist: "Corpo Fisso", bp_dist: "Clip", bp_short: "Lead Clip", icon: "float", fa: "fa-paperclip", title: "Safety Lead Clip in plastica", desc: "<b>Cuore del Rig:</b> Si infila sul leadcore. Il piombo a pera o flat pear viene agganciato al braccetto laterale e chiuso dal cono in gomma." },
        { dist: "Incastrata", bp_dist: "Ferma", bp_short: "Girella n.8", icon: "swivel", fa: "fa-link", title: "Girella a misura esatta", desc: "<b>Effetto Auto-Bolt:</b> La girella si tira a forza dentro il corpo della safety clip. Quando la carpa aspira l'esca e alza la testa, la tensione immediata sul piombo bloccato fa conficcare l'amo nella carne da solo." },
        { dist: "15-20 cm", bp_dist: "Morbido", bp_short: "Hair Rig", icon: "hook", fa: "fa-fish", title: "Terminale Trecciato ed Hair Rig", desc: "<b>Libertà totale:</b> Filo intrecciato molto morbido. Amo a occhiello con nodo senza nodo. L'esca non va sull'amo ma bloccata sul capello posteriore." }
      ]
    };

    const rigMethod = {
      title: "Method Feeder In-Line Rig",
      desc: "La trappola subdola delle acque commerciali per carpe e carassi. Offre al pesce un mucchietto di pastura perfettamente compattato in cui l'esca è celata, garantendo un'auto-ferrata violentissima.",
      steps: [
        { dist: "Scorrevole", bp_dist: "In-line", bp_short: "Pasturatore", icon: "float", fa: "fa-basket-shopping", title: "Method Feeder Piatto", desc: "<b>Base piatta, dorso alettato:</b> La lenza scivola dritta dentro il tubicino centrale. La base appesantita assicura che il pasturatore cada sempre rivolto nel verso giusto." },
        { dist: "Forzata a mano", bp_dist: "A Incastro", bp_short: "Girella", icon: "swivel", fa: "fa-link", title: "Girella Quick-Change", desc: "<b>Blocco meccanico:</b> Girella specifica tirata a incastro nel gommino alla base del Method. Il pesce, mangiando, si trova immediatamente agganciato all'inerzia del pasturatore colmo di pellet bagnato." },
        { dist: "Massimo 10 cm", bp_dist: "Cortissimo", bp_short: "Amo a vista", icon: "hook", fa: "fa-fish", title: "Terminale Corto e Rigido", desc: "<b>Innesco celato:</b> Finale rigido in fluoro o treccia coated molto corto. L'esca va innescata sull'hair-ring e poi pressata fisicamente all'interno del blocco di pastura tramite lo stampino del method." }
      ]
    };

    const rigHelicopter = {
      title: "Helicopter Rig",
      desc: "L'invenzione inglese risolutiva per pescare distante su fondali disastrosi e sprofondanti. Quando la zavorra affonda nella melma o nelle alghe, l'amo resta fuori scivolando in alto e ruota a 360 gradi senza garbugliare in volo.",
      steps: [
        { dist: "Punta inferiore", bp_dist: "Fondo Cieco", bp_short: "Zavorra", icon: "weight", fa: "fa-weight-hanging", title: "Feeder o Piombo finale", desc: "<b>Punto di impatto:</b> La lenza madre o il leadcore termina legata direttamente al pasturatore cage o al piombo a goccia. Sfonderà il fango per ancorarsi." },
        { dist: "Da 30 a 50 cm su", bp_dist: "Regolabile", bp_short: "Rotazione", icon: "swivel", fa: "fa-link", title: "Snodo ruotante libero", desc: "<b>Posizionamento strategico:</b> Sul trave principale, a 40cm dalla fine, fissa due stopper di gomma distanziati di 2cm. In mezzo gira impazzita una microgirella a barilotto." },
        { dist: "15-20 cm", bp_dist: "Sospeso", bp_short: "Amo Rigido", icon: "hook", fa: "fa-fish", title: "Terminale sventolante e rigido", desc: "<b>Evita incroci:</b> Fluoro abbastanza rigido collegato alla girella alta. Durante il tremendo lancio sventola dietro al piombo come le pale di un elicottero. In acqua poggia sopra la vegetazione." }
      ]
    };

    const rigRunningPesante = {
      title: "Running Rig per Correnti Gravose",
      desc: "Massimizza la sensibilità e scarica la potenza dei fiumi. Il moschettone plastico scivola creando zero attrito al morso di grossi barbi e cavedani, mentre la brillatura mantiene disteso il bracciolo in piena corrente.",
      steps: [
        { dist: "Scorrimento infinito", bp_dist: "Zero attriti", bp_short: "Moschettone", icon: "float", fa: "fa-basket-shopping", title: "Moschettone con occhiello in teflon", desc: "<b>Sgancio rapido e scivolamento:</b> Libero in lenza. Qui aggancerai pesanti Block-end o Cage Feeder in base alla furia dell'acqua." },
        { dist: "Fermo", bp_dist: "Cuscinetto", bp_short: "Salvanodo", icon: "weight", fa: "fa-circle-stop", title: "Perlina salvanodo o Line Stop", desc: "<b>Gomma dura:</b> Ammortizza in modo decisivo gli impatti di zavorre così pesanti sul nodo della lenza." },
        { dist: "10-15 cm", bp_dist: "Treccina", bp_short: "Brillatura", icon: "swivel", fa: "fa-link", title: "Brillatura Intrecciata", desc: "<b>Distanziatore artigianale:</b> Crea una treccina con la stessa lenza madre rigirata su se stessa per 15cm. Irrigidisce lo stacco dal piombo e termina in una micro-girella. Impedisce all'amo di attorcigliarsi alla gabbietta." },
        { dist: "80-150 cm", bp_dist: "In Scia", bp_short: "Terminale", icon: "hook", fa: "fa-fish", title: "Terminale lunghissimo fluttuante", desc: "<b>Naturalezza in corrente:</b> Fluoro o Nylon lungo oltre il metro. L'esca deve ondeggiare dolcemente decine di centimetri a valle del pasturatore, esattamente nella corsia profumata generata dalla pastura sciolta." }
      ]
    };

    const rigRunningStandard = {
      title: "Running Rig Classico Polivalente",
      desc: "La montatura più semplice, efficace e sportiva per laghi e fiumi lenti. Ideale per la ricerca di breme, piccoli carassi e tinche su fondali piatti.",
      steps: [
        { dist: "Scorrevole", bp_dist: "Libero", bp_short: "Feeder", icon: "float", fa: "fa-basket-shopping", title: "Pasturatore a Gabbietta", desc: "<b>Attrito minimo:</b> Moschettone metallico o in plastica libero di scorrere sul nylon madre. Cage feeder leggero." },
        { dist: "Blocco", bp_dist: "Chiusura", bp_short: "Girellina", icon: "swivel", fa: "fa-link", title: "Girella e Perlina Salvanodo", desc: "<b>Classica chiusura:</b> Perlina in vetro o gomma e micro girella rotante legata con nodo Palomar." },
        { dist: "50-70 cm", bp_dist: "Disteso", bp_short: "Amo ed Esca", icon: "hook", fa: "fa-fish", title: "Terminale di media lunghezza", desc: "<b>Appoggio corretto:</b> Filo 0.12 o 0.14. Lunghezza media calcolata per far atterrare l'innesco a ridosso dell'impronta di farina e bigattini rilasciata dal feeder." }
      ]
    };

    const rigBoloAperta = {
      title: "Bolognese, Spallinata a Scalare",
      desc: "Costruzione purista da passata in porto o fiumi molto lenti. L'obiettivo è ottenere una calata quasi geometricamente invisibile e lentissima, ingannando prede dotate di ottima vista o diffidenti.",
      steps: [
        { dist: "Tarato a zero", bp_dist: "Spillo", bp_short: "Galleggiante", icon: "float", fa: "fa-map-pin", title: "Galleggiante affusolato", desc: "<b>Portate minime (1-2g):</b> Tarato millimetricamente in modo che dalla superficie affiori solo mezza astina rossa. Il pesce non avvertirà trazione al momento dell'affondo." },
        { dist: "Distribuiti in 1.5 m", bp_dist: "Aperta", bp_short: "Spallinata", icon: "weight", fa: "fa-ellipsis-vertical", title: "10-15 Pallini a Scalare Regolare", desc: "<b>Geometria variabile:</b> Pallini molto piccoli. Raggruppa i primi 4 o 5 vicini in alto, e scendendo lasciali sempre più distanziati. Es: 5cm poi 8cm poi 12cm poi 18cm fino agli ultimi." },
        { dist: "Nodo su nodo", bp_dist: "Trasparente", bp_short: "Loop", icon: "swivel", fa: "fa-link", title: "Micro Asola", desc: "<b>Divieto di metallo:</b> Una girella, per quanto piccola, appesantirebbe la base. Crea un'asolina doppia sulla lenza madre a cui agganciare il terminale." },
        { dist: "80-100 cm", bp_dist: "0.10 - 0.12", bp_short: "Capillare", icon: "hook", fa: "fa-fish", title: "Terminale lungo invisibile", desc: "<b>Fluoro puro capillare:</b> Esche leggere accompagnate sul fondo dolcemente." }
      ]
    };

    const rigBoloTorpille = {
      title: "Bolognese, Montatura a Torpille",
      desc: "L'artiglieria pesante per bucare i fiumi tumultuosi, le mareggiate da scogliera, o per attraversare in un istante gli strati d'acqua alti infestati dai pesciolini di disturbo. Mette subito in pesca l'esca.",
      steps: [
        { dist: "A vista", bp_dist: "Palla o Pera", bp_short: "Galleggiante", icon: "float", fa: "fa-map-pin", title: "Galleggiante Sferico o a Pera Invertita", desc: "<b>Portata massiccia:</b> Forma arrotondata e astina molto voluminosa per evitare che mulinelli d'acqua o onde spumose lo affondino creando finte tocche." },
        { dist: "A 40 cm dal terminale", bp_dist: "80% Peso", bp_short: "Torpille", icon: "weight", fa: "fa-cubes", title: "Torpille Secca o Bulk Pieno", desc: "<b>Sasso nel vuoto:</b> Inserisci una singola torpille bloccata da stopper, oppure pinza tutti insieme in soli 3cm un blocco di 6 o 7 pallini molto grossi. Taglieranno l'acqua portando giù il terminale in frazioni di secondo." },
        { dist: "Ogni 15 cm", bp_dist: "Stesura", bp_short: "Spie", icon: "weight", fa: "fa-cube", title: "Due pallini spia", desc: "<b>Leva e assetto:</b> Due pallini distanziati nello spazio sottostante alla torpille per ammorbidire lo sbalzo e distendere dritta la parte prima della girella." },
        { dist: "Fine Trave", bp_dist: "Antigarbuglio", bp_short: "Girella 18", icon: "swivel", fa: "fa-link", title: "Girella Rolling", desc: "<b>Scarico Torsioni:</b> L'acqua violenta che scorre sull'innesco crea un effetto elica devastante. Girella fondamentale." },
        { dist: "35-50 cm", bp_dist: "Corto", bp_short: "Amo Robusto", icon: "hook", fa: "fa-fish", title: "Terminale Tenace", desc: "<b>Amo forgiato spesso:</b> Essendo molto corto segnala all'istante, ma al momento della ferrata subirà strattoni tremendi nel flusso d'acqua." }
      ]
    };

    const rigInglese = {
      title: "Montatura Waggler",
      desc: "Lo strumento d'ingegneria anglosassone creato per vincere vento frontale e lanciare un galleggiante aerodinamico a lunghissima distanza nei laghi, gestendo profondità spesso superiori ai 4-5 metri.",
      steps: [
        { dist: "Scorrevole", bp_dist: "Blocco Fondo", bp_short: "Fermo", icon: "weight", fa: "fa-minus", title: "Nodo Scorsoio in cotone", desc: "<b>Segna-profondità:</b> Nodo fatto a mano sulla lenza che sale negli anelli e permette di lanciare. Si bloccherà contro la perlina superiore del waggler impostando la profondità di stazionamento." },
        { dist: "Libero", bp_dist: "Waggler", bp_short: "Galleggiante", icon: "float", fa: "fa-map-pin", title: "Waggler con attacco basso", desc: "<b>Anti-vento:</b> L'affondamento della lenza sotto il pelo dell'acqua neutralizza l'attrito del vento. Uso di Waggler inserito tramite attacco rapido per galleggianti inglesi." },
        { dist: "A 1 metro dal terminale", bp_dist: "Taratura", bp_short: "Bulk Piombi", icon: "weight", fa: "fa-cubes", title: "Bulk in Pallini Sferici Grandi", desc: "<b>Affinamento:</b> Se il waggler è già pre-piombato col suo inserto d'ottone, servirà solo un modesto bulk di 4 o 5 pallini grossi per scendere velocemente sul fondo in assetto di volo perfetto." },
        { dist: "Sopra girella", bp_dist: "Sensore", bp_short: "Pallino Spia", icon: "weight", fa: "fa-cube", title: "Pallino Spia Basso", desc: "<b>Lettura Starata:</b> Un singolo pallino posto vicino alla girella finale. Se il pesce afferra l'esca e si alza, solleva il pallino spia facendo improvvisamente emergere 2-3 cm dell'antenna del Waggler." },
        { dist: "Base Trave", bp_dist: "Antielica", bp_short: "Tripla", icon: "swivel", fa: "fa-link", title: "Microgirella Tripla", desc: "<b>Scarico Estremo:</b> I recuperi a vuoto di inneschi da 30 metri sbatterebbero distruggendo la lenza. La girella a triplo barilotto ruota fluidamente." },
        { dist: "40-60 cm", bp_dist: "Disteso", bp_short: "Amo Fine", icon: "hook", fa: "fa-fish", title: "Terminale Morbido", desc: "<b>Fluorocarbon Fluttuante:</b> Filo molto duttile, calcolato per far depositare l'esca con un appoggio naturale morbido nel raggio pasturato a fionda." }
      ]
    };

    const rigSurfMosso = {
      title: "Teleferica, Short Rovesciato",
      desc: "L'architettura antiavvolgimento per sfidare surf e schiumate poderose, concepita per presentare tranci o pesci vivi ad ampi predatori senza ingarbugliare tra le onde.",
      steps: [
        { dist: "Fine Trave 0.50+", bp_dist: "Tenuta Fondo", bp_short: "Piramide", icon: "weight", fa: "fa-weight-hanging", title: "Piombo da Estrema Tenuta", desc: "<b>Fondo Rampa o Piramide:</b> Si insabbia con gli spigoli taglienti garantendo l'ancoraggio della struttura centrale contro le violente maree di ritorno e i frangenti." },
        { dist: "A 1.5 m dal Piombo", bp_dist: "Anti Tangle", bp_short: "Snodo Alto", icon: "swivel", fa: "fa-link", title: "Snodo Alto", desc: "<b>Incollato o tra 2 Nodi:</b> A un metro e mezzo di altezza sul trave inserisci una piccola girella rolling fermata da microsfere incastrate tra tubetti di gomma siliconica o micro perline gommate. Mantiene il bracciolo fisicamente fuori dalla schiuma bassa." },
        { dist: "Lungo (100-150cm)", bp_dist: "Rigidissimo", bp_short: "Amo Serre", icon: "hook", fa: "fa-fish", title: "Terminale Sospeso Antitaglio", desc: "<b>Difesa Finale:</b> Per Spigole o Orate si lega un Fluorocarbon dello 0.35/0.40 rigido che ondeggia libero; se il target è Serra, Leccia o Lucci si inseriscono gli ultimi 20cm in cavetto d'acciaio o titanio con ami Beak generosi." }
      ]
    };

    const rigSurfCalmo = {
      title: "Long Arm",
      desc: "Tracciato esile e millimetrico. La lenza scorre infinita per presentare all'orata e ai pesci diffidenti l'inganno più perfetto su fondali pulitissimi.",
      steps: [
        { dist: "Sottile", bp_dist: "0.35 - 0.40", bp_short: "Trave Nudo", icon: "weight", fa: "fa-minus", title: "Trave Semplificato", desc: "<b>Nylon scorrevolissimo:</b> Evita fronzoli, un monofilo superlativo e siliconato che lascia spazio solo all'aggancio del terminale." },
        { dist: "Fine Trave", bp_dist: "Mutevole", bp_short: "Piombo Scorr.", icon: "weight", fa: "fa-weight-hanging", title: "Piombo Scorrevole a Ogiva o Sporteen", desc: "<b>Volo Lungo:</b> Grammature importanti, passante libero. Vola molto lontano grazie all'aerodinamica compatta, non essendoci correnti che lo fanno rotolare via." },
        { dist: "A 5 cm dal Piombo", bp_dist: "Chiusura", bp_short: "Micro Snodo", icon: "swivel", fa: "fa-link", title: "Snodo Basso Anti-Urto", desc: "<b>Tassativo:</b> Micro perlina fluo salvanodo e girellina invisibile proprio a fine lenza, a poggiare letteralmente sul piombo." },
        { dist: "150-250 cm", bp_dist: "Extra Lontano", bp_short: "Arenicola", icon: "hook", fa: "fa-fish", title: "Terminale Capillare Esteso", desc: "<b>Allontanare l'inganno:</b> Fluorocarbon sottile fino a due metri di lunghezza che allunga l'esca ben distante dalla massa oscura del piombo. Inserisci vicino all'amo un flotterino pop-up per staccare l'esca da granchi molesti." }
      ]
    };

    const rigBolentino = {
      title: "Trave a 3 Braccioli, Paternoster Multiplo",
      desc: "Impianto da barca per calate in verticale perfetta. Esplora più fasce di profondità contemporaneamente, micidiale se usato con inneschi multipli vicino agli spot rocciosi a largo.",
      steps: [
        { dist: "Inizio Lenza", bp_dist: "Madre 0.40", bp_short: "Moschettone", icon: "swivel", fa: "fa-link", title: "Girella con moschettone", desc: "<b>L'Aggancio al trave madre:</b> Permette di scambiare al volo tutta la matassa del pater-noster con configurazioni pre-preparate in bobina." },
        { dist: "Ogni 40-50 cm", bp_dist: "Bandiera", bp_short: "Snodi Multipli", icon: "swivel", fa: "fa-plus", title: "Tre Snodi Incollati o Bloccati", desc: "<b>Anti-Increspatura Verticale:</b> Distanzia gli snodi a T a distanze perfettamente uguali, bloccati sul trave grosso tramite perline incollate al cianoacrilato o con stopper minuscoli." },
        { dist: "Derivazioni 20-30cm", bp_dist: "Fili Sostenuti", bp_short: "Braccioli", icon: "hook", fa: "fa-fish", title: "Braccioli Terminalini", desc: "<b>Rigidi ed equidistanti:</b> Fluorocarbon massicci legati a bandiera. Assolutamente più corti della distanza tra gli snodi stessi per impedire catastrofici intrecci tra i vari ami a mare vivo." },
        { dist: "Base a Perpendicolo", bp_dist: "Spaccafondo", bp_short: "Piombo Goccia", icon: "weight", fa: "fa-weight-hanging", title: "Piombo Terminale", desc: "<b>Zero corrente:</b> Forma a goccia grossa unita tramite girellina inferiore. Va a piombo diretto a picco nell'abisso." }
      ]
    };

    const rigTraina = {
      title: "Lenza da Traina Costiera Leggera",
      desc: "Velocità di crociera e caccia di superficie o mezz'acqua ad agenti velocissimi. Assorbe le tremende prime testate dell'attacco mitigando l'estrema rigidità della lenza in trazione.",
      steps: [
        { dist: "Bobina", bp_dist: "Zero Pancia", bp_short: "Trecciato Base", icon: "float", fa: "fa-bars-staggered", title: "Trecciato Multifibra Lineare", desc: "<b>Taglio d'acqua chirurgico:</b> Filo principale trecciato che non soffre della spinta dinamica prolungata dell'acqua e ha allungamento nullo per far lavorare precisamente le ancorette dell'hardbait." },
        { dist: "Connessione", bp_dist: "AntiTorsione Max", bp_short: "Girella Tripla", icon: "swivel", fa: "fa-link", title: "Girella a Barilotto Triplo", desc: "<b>Salvavita:</b> Il perno dell'intero apparato trainato. Anche la minima imperfezione nel nuoto di un cucchiaino o piuma genererebbe eliche assurde, il barilotto triplo ruota tre volte ed elimina i torcimenti." },
        { dist: "Da 5 a 10 metri", bp_dist: "Il Bungee", bp_short: "Pre-Leader", icon: "weight", fa: "fa-minus", title: "Lunghissimo Pre-Terminale in Nylon", desc: "<b>Molla di ammortizzazione:</b> Essendo la treccia anelastica e il colpo a motore in movimento brutale, la giunzione di enormi metri di Nylon spesso, srotolato per sfruttare l'elasticità strutturale del monofilo." },
        { dist: "Fino all'Esca", bp_dist: "Fluorocarbon", bp_short: "Terminale", icon: "hook", fa: "fa-fish", title: "Attacco Diretto o Snap Rinforzato", desc: "<b>Terminale invisibile:</b> Ulteriori 1,5 metri in Fluoro legati al pre-terminale, conclusi su nodi blindati diretti sull'anello dell'esca, o moschettone iper rinforzato per cambiare Piume o Minnow di 10-15 cm al volo." }
      ]
    };

    const rigTenya = {
      title: "Terminale Light-Jigging",
      desc: "La fusione tra spinning giapponese e bolentino di precisione. Consente movimenti cadenzati al millimetro ad esche miste gomma-piombo-organiche sul fondale sabbioso per insidiare grosse orate, dentici e pagelli.",
      steps: [
        { dist: "Dalla canna", bp_dist: "Multicolor", bp_short: "Treccia in bobina", icon: "float", fa: "fa-bars-staggered", title: "Treccia Sensibile Multi-colorata", desc: "<b>Lettura di Profondità:</b> Trecciato rigorosamente segmentato con colori ogni 10 metri per far calare esattamente l'esca sulle zone intercettate dall'ecoscandaglio." },
        { dist: "Sfregamento Anelli", bp_dist: "FG Diretto", bp_short: "Nodo Pulito", icon: "swivel", fa: "fa-link", title: "Nodo Diretto e Invisibile", desc: "<b>Scorrimento profondo:</b> In mare profondo, si preferisce il nodo FG Knott per collegare saldamente decine di metri di leader senza incepparsi nel cimino durate l'innesco." },
        { dist: "Da 4 a 6 Metri", bp_dist: "Assorbitore", bp_short: "Fluorocarbon", icon: "weight", fa: "fa-minus", title: "Lungo Leader in Fluorocarbon", desc: "<b>Assorbitore Anti-denti:</b> Filo spesso per contrastare abrasioni e mascelle ossute degli sparidi in abisso, ed elasticità basica per le ferrate decise in verticale." },
        { dist: "All'ultimo tocco", bp_dist: "Assist Hooks", bp_short: "Jig Kabura", icon: "hook", fa: "fa-anchor", title: "Innesco Gambero e Gomma", desc: "<b>Head piombata Tenya:</b> Legatura diretta all'anello della testina tondeggiante. Sull'amo fisso inneschi gambero o sarda intera, mentre l'amo assist flottante va inserito lateralmente." }
      ]
    };

    const rigTocco = {
      title: "Pesca al Tocco in Torrente",
      desc: "La montatura artigianale per antonomasia. Elimina del tutto il galleggiante affidandosi unicamente all'indice del pescatore e al profilo idrodinamico curvo creato per insinuarsi negli stretti raschi alpini.",
      steps: [
        { dist: "Fuori acqua", bp_dist: "Visivo Tattile", bp_short: "Segnafilo", icon: "float", fa: "fa-eye", title: "Segnafilo", desc: "<b>Guaina Fluo Orizzontale:</b> Lenza madre dello 0.18 o 0.20, con un tubicino di gomma colorata incollato a mezza altezza da tenere in vista sopra il pelo dell'acqua. Permette di capire dove viaggia l'esca nel caos della turbolenza e si tende appena c'è l'abboccata." },
        { dist: "Distribuiti in 40-50 cm", bp_dist: "A Scalare", bp_short: "Corona Piombi", icon: "weight", fa: "fa-cubes", title: "Corona Sferica Idrodinamica", desc: "<b>Forma ad Arco:</b> Un vero monile di piombo. In base alla schiuma, pinza dai 10 ai 35 minuscoli piombini sferici identici distanziandoli sempre meno a scendere. L'ultimo sarà il più vicino all'altro, piegando l'assetto della lenza per superare la forte corrente e raschiare il suolo senza incastrarsi brutalmente." },
        { dist: "Fine Corona", bp_dist: "Anti Elica Libera", bp_short: "Microgirella", icon: "swivel", fa: "fa-link", title: "Microgirella n.24", desc: "<b>Massimo Mimetismo:</b> Girellina nera microscopica. Deve essere inavvertibile ma essenziale per contrastare le paurose rotazioni causate dal lombrico in piena turbolenza di fiume." },
        { dist: "30-45 cm", bp_dist: "Vivo o Naturale", bp_short: "Terminale Rigido", icon: "hook", fa: "fa-worm", title: "Terminale per Esca Viva", desc: "<b>Nylon tenace:</b> Fluoro o Nylon dello 0.16 o 0.18 abbastanza rigido con un robustissimo amo forgiato a paletta. Da innescare ruotando lombrico doppio vivo o appuntando la camola in modo simmetrico." }
      ]
    };


    // --- IL CERVELLO (INCROCIO DEI MULTI-SELECT E PROFONDITA) ---
    function getRigProfile(tec, acq, prof, fonStr, tarStr, escStr) {
      const tar = tarStr.toLowerCase();
      const esc = escStr.toLowerCase();
      const fon = fonStr.toLowerCase();

      // 1. VERTICALI E MARE OFFSHORE
      if (tec === 'eging' || esc.includes('egi') || esc.includes('totanar') || tar.includes('calamar') || tar.includes('seppi') || tar.includes('polp')) return rigEging;
      if (tec === 'bolentino') return rigBolentino;
      if (tec === 'traina' || acq === 'offshore') return rigTraina;
      if (tec.includes('tenya') || tec.includes('kabura') || esc.includes('kabura') || esc.includes('inchiku')) return rigTenya;
      
      // 2. CARPFISHING / METHOD
      if (tec === 'carpfishing' || esc.includes('boile') || esc.includes('pellet')) {
        if (tec === 'feeder') return rigMethod;
        return rigCarpfishing; 
      }

      // 3. ROUBAISIENNE / TOCCO
      if (tec.includes('roubaisienne') || tec.includes('fissa')) return rigRoubaisienne;
      if (tec.includes('tocco') || tec === 'trout_area') return rigTocco; 

      // 4. PESCI SPORCO / FONDO
      if (tar.includes('gatto') || tar.includes('anguilla') || tar.includes('grongo') || tar.includes('murena') || tar.includes('siluro')) {
        if (fon.includes('scogli') || fon.includes('sassi') || fon.includes('roc') || fon.includes('ciottoli') || fon.includes('ghiaia')) return rigFondoRoccia;
        if (fon.includes('rami') || fon.includes('tronchi') || fon.includes('fango') || fon.includes('melma') || fon.includes('ostacoli') || fon.includes('relitti')) return rigFondoSporco;
        return rigFondoSporco;
      }

      // 5. SPINNING & PREDATORI
      if (tec === 'spinning' || tec === 'baitcasting' || tar.includes('predatori') || tar.includes('luccio') || tar.includes('serra') || tar.includes('barracuda') || esc.includes('minnow') || esc.includes('jerk') || esc.includes('popper') || esc.includes('wtd') || esc.includes('rotante')) {
        if (tar.includes('luccio') || tar.includes('serra') || tar.includes('barracuda') || tar.includes('siluro')) return rigSpinningLuccio;
        
        if (esc.includes('gomma') || esc.includes('shad') || esc.includes('creature') || esc.includes('grub') || esc.includes('worm')) {
          if (fon.includes('alghe') || fon.includes('ostacoli') || fon.includes('scogli') || fon.includes('posidonia') || fon.includes('erbai') || fon.includes('rami')) return rigTexas;
          return rigJighead;
        }
        return rigSpinningClassico;
      }

      // 6. FEEDER / LEDGERING
      if (tec === 'feeder' || tec === 'ledgering') {
        if (tar.includes('carpa') || acq === 'cava') return rigMethod;
        if (fon.includes('fango') || fon.includes('melma') || fon.includes('alghe') || fon.includes('erbai') || fon.includes('posidonia')) return rigHelicopter;
        if (acq === 'fiume_veloce' || acq === 'foce' || acq === 'torrente') return rigRunningPesante;
        return rigRunningStandard;
      }

      // 7. BOLOGNESE / INGLESE (IMPATTO PROFONDITA)
      if (tec === 'bolognese') {
        if (prof === 'profonda' || prof === 'abissale') return rigBoloScorrevole; 
        if (acq === 'fiume_veloce' || acq === 'foce' || acq === 'spiaggia_mosso' || acq === 'scogliera_nat' || acq === 'scogliera_art') return rigBoloTorpille;
        return rigBoloAperta; 
      }
      
      if (tec === 'inglese') {
        return rigInglese; // L'inglese gestisce naturalmente la profondità tramite il nodo scorrevole
      }

      // 8. SURFCASTING / FONDO
      if (tec === 'surfcasting' || tec === 'fondo') {
        if (tar.includes('serra') || acq === 'spiaggia_mosso' || esc.includes('viv') || esc.includes('trancio') || esc.includes('sarda')) return rigSurfMosso;
        if (fon.includes('scogli') || fon.includes('sassi') || fon.includes('ciottoli') || fon.includes('relitti')) return rigFondoRoccia;
        if (fon.includes('melma') || fon.includes('rami') || fon.includes('tronchi')) return rigFondoSporco;
        
        if (tec === 'surfcasting' || acq === 'spiaggia_calma' || tar.includes('orata') || tar.includes('mormora') || tar.includes('pagello')) return rigSurfCalmo;
        return rigFondoScorrevole; 
      }

      // FALLBACK UNIVERSALE
      return rigFondoScorrevole;
    }


    // --- OUTPUT RISULTATI E ANIMAZIONI ---
    function elaboraConfigurazione() {
      const tec = document.getElementById("tecnica").value;
      const acq = document.getElementById("acqua").value;
      const prof = document.getElementById("profondita").value;
      
      const fonStr = window['multi_ms-fondale-input'].selected.join(' ') || "";
      const tarStr = window['multi_ms-target-input'].selected.join(' ') || "";
      const escStr = window['multi_ms-esca-input'].selected.join(' ') || "";
      
      // Lettura mista: opzioni selezionate + testo libero per attrezzatura
      let attList = [...window['multi_ms-attrezzi-input'].selected];
      let attText = document.getElementById("ms-attrezzi-input").value.trim();
      if (attText) attList.push(attText);
      const attStr = attList.join(', ');

      // Lettura del casting della canna
      const castText = document.getElementById("casting_canna").value.trim();

      // Interrogazione del Cervello
      const lenza = getRigProfile(tec, acq, prof, fonStr, tarStr, escStr);

      document.getElementById("rTitle").innerText = lenza.title;
      
      // Costruisci la descrizione includendo la nota sull'attrezzatura se inserita
      let descHtml = lenza.desc;
      
      let setupTesto = [];
      if (attStr !== "") setupTesto.push(`<em>"${escapeHtml(attStr)}"</em>`);
      if (castText !== "") setupTesto.push(`casting <em>"${escapeHtml(castText)}"</em>`);

      if (setupTesto.length > 0) {
        descHtml += `<br><br>
        <div style="background: rgba(56, 189, 248, 0.1); padding: 12px 16px; border-radius: 8px; border-left: 3px solid var(--accent-light-blue); font-size: 0.9rem;">
          <i class="fa-solid fa-circle-info" style="color:var(--accent-light-blue); margin-right:6px;"></i> 
          <b style="color:var(--accent-light-blue);">Setup in uso:</b> Hai indicato ${setupTesto.join(" con ")}. Ricordati di bilanciare la zavorra proposta in base al casting della tua canna. Assicurati che lo spessore della lenza madre in bobina sia proporzionato al terminale suggerito per evitare rotture sul nodo di giunzione.
        </div>`;
      }
      document.getElementById("rDesc").innerHTML = descHtml;

      // 1. TIMELINE TESTUALE
      const tlContainer = document.getElementById("rigTimeline");
      tlContainer.innerHTML = "";

      // 2. BLUEPRINT (SCHEMA VISIVO)
      const bpContainer = document.getElementById("blueprintNodes");
      bpContainer.innerHTML = "";

      lenza.steps.forEach((step) => {
        const distHtml = step.dist ? `<span class="dist-badge">${step.dist}</span>` : '';
        tlContainer.innerHTML += `
          <div class="timeline-item">
            <div class="timeline-icon ${step.icon}"><i class="fa-solid ${step.fa}"></i></div>
            <div class="timeline-content">
              <div class="content-head"><h4>${step.title}</h4>${distHtml}</div>
              <p>${step.desc}</p>
            </div>
          </div>
        `;

        bpContainer.innerHTML += `
          <div class="bp-node">
            <div class="bp-label-left">${step.bp_dist}</div>
            <div class="bp-icon ${step.icon}"><i class="fa-solid ${step.fa}"></i></div>
            <div class="bp-label-right">${step.bp_short}</div>
          </div>
        `;
      });

      const card = document.getElementById("resultCard");
      card.classList.remove("active");
      void card.offsetWidth; 
      card.classList.add("active");
      setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    }
