import {
  exportData,
  importDataFromFile,
  savePreviousState,
  loadPreviousState,
  diffCounts,
  getCounts,
  getProfile,
  setProfile,
  saveSirhPrevious,
  loadSirhPrevious,
  clearSirhPrevious,
} from './state.js';
import { getState, setState } from './store.js';

let pendingImport = null;
let onAfterChange = () => {};

function api() {
  return window.d6Api || window.ddsDesktop || null;
}

export function setDataHubCallback(fn) {
  onAfterChange = typeof fn === 'function' ? fn : () => {};
}

function fmtDate(iso) {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('es-AR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export async function refreshDataHubStatus() {
  const state = getState();
  if (!state) return;
  const counts = getCounts(state);
  let sirhCount = 0;
  try {
    const bridge = api();
    if (bridge?.sirhList) {
      const rows = await bridge.sirhList();
      sirhCount = rows.length;
    }
  } catch (_) { /* offline */ }

  const meta = state.settings?.lastPackageMeta;
  const el = document.getElementById('data-hub-status');
  if (el) {
    const who = meta?.exportedBy || state.settings?.operatorName || getProfile().name || 'sin firmar';
    const when = state.settings?.lastImportAt || state.settings?.lastExportAt || meta?.exportedAt;
    el.innerHTML = `
      <span class="font-bold">${sirhCount}</span> sirh ·
      <span class="font-bold">${counts.sistemas}</span> sis ·
      <span class="font-bold">${counts.unattended}</span> inc ·
      <span class="opacity-70">${who}</span>
      <span class="opacity-50">· ${fmtDate(when)}</span>
    `;
  }
  const undoBtn = document.getElementById('btn-undo-import');
  if (undoBtn) {
    undoBtn.classList.toggle('hidden', !(loadPreviousState() || loadSirhPrevious()));
  }
}

export function openDataHub() {
  document.getElementById('data-hub-modal')?.classList.remove('hidden');
  refreshDataHubStatus();
  const nameInput = document.getElementById('data-hub-operator');
  if (nameInput) {
    nameInput.value = getState()?.settings?.operatorName || getProfile().name || '';
  }
}

export function closeDataHub() {
  document.getElementById('data-hub-modal')?.classList.add('hidden');
}

export async function handleExportPackage() {
  const name = document.getElementById('data-hub-operator')?.value?.trim()
    || getState()?.settings?.operatorName
    || getProfile().name
    || 'D6';
  setProfile({ ...getProfile(), name });
  const state = getState();
  state.settings.operatorName = name;

  let sirh_modulos = [];
  try {
    const bridge = api();
    if (bridge?.sirhExport) sirh_modulos = await bridge.sirhExport();
    else if (bridge?.sirhList) sirh_modulos = await bridge.sirhList();
  } catch (err) {
    alert('No se pudieron leer los módulos SQLite: ' + (err.message || err));
    return;
  }

  const result = exportData(state, { exportedBy: name, sirh_modulos });
  setState(state);
  refreshDataHubStatus();
  onAfterChange();
  alert(`Resguardo exportado:\n${result.filename}\n\nIncluye ${sirh_modulos.length} módulo(s) SIRH (SQLite) + operación.\nEl trabajo diario sigue en SQLite; el JSON es solo backup/carga.`);
}

export function handleImportFileSelected(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const input = event.target;
  importDataFromFile(file)
    .then(async ({ state: incoming, meta, sirh_modulos }) => {
      let currentSirh = [];
      try {
        const bridge = api();
        if (bridge?.sirhList) currentSirh = await bridge.sirhList();
      } catch (_) { /* noop */ }

      const current = { ...getState(), sirh_modulos: currentSirh };
      const preview = { ...incoming, sirh_modulos: sirh_modulos || [] };
      pendingImport = {
        state: incoming,
        meta,
        sirh_modulos: sirh_modulos || [],
        currentSirh,
        fileName: file.name,
      };
      showImportPreview(current, preview, meta, file.name);
    })
    .catch((err) => {
      alert('No se pudo importar: ' + err.message);
    })
    .finally(() => {
      input.value = '';
    });
}

function showImportPreview(current, incoming, meta, fileName) {
  const rows = diffCounts(current, incoming);
  const body = document.getElementById('import-preview-body');
  const metaEl = document.getElementById('import-preview-meta');
  if (metaEl) {
    metaEl.innerHTML = `
      <p class="text-sm"><strong>Archivo:</strong> ${fileName}</p>
      <p class="text-sm"><strong>Exportado por:</strong> ${meta?.exportedBy || 'desconocido'}</p>
      <p class="text-sm"><strong>Fecha:</strong> ${fmtDate(meta?.exportedAt)}</p>
      <p class="text-xs text-on-surface-variant mt-2">Operación → localStorage · Módulos SIRH → SQLite</p>
      <p class="text-xs text-error mt-1 font-bold uppercase tracking-wide">Reemplazo total — last write wins</p>
    `;
  }
  if (body) {
    body.innerHTML = rows.map((r) => `
      <tr class="border-b border-outline-variant/40">
        <td class="py-2 pr-4 font-bold text-xs">${r.label}</td>
        <td class="py-2 pr-4 font-data text-xs text-right">${r.before}</td>
        <td class="py-2 pr-4 font-data text-xs text-right">${r.after}</td>
        <td class="py-2 font-data text-xs text-right ${r.delta > 0 ? 'text-emerald-700' : r.delta < 0 ? 'text-error' : 'opacity-40'}">
          ${r.delta > 0 ? '+' : ''}${r.delta}
        </td>
      </tr>
    `).join('');
  }
  document.getElementById('import-preview-modal')?.classList.remove('hidden');
}

export function cancelImportPreview() {
  pendingImport = null;
  document.getElementById('import-preview-modal')?.classList.add('hidden');
}

export async function confirmImportPreview() {
  if (!pendingImport) return;
  const current = getState();
  savePreviousState(current);
  saveSirhPrevious(pendingImport.currentSirh || []);

  const next = pendingImport.state;
  next.settings = next.settings || {};
  next.settings.lastImportAt = new Date().toISOString();
  if (pendingImport.meta) next.settings.lastPackageMeta = pendingImport.meta;

  try {
    const bridge = api();
    if (bridge?.sirhImport) {
      const res = await bridge.sirhImport(pendingImport.sirh_modulos || []);
      if (res?.ok === false) throw new Error(res.error || 'Error al importar SIRH en SQLite');
    }
  } catch (err) {
    alert('Falló la carga de módulos en SQLite: ' + (err.message || err));
    return;
  }

  setState(next);
  pendingImport = null;
  document.getElementById('import-preview-modal')?.classList.add('hidden');
  closeDataHub();
  refreshDataHubStatus();
  onAfterChange();
  alert('Resguardo aplicado.\nOperación en localStorage + módulos SIRH en SQLite.\nPodés deshacer una vez desde el Centro de Datos.');
}

export async function undoLastImport() {
  const prev = loadPreviousState();
  const prevSirh = loadSirhPrevious();
  if (!prev && !prevSirh) {
    alert('No hay un estado anterior para restaurar.');
    return;
  }
  if (!confirm('¿Restaurar el estado previo al último import?')) return;

  if (prev) setState(prev);
  localStorage.removeItem('dds_state_prev');

  if (prevSirh) {
    try {
      const bridge = api();
      if (bridge?.sirhImport) {
        const res = await bridge.sirhImport(prevSirh);
        if (res?.ok === false) throw new Error(res.error || 'Error al restaurar SIRH');
      }
    } catch (err) {
      alert('Operación restaurada, pero falló SQLite: ' + (err.message || err));
      clearSirhPrevious();
      refreshDataHubStatus();
      onAfterChange();
      return;
    }
    clearSirhPrevious();
  }

  refreshDataHubStatus();
  onAfterChange();
  alert('Estado previo restaurado.');
}

export function wireDataHubGlobals() {
  Object.assign(window, {
    openDataHub,
    closeDataHub,
    handleExportPackage,
    handleImportFileSelected,
    cancelImportPreview,
    confirmImportPreview,
    undoLastImport,
  });
}
