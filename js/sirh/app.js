import { initStore, getState } from '../store.js';
import { applyBrandSettings } from '../brand.js';
import { toggleSidebar, initSidebarFromStorage } from '../shell.js';
import { wireHelpGlobals, setHelpSection } from '../help/guide.js';

let rows = [];
let catalogos = { estados: [], prioridades: [], riesgos: [] };
let chartEstado = null;
let chartAvance = null;

function desktop() {
  return window.d6Api || window.ddsDesktop || null;
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function estadoClass(estado) {
  const e = String(estado || '').toLowerCase();
  if (e.includes('operativo') || e.includes('prueba')) return 'ok';
  if (e.includes('desarrollo') || e.includes('alcance')) return 'info';
  if (e.includes('pausado')) return 'warn';
  if (e.includes('cancel')) return 'danger';
  return 'muted';
}

function showToast(message, kind = 'ok') {
  const el = document.getElementById('sirh-toast');
  if (!el) return;
  el.className = `rounded-xl px-4 py-3 text-sm shadow-lg border ${
    kind === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
  }`;
  el.textContent = message;
  el.classList.remove('hidden');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.add('hidden'), 4500);
}

function fillSelect(el, options, withEmptyLabel) {
  if (!el) return;
  const cur = el.value;
  let html = withEmptyLabel != null ? `<option value="">${esc(withEmptyLabel)}</option>` : '';
  options.forEach((o) => {
    html += `<option value="${esc(o)}">${esc(o)}</option>`;
  });
  el.innerHTML = html;
  if (cur) el.value = cur;
}

function filteredRows() {
  const q = String(document.getElementById('filter-q')?.value || '').toLowerCase().trim();
  const estado = document.getElementById('filter-estado')?.value || '';
  const prioridad = document.getElementById('filter-prioridad')?.value || '';
  return rows.filter((r) => {
    if (estado && r.estado !== estado) return false;
    if (prioridad && r.prioridad !== prioridad) return false;
    if (!q) return true;
    const blob = [r.modulo, r.fase, r.responsable, r.proveedor, r.bloqueo, r.hito].join(' ').toLowerCase();
    return blob.includes(q);
  });
}

function formatDates(r) {
  const a = r.fecha_inicio || '—';
  const b = r.fecha_fin_prevista || '—';
  const c = r.fecha_fin_real ? ` / real ${r.fecha_fin_real}` : '';
  return `<span class="font-data text-xs">${esc(a)} → ${esc(b)}${esc(c)}</span>`;
}

export function renderSirhTable() {
  const tbody = document.getElementById('sirh-tbody');
  const count = document.getElementById('sirh-count');
  if (!tbody) return;
  const list = filteredRows();
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-8 text-center text-on-surface-variant italic">Sin módulos para los filtros</td></tr>';
  } else {
    tbody.innerHTML = list.map((r) => `
      <tr class="border-t border-outline-variant/50 hover:bg-surface-container-low/60">
        <td class="px-4 py-3">
          <div class="font-semibold">${esc(r.modulo)}</div>
          <div class="text-[11px] text-on-surface-variant">${esc(r.fase || '—')} · ${esc(r.hito || 'sin hito')}</div>
        </td>
        <td class="px-3 py-3"><span class="sirh-badge ${estadoClass(r.estado)}">${esc(r.estado)}</span></td>
        <td class="px-3 py-3 font-data font-bold">${Number(r.avance) || 0}%</td>
        <td class="px-3 py-3">${formatDates(r)}</td>
        <td class="px-3 py-3 text-xs">${esc(r.responsable || '—')}</td>
        <td class="px-3 py-3 text-xs">${esc(r.proveedor || '—')}</td>
        <td class="px-4 py-3 text-right whitespace-nowrap">
          <button type="button" class="p-1.5 rounded-lg hover:bg-surface-container" title="Editar" onclick="openSirhForm(${r.id})">
            <span class="material-symbols-outlined text-sm">edit</span>
          </button>
          <button type="button" class="p-1.5 rounded-lg hover:bg-error/10 text-error" title="Eliminar" onclick="deleteSirhRow(${r.id})">
            <span class="material-symbols-outlined text-sm">delete</span>
          </button>
        </td>
      </tr>
    `).join('');
  }
  if (count) count.textContent = `${list.length} módulo(s) · ${rows.length} en total`;
  renderSirhCharts();
}

function renderSirhCharts() {
  if (typeof Chart === 'undefined') return;
  const byEstado = {};
  rows.forEach((r) => {
    const k = r.estado || 'Sin estado';
    byEstado[k] = (byEstado[k] || 0) + 1;
  });
  const estadoLabels = Object.keys(byEstado);
  const palette = ['#004ac6', '#1a2744', '#006c4a', '#b45309', '#ba1a1a', '#5c5f66', '#008cc7'];

  const estadoCanvas = document.getElementById('sirh-chart-estado');
  const avanceCanvas = document.getElementById('sirh-chart-avance');
  if (estadoCanvas) {
    if (chartEstado) chartEstado.destroy();
    chartEstado = new Chart(estadoCanvas, {
      type: 'doughnut',
      data: {
        labels: estadoLabels,
        datasets: [{ data: estadoLabels.map((k) => byEstado[k]), backgroundColor: estadoLabels.map((_, i) => palette[i % palette.length]), borderWidth: 0 }],
      },
      options: { plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } }, cutout: '55%' },
    });
  }
  if (avanceCanvas) {
    if (chartAvance) chartAvance.destroy();
    const top = [...rows].sort((a, b) => (Number(b.avance) || 0) - (Number(a.avance) || 0)).slice(0, 8);
    chartAvance = new Chart(avanceCanvas, {
      type: 'bar',
      data: {
        labels: top.map((r) => r.modulo),
        datasets: [{ label: 'Avance %', data: top.map((r) => Number(r.avance) || 0), backgroundColor: '#004ac6', borderRadius: 4 }],
      },
      options: {
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: { x: { min: 0, max: 100 }, y: { ticks: { font: { size: 10 } } } },
      },
    });
  }
}

