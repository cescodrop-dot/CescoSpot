(function installPhotoUpload(globalScope) {
  'use strict';

  const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
  const MAX_OUTPUT_CHARS = 1_000_000;
  const MAX_DIMENSION = 1200;
  const MIN_DIMENSION = 640;
  const QUALITY_STEPS = [0.78, 0.68, 0.58, 0.48];

  function fail(message, event) {
    if (event?.target) event.target.value = '';
    alert(message);
  }

  function setPreview(dataUrl, hiddenInputId, previewBoxId) {
    const hidden = document.getElementById(hiddenInputId);
    const box = document.getElementById(previewBoxId);
    if (!hidden || !box) throw new Error('Controlli foto non disponibili');

    hidden.value = dataUrl;
    box.innerHTML = '';

    const img = document.createElement('img');
    img.src = dataUrl;
    img.alt = 'Anteprima foto';
    box.appendChild(img);

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'btn-remove-photo';
    removeButton.setAttribute('aria-label', 'Rimuovi foto');
    removeButton.innerHTML = '<i class="fa-solid fa-trash" aria-hidden="true"></i>';
    removeButton.addEventListener('click', event => {
      event.stopPropagation();
      if (typeof globalScope.removePhoto === 'function') {
        globalScope.removePhoto(hiddenInputId, previewBoxId);
      }
    });
    box.appendChild(removeButton);
  }

  function fitSize(width, height, maxDimension) {
    if (width <= maxDimension && height <= maxDimension) return { width, height };
    const scale = Math.min(maxDimension / width, maxDimension / height);
    return {
      width: Math.max(1, Math.round(width * scale)),
      height: Math.max(1, Math.round(height * scale))
    };
  }

  function encodeWithinBudget(img) {
    let maxDimension = MAX_DIMENSION;

    while (maxDimension >= MIN_DIMENSION) {
      const size = fitSize(img.naturalWidth || img.width, img.naturalHeight || img.height, maxDimension);
      const canvas = document.createElement('canvas');
      canvas.width = size.width;
      canvas.height = size.height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas non disponibile');

      context.drawImage(img, 0, 0, size.width, size.height);
      for (const quality of QUALITY_STEPS) {
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        if (dataUrl && dataUrl.length <= MAX_OUTPUT_CHARS) return dataUrl;
      }

      maxDimension = Math.floor(maxDimension * 0.8);
    }

    throw new Error('Foto troppo complessa da comprimere');
  }

  function robustPhotoUpload(event, hiddenInputId, previewBoxId) {
    const file = event?.target?.files?.[0];
    if (!file) return;

    if (!String(file.type || '').startsWith('image/')) {
      fail('Seleziona un file immagine valido.', event);
      return;
    }

    if (file.size > MAX_SOURCE_BYTES) {
      fail('La foto è troppo grande. Scegline una sotto i 20 MB.', event);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => fail('Non riesco a leggere questa foto. Prova con un’altra immagine.', event);
    reader.onload = loadEvent => {
      const img = new Image();
      img.onerror = () => fail('Formato immagine non leggibile su questo dispositivo.', event);
      img.onload = () => {
        try {
          const dataUrl = encodeWithinBudget(img);
          setPreview(dataUrl, hiddenInputId, previewBoxId);
          if (event?.target) event.target.value = '';
        } catch (error) {
          console.warn('Compressione foto fallita:', error);
          fail('Non riesco a comprimere questa foto. Prova con un’immagine più piccola.', event);
        }
      };
      img.src = loadEvent.target.result;
    };
    reader.readAsDataURL(file);
  }

  globalScope.handlePhotoUpload = robustPhotoUpload;

  globalScope.CescoPhotoUpload = Object.freeze({
    MAX_SOURCE_BYTES,
    MAX_OUTPUT_CHARS,
    MAX_DIMENSION,
    fitSize,
    encodeWithinBudget,
    robustPhotoUpload
  });
})(globalThis);
