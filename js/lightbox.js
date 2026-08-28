(function installLightbox(globalScope) {
  'use strict';

  function openLightbox(src) {
    const overlay = document.getElementById('lightboxOverlay');
    const img = document.getElementById('lightboxImg');
    img.src = src;
    overlay.style.display = 'flex';
    void overlay.offsetWidth;
    overlay.classList.add('show');
  }

  function closeLightbox() {
    const overlay = document.getElementById('lightboxOverlay');
    overlay.classList.remove('show');
    setTimeout(() => {
      overlay.style.display = 'none';
      document.getElementById('lightboxImg').src = '';
    }, 300);
  }

  globalScope.openLightbox = openLightbox;
  globalScope.closeLightbox = closeLightbox;
})(globalThis);
