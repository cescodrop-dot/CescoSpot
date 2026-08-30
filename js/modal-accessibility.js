(function setupModalAccessibility(globalScope) {
  'use strict';

  const MODAL_SELECTOR = '.modal-overlay, .modal, [id$="Modal"], [id$="modal"]';
  const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');
  const CLOSE_SELECTOR = [
    '[data-modal-close]',
    'button[onclick*="close" i]',
    '[class*="close" i]',
    '[aria-label*="chiudi" i]',
    '[title*="chiudi" i]'
  ].join(',');

  const state = new WeakMap();
  let activeModal = null;

  function isTopLevelModal(element) {
    if (!element || !element.matches(MODAL_SELECTOR)) return false;
    const parentModal = element.parentElement && element.parentElement.closest(MODAL_SELECTOR);
    return !parentModal;
  }

  function isVisible(element) {
    if (!element || element.hidden) return false;
    const style = globalScope.getComputedStyle(element);
    // .open is authoritative even during the sheet's CSS transition.
    // aria-hidden is derived output; reading it here would lock a closed sheet.
    if (element.matches('.modal')) return element.classList.contains('open') && style.display !== 'none';
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  }

  function getFocusable(modal) {
    return Array.from(modal.querySelectorAll(FOCUSABLE_SELECTOR)).filter(element => {
      const style = globalScope.getComputedStyle(element);
      return !element.hidden && style.display !== 'none' && style.visibility !== 'hidden';
    });
  }

  function ensureLabel(modal) {
    if (modal.hasAttribute('aria-label') || modal.hasAttribute('aria-labelledby')) return;
    const heading = modal.querySelector('h1, h2, h3, h4, h5, h6, .modal-title, .form-title, .sheet-title');
    if (heading) {
      if (!heading.id) heading.id = `modal-title-${Math.random().toString(36).slice(2, 9)}`;
      modal.setAttribute('aria-labelledby', heading.id);
    } else {
      modal.setAttribute('aria-label', 'Finestra di dialogo');
    }
  }

  function prepareModal(modal) {
    if (!isTopLevelModal(modal) || state.has(modal)) return;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    ensureLabel(modal);
    if (!modal.hasAttribute('tabindex')) modal.setAttribute('tabindex', '-1');
    if (!isVisible(modal)) modal.setAttribute('aria-hidden', 'true');
    if (!state.has(modal)) state.set(modal, { visible: false, opener: null });
  }

  function activateModal(modal) {
    prepareModal(modal);
    const modalState = state.get(modal);
    if (!modalState || modalState.visible) return;

    modalState.visible = true;
    modalState.opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    modal.setAttribute('aria-hidden', 'false');
    activeModal = modal;

    const focusable = getFocusable(modal);
    const target = focusable[0] || modal;
    globalScope.requestAnimationFrame(() => {
      if (isVisible(modal)) target.focus({ preventScroll: true });
    });
  }

  function deactivateModal(modal) {
    const modalState = state.get(modal);
    if (!modalState || !modalState.visible) return;

    modalState.visible = false;
    modal.setAttribute('aria-hidden', 'true');
    if (activeModal === modal) activeModal = null;

    const opener = modalState.opener;
    modalState.opener = null;
    if (opener && opener.isConnected && typeof opener.focus === 'function') {
      globalScope.requestAnimationFrame(() => opener.focus({ preventScroll: true }));
    }
  }

  function syncModal(modal) {
    if (!isTopLevelModal(modal)) return;
    prepareModal(modal);
    if (isVisible(modal)) activateModal(modal);
    else deactivateModal(modal);
  }

  function syncAllModals() {
    document.querySelectorAll(MODAL_SELECTOR).forEach(syncModal);
  }

  function requestClose(modal) {
    const closeControl = modal.querySelector(CLOSE_SELECTOR);
    if (closeControl && typeof closeControl.click === 'function') {
      closeControl.click();
      return true;
    }
    return false;
  }

  function trapFocus(event, modal) {
    const focusable = getFocusable(modal);
    if (!focusable.length) {
      event.preventDefault();
      modal.focus({ preventScroll: true });
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const current = document.activeElement;

    if (event.shiftKey && (current === first || !modal.contains(current))) {
      event.preventDefault();
      last.focus({ preventScroll: true });
    } else if (!event.shiftKey && (current === last || !modal.contains(current))) {
      event.preventDefault();
      first.focus({ preventScroll: true });
    }
  }

  function onKeyDown(event) {
    const modal = activeModal && isVisible(activeModal)
      ? activeModal
      : Array.from(document.querySelectorAll(MODAL_SELECTOR)).filter(isTopLevelModal).reverse().find(isVisible);

    if (!modal) return;

    if (event.key === 'Escape') {
      if (requestClose(modal)) {
        event.preventDefault();
        event.stopPropagation();
      }
      return;
    }

    if (event.key === 'Tab') trapFocus(event, modal);
  }

  function init() {
    syncAllModals();
    document.addEventListener('keydown', onKeyDown, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  globalScope.CescoModalAccessibility = Object.freeze({
    sync: syncAllModals,
    activate: activateModal,
    deactivate: deactivateModal,
    requestClose
  });
})(globalThis);
