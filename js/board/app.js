import { initStore, getState, setState, resetState } from '../store.js';
import { applyBrandSettings } from '../brand.js';
import { toggleSidebar, initSidebarFromStorage, switchSection as shellSwitchSection } from '../shell.js';
import { setRefreshHandler } from './refresh.js';
import { updateUI } from './ui.js';
import { wireHelpGlobals, setHelpSection, toggleHelpModal } from '../help/guide.js';
import { wireDataHubGlobals, setDataHubCallback, refreshDataHubStatus, openDataHub } from '../data-hub.js';
import { wireOnboardingGlobals, maybeShowOnboarding } from '../onboarding.js';
import { wireReportsGlobals, renderReportsPanel } from '../reports/center.js';
import { exportToCSV } from './csv.js';
import {
  renderProveedores, openProviderModal, closeProviderModal,
  addProviderTag, removeProviderTag, saveProviderLinks,
  prepareEditProviderTask, cancelEditProviderTask,
  toggleProviderTaskDone, deleteProviderTask,
  initProviderTaskForm,
  toggleProveedoresView, toggleProveedoresSort,
} from './proveedores.js';
import {
  openSystemEditModal, closeSystemEditModal, handleSystemClick,
  addModalTeamMember, removeModalTeamMember, addTeamMember, removeTeamMember,
  initSistemasForms, toggleSistemasView, toggleSistemasSort,
} from './sistemas.js';
import {
  initIncidenciasListeners, toggleHubView, togglePipelineView,
  toggleIncidentsSort, togglePipelineSort,
  closeRequest, editClosedRequest, deleteClosedRequest, closeIncident,
} from './incidencias.js';
import {
  prepareEdit, cancelEdit, deleteEntry, initForms,
} from './forms.js';

function switchSection(sectionId) {
  const resolved = shellSwitchSection(sectionId, {
    onSwitch: (id) => {
      setHelpSection(id === 'reports' ? 'reports' : id);
      if (id === 'reports') renderReportsPanel();
      updateUI();
    },
  });
  return resolved;
}

function clearAllData() {
  if (confirm('¿Restablecer el tablero a los datos de ejemplo? Esta acción no se puede deshacer con el paquete actual.')) {
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
  wireReportsGlobals();

  applyBrandSettings(getState());
  initSidebarFromStorage();
  initForms();
  initSistemasForms();
  initProviderTaskForm();
  initIncidenciasListeners();
  document.getElementById('proveedores-search')?.addEventListener('input', renderProveedores);

  const hash = (location.hash || '').replace('#', '');
  if (hash === 'reports' || sessionStorage.getItem('dds_goto') === 'reports') {
    sessionStorage.removeItem('dds_goto');
    switchSection('reports');
  } else {
    switchSection('overview');
  }
  refreshDataHubStatus();
  maybeShowOnboarding();
}

const windowExports = {
  toggleSidebar,
  switchSection,
  clearAllData,
  toggleHelpModal,
  exportToCSV,
  openDataHub,
  prepareEdit,
  cancelEdit,
  deleteEntry,
  toggleHubView,
  togglePipelineView,
  toggleIncidentsSort,
  togglePipelineSort,
  toggleSistemasView,
  toggleSistemasSort,
  toggleProveedoresView,
  toggleProveedoresSort,
  openProviderModal,
  closeProviderModal,
  addProviderTag,
  removeProviderTag,
  saveProviderLinks,
  prepareEditProviderTask,
  cancelEditProviderTask,
  toggleProviderTaskDone,
  deleteProviderTask,
  openSystemEditModal,
  closeSystemEditModal,
  handleSystemClick,
  addModalTeamMember,
  removeModalTeamMember,
  addTeamMember,
  removeTeamMember,
  closeIncident,
  closeRequest,
  editClosedRequest,
  deleteClosedRequest,
};

Object.assign(window, windowExports);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export { init, switchSection, updateUI };
