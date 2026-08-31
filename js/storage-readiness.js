(function exposeStorageReadiness(globalScope) {
  'use strict';

  let ready = false;
  const LOADING_MESSAGE = 'Archivio in caricamento, attendi un istante.';

  function beginInitialization() {
    ready = false;
  }

  function finishInitialization() {
    ready = true;
  }

  function isReady() {
    return ready;
  }

  function ensureWriteReady() {
    if (ready) return true;
    globalScope.alert(LOADING_MESSAGE);
    return false;
  }

  Object.assign(globalScope, {
    CescoStorageReadiness: {
      beginInitialization,
      finishInitialization,
      isReady,
      ensureWriteReady,
      loadingMessage: LOADING_MESSAGE,
    },
  });
})(globalThis);
