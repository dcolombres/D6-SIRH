import { initStore, getState } from '../store.js';
import { applyBrandSettings } from '../brand.js';
import { toggleSidebar, initSidebarFromStorage } from '../shell.js';
import { wireHelpGlobals, setHelpSection } from '../help/guide.js';
import { mountSidebarNav, mountTopUtilities } from './shell-nav.js';
import { AREA_OPTIONS, areaLabel } from './areas.js';
import {
  apiBridge,
  computeKpis,
  filterRows,
  uniqueValues,
  renderKpiCards,
  renderModuleCards,
  renderDetailTable,
  renderEstadoChart,
  renderAvanceChart,
  esc,
} from './board-view.js';

let rows = [];
let filters = { q: '', estado: '', prioridad: '', area: '', riesgo: '' };
let chartEstado = null;
let chartAvance = null;

function fillSelect(el, options, emptyLabel) {
  if (!el) return;
  const cur = el.value;
  el.innerHTML = `<option value="">${esc(emptyLabel)}</option>${
    options.map((o) => {
      const value = typeof o === 'object' ? o.id : o;
      const label = typeof o === 'object' ? o.label : o;
      return `<option value="${esc(value)}">${esc(label)}</option>`;
    }).join('')
  }`;
  if (cur) el.value = cur;
}

function renderAll() {
  const list = filterRows(rows, filters);
  const kpis = computeKpis(list);
  renderKpiCards(document.getElementById('gerencia-kpis'), kpis);
  renderModuleCards(document.getElementById('gerencia-cards'), list);
  renderDetailTable(
    document.getElementById('gerencia-table'),
    document.getElementById('gerencia-table-meta'),
    list,
  );
  chartEstado = renderEstadoChart(document.getElementById('gerencia-chart-estado'), kpis.byEstado, chartEstado);
  chartAvance = renderAvanceChart(document.getElementById('gerencia-chart-avance'), list, chartAvance);
  const count = document.getElementById('gerencia-count');
  if (count) {
    const activos = rows.filter((r) => Number(r.activo) !== 0).length;
    count.textContent = `${list.length} en vista · ${activos} activos · ${rows.length} en catálogo`;
  }
}

function resetFilters() {
  filters = { q: '', estado: '', prioridad: '', area: '', riesgo: '' };
  const q = document.getElementById('g-q');
  if (q) q.value = '';
  ['g-estado', 'g-prioridad', 'g-area', 'g-riesgo'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  renderAll();
}

async function load() {
  const api = apiBridge();
  if (!api?.sirhList) {
    document.getElementById('gerencia-kpis').innerHTML = '<p class="col-span-full text-sm text-error">Iniciá D6 con npm start para cargar módulos.</p>';
    return;
  }
  rows = await api.sirhList();
  fillSelect(document.getElementById('g-estado'), uniqueValues(rows, 'estado'), 'Todos los estados');
  fillSelect(document.getElementById('g-prioridad'), uniqueValues(rows, 'prioridad'), 'Todas las prioridades');
  fillSelect(document.getElementById('g-area'), AREA_OPTIONS, 'Todas las áreas');
  fillSelect(document.getElementById('g-riesgo'), uniqueValues(rows, 'riesgo'), 'Todos los riesgos');
  renderAll();
}

function wireFilters() {
  document.getElementById('g-q')?.addEventListener('input', (e) => {
    filters.q = e.target.value || '';
    renderAll();
  });
  document.getElementById('g-estado')?.addEventListener('change', (e) => {
    filters.estado = e.target.value || '';
    renderAll();
  });
  document.getElementById('g-prioridad')?.addEventListener('change', (e) => {
    filters.prioridad = e.target.value || '';
    renderAll();
  });
  document.getElementById('g-area')?.addEventListener('change', (e) => {
    filters.area = e.target.value || '';
    renderAll();
  });
  document.getElementById('g-riesgo')?.addEventListener('change', (e) => {
    filters.riesgo = e.target.value || '';
    renderAll();
  });
  document.getElementById('g-reset')?.addEventListener('click', resetFilters);
}

async function init() {
  initStore();
  initSidebarFromStorage();
  wireHelpGlobals();
  setHelpSection('gerencia');
  applyBrandSettings(getState());
  mountSidebarNav({ active: 'gerencia' });
  mountTopUtilities({ active: '' });
  Object.assign(window, { toggleSidebar, resetFilters, areaLabel });
  wireFilters();
  await load();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
