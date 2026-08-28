(function installZoomGuard(globalScope) {
  'use strict';

  function isInsideMap(target) {
    return target instanceof Element && Boolean(target.closest('#map'));
  }

  function blockGestureOutsideMap(event) {
    if (!isInsideMap(event.target)) {
      event.preventDefault();
    }
  }

  document.addEventListener('gesturestart', blockGestureOutsideMap, { passive: false });
  document.addEventListener('gesturechange', blockGestureOutsideMap, { passive: false });

  document.addEventListener('touchmove', event => {
    if (event.touches && event.touches.length > 1 && !isInsideMap(event.target)) {
      event.preventDefault();
    }
  }, { passive: false });

  globalScope.CescoZoomGuard = Object.freeze({ isInsideMap });
})(globalThis);
