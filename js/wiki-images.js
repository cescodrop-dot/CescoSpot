(function installWikiImages() {
  'use strict';

  const replacements = new Map([
    ['uni_paletta.jpg', 'wiki/uni_paletta.svg'],
    ['texas_rig.jpg', 'wiki/texas_rig.svg'],
  ]);

  function filenameFrom(src) {
    try {
      return new URL(src, document.baseURI).pathname.split('/').pop() || '';
    } catch {
      return src.split('/').pop() || '';
    }
  }

  function showFallback(img) {
    const box = img.closest('.wiki-img-container') || img.parentElement;
    if (!box || box.querySelector('.wiki-image-fallback')) return;

    const fallback = document.createElement('div');
    fallback.className = 'wiki-image-fallback';
    fallback.setAttribute('role', 'status');
    fallback.textContent = 'Schema non disponibile';
    img.hidden = true;
    box.appendChild(fallback);
  }

  function prepareImage(img) {
    const file = filenameFrom(img.getAttribute('src') || '');
    const replacement = replacements.get(file);
    if (replacement && img.getAttribute('src') !== replacement) {
      img.setAttribute('src', replacement);
    }

    img.addEventListener('error', () => showFallback(img), { once: true });
    img.setAttribute('loading', 'lazy');
    img.setAttribute('decoding', 'async');
  }

  function init() {
    document.querySelectorAll('#tabWiki .wiki-img-container img').forEach(prepareImage);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
