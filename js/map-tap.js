(function installMapTap(globalScope) {
  'use strict';
  function create({ onSingleTap, schedule = globalScope.setTimeout, cancel = globalScope.clearTimeout, threshold = 320 }) {
    let pendingTimer = null;
    return Object.freeze({
      handleClick(event) {
        if (pendingTimer !== null) {
          cancel(pendingTimer);
          pendingTimer = null;
          return false;
        }
        pendingTimer = schedule(() => { pendingTimer = null; onSingleTap(event); }, threshold);
        return true;
      },
      cancel() { if (pendingTimer !== null) cancel(pendingTimer); pendingTimer = null; },
      hasPendingTap() { return pendingTimer !== null; }
    });
  }
  globalScope.CescoMapTap = Object.freeze({ create });
})(globalThis);