async function reloadRows() {
  const api = desktop();
  if (!api?.sirhList) {
    showToast('Iniciá D6 con npm start (servidor local) para usar SQLite SIRH.', 'error');
    rows = [];
    renderSirhTable();
    return;
  }
  rows = await api.sirhList();
  renderSirhTable();
}

function openSirhForm(id) {
  const modal = document.getElementById('sirh-modal');
  const title = document.getElementById('sirh-modal-title');
  const row = id != null ? rows.find((r) => Number(r.id) === Number(id)) : null;
  document.getElementById('f-id').value = row?.id || '';
  document.getElementById('f-modulo').value = row?.modulo || '';
  document.getElementById('f-fase').value = row?.fase || '';
  document.getElementById('f-estado').value = row?.estado || catalogos.estados[0] || 'Planificado';
  document.getElementById('f-prioridad').value = row?.prioridad || 'Media';
  document.getElementById('f-riesgo').value = row?.riesgo || 'Medio';
  document.getElementById('f-avance').value = row?.avance ?? 0;
  document.getElementById('f-fecha-inicio').value = row?.fecha_inicio || '';
  document.getElementById('f-fecha-fin-prevista').value = row?.fecha_fin_prevista || '';
  document.getElementById('f-fecha-fin-real').value = row?.fecha_fin_real || '';
  document.getElementById('f-responsable').value = row?.responsable || '';
  document.getElementById('f-proveedor').value = row?.proveedor || '';
  document.getElementById('f-hito').value = row?.hito || '';
  document.getElementById('f-bloqueo').value = row?.bloqueo || '';
  if (title) title.textContent = row ? `Editar: ${row.modulo}` : 'Nuevo módulo';
  modal?.classList.remove('hidden');
}

function closeSirhForm() {
  document.getElementById('sirh-modal')?.classList.add('hidden');
}

async function saveSirhForm(event) {
  event.preventDefault();
  const api = desktop();
  if (!api?.sirhUpsert) {
    showToast('SQLite disponible vía servidor D6 (npm start).', 'error');
    return;
  }
  const payload = {
    id: document.getElementById('f-id').value || null,
    modulo: document.getElementById('f-modulo').value,
    fase: document.getElementById('f-fase').value,
    estado: document.getElementById('f-estado').value,
    prioridad: document.getElementById('f-prioridad').value,
    riesgo: document.getElementById('f-riesgo').value,
    avance: document.getElementById('f-avance').value,
    fecha_inicio: document.getElementById('f-fecha-inicio').value,
    fecha_fin_prevista: document.getElementById('f-fecha-fin-prevista').value,
    fecha_fin_real: document.getElementById('f-fecha-fin-real').value,
    responsable: document.getElementById('f-responsable').value,
    proveedor: document.getElementById('f-proveedor').value,
    hito: document.getElementById('f-hito').value,
    bloqueo: document.getElementById('f-bloqueo').value,
  };
  const res = await api.sirhUpsert(payload);
  if (!res?.ok) {
    showToast(res?.error || 'No se pudo guardar', 'error');
    return;
  }
  closeSirhForm();
  await reloadRows();
  showToast('Módulo guardado. Revisá Hoy o Gerencia.');
}

async function deleteSirhRow(id) {
  if (!confirm('¿Eliminar este módulo?')) return;
  const api = desktop();
  if (!api?.sirhDelete) return;
  const res = await api.sirhDelete(id);
  if (res?.error) {
    showToast(res.error, 'error');
    return;
  }
  await reloadRows();
  showToast('Módulo eliminado.');
}

async function init() {
  initStore();
  initSidebarFromStorage();
  wireHelpGlobals();
  setHelpSection('sirh');
  applyBrandSettings(getState());

  Object.assign(window, {
    toggleSidebar,
    renderSirhTable,
    openSirhForm,
    closeSirhForm,
    saveSirhForm,
    deleteSirhRow,
  });

  const api = desktop();
  if (api?.sirhCatalogos) {
    catalogos = await api.sirhCatalogos();
  } else {
    catalogos = {
      estados: ['Planificado', 'Alcance', 'En desarrollo', 'En pruebas', 'Operativo', 'Pausado', 'Cancelado'],
      prioridades: ['Alta', 'Media', 'Baja'],
      riesgos: ['Alto', 'Medio', 'Bajo'],
    };
  }

  fillSelect(document.getElementById('filter-estado'), catalogos.estados, 'Todos los estados');
  fillSelect(document.getElementById('filter-prioridad'), catalogos.prioridades, 'Todas las prioridades');
  fillSelect(document.getElementById('f-estado'), catalogos.estados);
  fillSelect(document.getElementById('f-prioridad'), catalogos.prioridades);
  fillSelect(document.getElementById('f-riesgo'), catalogos.riesgos);

  if (api?.sirhDbPath) {
    const p = await api.sirhDbPath();
    const el = document.getElementById('sirh-db-path');
    if (el) el.textContent = p ? `SQLite: ${p}` : 'SQLite: (sin ruta)';
  }

  await reloadRows();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
