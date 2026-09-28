import {
  exportData,
  importDataFromFile,
  savePreviousState,
  loadPreviousState,
  diffCounts,
  getCounts,
  getProfile,
  setProfile,
} from './state.js';
import { getState, setState } from './store.js';

let pendingImport = null;
let onAfterChange = () => {};

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

export function refreshDataHubStatus() {
  const state = getState();
  if (!state) return;
  const counts = getCounts(state);
  const meta = state.settings?.lastPackageMeta;
  const el = document.getElementById('data-hub-status');
  if (el) {
    const who = meta?.exportedBy || state.settings?.operatorName || getProfile().name || 'sin firmar';
    const when = state.settings?.lastImportAt || state.settings?.lastExportAt || meta?.exportedAt;
    el.innerHTML = `
      <span class="font-bold">${counts.sistemas}</span> sis ·
      <span class="font-bold">${counts.unattended}</span> inc ·
      <span class="font-bold">${counts.requests}</span> sol ·
      <span class="opacity-70">${who}</span>
      <span class="opacity-50">· ${fmtDate(when)}</span>
    `;
  }
  const undoBtn = document.getElementById('btn-undo-import');
  if (undoBtn) {
    undoBtn.classList.toggle('hidden', !loadPreviousState());
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

export function handleExportPackage() {
  const name = document.getElementById('data-hub-operator')?.value?.trim()
    || getState()?.settings?.operatorName
    || getProfile().name
    || 'DDS';
  setProfile({ ...getProfile(), name });
  const state = getState();
  state.settings.operatorName = name;
  const result = exportData(state, { exportedBy: name });
  setState(state);
  refreshDataHubStatus();
  onAfterChange();
  alert(`Paquete exportado:\n${result.filename}\n\nEnviá este archivo a las otras máquinas e importalo allí.`);
}

export function handleImportFileSelected(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const input = event.target;
  importDataFromFile(file)
    .then(({ state: incoming, meta }) => {
      pendingImport = { state: incoming, meta, fileName: file.name };
      showImportPreview(getState(), incoming, meta, file.name);
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
      <p class="text-xs text-error mt-2 font-bold uppercase tracking-wide">Reemplazo total — last write wins</p>
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

export function confirmImportPreview() {
  if (!pendingImport) return;
  const current = getState();
  savePreviousState(current);
  const next = pendingImport.state;
  next.settings = next.settings || {};
  next.settings.lastImportAt = new Date().toISOString();
  if (pendingImport.meta) next.settings.lastPackageMeta = pendingImport.meta;
  setState(next);
  pendingImport = null;
  document.getElementById('import-preview-modal')?.classList.add('hidden');
  closeDataHub();
  refreshDataHubStatus();
  onAfterChange();
  alert('Paquete aplicado. Podés deshacer una vez desde el Centro de Datos si fue un error.');
}

export function undoLastImport() {
  const prev = loadPreviousState();
  if (!prev) {
    alert('No hay un estado anterior para restaurar.');
    return;
  }
  if (!confirm('¿Restaurar el estado previo al último import?')) return;
  setState(prev);
  localStorage.removeItem('dds_state_prev');
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
