import { initStore, getState, setState, resetState } from '../store.js';
import { applyBrandSettings } from '../brand.js';
import { toggleSidebar, initSidebarFromStorage, switchSection as shellSwitchSection } from '../shell.js';
import { setRefreshHandler } from './refresh.js';
import { updateUI } from './ui.js';
import { wireHelpGlobals, setHelpSection, toggleHelpModal } from '../help/guide.js';
import { wireDataHubGlobals, setDataHubCallback, refreshDataHubStatus, openDataHub } from '../data-hub.js';
import { wireOnboardingGlobals, maybeShowOnboarding } from '../onboarding.js';
import { mountTopUtilities } from '../sirh/shell-nav.js';

function switchSection() {
  return shellSwitchSection('overview', {
    onSwitch: () => {
      setHelpSection('overview');
      updateUI();
    },
  });
}

function clearAllData() {
  if (confirm('¿Restablecer preferencias locales? Los módulos SIRH viven en SQLite y no se borran acá.')) {
    setState(resetState());
    updateUI();
    refreshDataHubStatus();
  }
}

function init() {
  initStore();
  setRefreshHandler(() => {
    updateUI();
    refreshDataHubStatus();
  });
  setDataHubCallback(() => {
    updateUI();
    refreshDataHubStatus();
    applyBrandSettings(getState());
  });

  wireHelpGlobals();
  wireDataHubGlobals();
  wireOnboardingGlobals();

  applyBrandSettings(getState());
  initSidebarFromStorage();
  mountTopUtilities({ active: '' });
  switchSection();
  refreshDataHubStatus();
  maybeShowOnboarding();
}

Object.assign(window, {
  toggleSidebar,
  switchSection,
  clearAllData,
  toggleHelpModal,
  openDataHub,
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export { init, switchSection, updateUI };
