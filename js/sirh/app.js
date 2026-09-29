import { initStore, getState } from '../store.js';
import { applyBrandSettings } from '../brand.js';
import { toggleSidebar, initSidebarFromStorage } from '../shell.js';
import { wireHelpGlobals, setHelpSection } from '../help/guide.js';
import { mountSidebarNav, mountTopUtilities } from './shell-nav.js';
import { AREA_OPTIONS, areaLabel } from './areas.js';
import {
  aggregateTeam,
  aggregateProviders,
  uniquePeopleNames,
  uniqueProviderNames,
} from './people.js';

let rows = [];
let catalogos = { estados: [], prioridades: [], riesgos: [], areas: [] };
let chartEstado = null;
let chartAvance = null;
let currentView = 'modulos';

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
    const value = typeof o === 'object' ? o.id : o;
    const label = typeof o === 'object' ? o.label : o;
    html += `<option value="${esc(value)}">${esc(label)}</option>`;
  });
  el.innerHTML = html;
  if (cur) el.value = cur;
}

function filteredRows() {
  const q = String(document.getElementById('filter-q')?.value || '').toLowerCase().trim();
  const estado = document.getElementById('filter-estado')?.value || '';
  const prioridad = document.getElementById('filter-prioridad')?.value || '';
  const area = document.getElementById('filter-area')?.value || '';
  const activo = document.getElementById('filter-activo')?.value || '';
  return rows.filter((r) => {
    if (estado && r.estado !== estado) return false;
    if (prioridad && r.prioridad !== prioridad) return false;
    if (area && r.area !== area) return false;
    if (activo === '1' && Number(r.activo) === 0) return false;
    if (activo === '0' && Number(r.activo) !== 0) return false;
    if (!q) return true;
    const blob = [r.modulo, r.fase, r.descripcion, r.responsable, r.proveedor, r.equipo, r.bloqueo, r.hito, r.area]
      .join(' ')
      .toLowerCase();
    return blob.includes(q);
  });
}

function parseEquipo(raw) {
  return String(raw || '')
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function formatEquipoCell(raw) {
  const people = parseEquipo(raw);
  if (!people.length) return '<span class="text-on-surface-variant">—</span>';
  if (people.length <= 2) return `<span class="text-xs">${esc(people.join(', '))}</span>`;
  return `<span class="text-xs" title="${esc(people.join(', '))}">${esc(people.slice(0, 2).join(', '))} +${people.length - 2}</span>`;
}

export function renderSirhTable() {
  const tbody = document.getElementById('sirh-tbody');
  const count = document.getElementById('sirh-count');
  if (!tbody) return;
  const list = filteredRows();
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="px-4 py-8 text-center text-on-surface-variant italic">Sin módulos para los filtros</td></tr>';
  } else {
    tbody.innerHTML = list.map((r) => {
      const inactive = Number(r.activo) === 0;
      return `
      <tr class="border-t border-outline-variant/50 hover:bg-surface-container-low/60 ${inactive ? 'opacity-50' : ''}">
        <td class="px-4 py-3">
          <div class="flex items-start gap-2">
            <span class="material-symbols-outlined text-primary text-lg mt-0.5">${esc(r.icono || 'view_module')}</span>
            <div>
              <div class="font-semibold">${esc(r.modulo)}</div>
              <div class="text-[11px] text-on-surface-variant">${esc(r.descripcion || r.fase || '—')}</div>
            </div>
          </div>
        </td>
        <td class="px-3 py-3"><span class="sirh-badge muted">${esc(areaLabel(r.area))}</span></td>
        <td class="px-3 py-3"><span class="sirh-badge ${estadoClass(r.estado)}">${esc(r.estado)}</span></td>
        <td class="px-3 py-3 font-data font-bold">${Number(r.avance) || 0}%</td>
        <td class="px-3 py-3 text-xs">${esc(r.responsable || '—')}</td>
        <td class="px-3 py-3 text-xs">${esc(r.proveedor || '—')}</td>
        <td class="px-3 py-3">${formatEquipoCell(r.equipo)}</td>
        <td class="px-3 py-3 text-xs">${inactive ? 'Inactivo' : 'Activo'}</td>
        <td class="px-4 py-3 text-right whitespace-nowrap">
          <button type="button" class="p-1.5 rounded-lg hover:bg-surface-container" title="${inactive ? 'Activar' : 'Desactivar'}" onclick="toggleSirhActivo(${r.id})">
            <span class="material-symbols-outlined text-sm">${inactive ? 'visibility' : 'visibility_off'}</span>
          </button>
          <button type="button" class="p-1.5 rounded-lg hover:bg-surface-container" title="Editar" onclick="openSirhForm(${r.id})">
            <span class="material-symbols-outlined text-sm">edit</span>
          </button>
          <button type="button" class="p-1.5 rounded-lg hover:bg-error/10 text-error" title="Eliminar" onclick="deleteSirhRow(${r.id})">
            <span class="material-symbols-outlined text-sm">delete</span>
          </button>
        </td>
      </tr>`;
    }).join('');
  }
  if (count) {
    const activos = rows.filter((r) => Number(r.activo) !== 0).length;
    count.textContent = `${list.length} visibles · ${activos} activos · ${rows.length} en total`;
  }
  renderSirhCharts();
}

function renderSirhCharts() {
  if (typeof Chart === 'undefined') return;
  const activeRows = rows.filter((r) => Number(r.activo) !== 0);
  const byEstado = {};
  activeRows.forEach((r) => {
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
    const top = [...activeRows].sort((a, b) => (Number(b.avance) || 0) - (Number(a.avance) || 0)).slice(0, 8);
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

function refreshDatalists() {
  const people = uniquePeopleNames(rows);
  const providers = uniqueProviderNames(rows);
  const dlPeople = document.getElementById('datalist-people');
  const dlProv = document.getElementById('datalist-providers');
  if (dlPeople) dlPeople.innerHTML = people.map((n) => `<option value="${esc(n)}"></option>`).join('');
  if (dlProv) dlProv.innerHTML = providers.map((n) => `<option value="${esc(n)}"></option>`).join('');
}

function fillModuleSelects() {
  const opts = ['<option value="">Elegí un módulo…</option>']
    .concat(
      [...rows]
        .sort((a, b) => String(a.modulo).localeCompare(String(b.modulo), 'es'))
        .map((r) => {
          const inactive = Number(r.activo) === 0 ? ' (inactivo)' : '';
          return `<option value="${esc(r.id)}">${esc(r.modulo)}${inactive}</option>`;
        }),
    )
    .join('');
  ['add-equipo-modulo', 'add-proveedor-modulo'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const cur = el.value;
    el.innerHTML = opts;
    if (cur) el.value = cur;
  });
}

function renderPeopleViews() {
  fillModuleSelects();
  const teamHost = document.getElementById('sirh-equipo-list');
  const provHost = document.getElementById('sirh-proveedores-list');
  if (teamHost) {
    const team = aggregateTeam(rows);
    if (!team.length) {
      teamHost.innerHTML = '<p class="text-sm text-on-surface-variant italic">Nadie asignado aún. Usá el formulario de arriba o editá un módulo.</p>';
    } else {
      teamHost.innerHTML = team.map((p) => `
        <div class="border border-outline-variant rounded-xl p-4 flex flex-wrap gap-3 justify-between items-start">
          <div>
            <p class="font-bold">${esc(p.name)}</p>
            <p class="text-[11px] text-on-surface-variant mt-0.5">${esc(p.roles.join(' · '))}</p>
            <div class="flex flex-wrap gap-1.5 mt-2">
              ${p.modules.map((m) => `
                <button type="button" onclick="openSirhForm(${m.id})"
                  class="text-[11px] px-2 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high">
                  ${esc(m.modulo)}
                </button>
              `).join('')}
            </div>
          </div>
          <span class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">${p.moduleCount} módulo(s)</span>
        </div>
      `).join('');
    }
  }
  if (provHost) {
    const providers = aggregateProviders(rows);
    if (!providers.length) {
      provHost.innerHTML = '<p class="text-sm text-on-surface-variant italic">Sin proveedores. Asigná uno con el formulario de arriba.</p>';
    } else {
      provHost.innerHTML = providers.map((p) => `
        <div class="border border-outline-variant rounded-xl p-4 flex flex-wrap gap-3 justify-between items-start">
          <div>
            <p class="font-bold">${esc(p.name)}</p>
            <div class="flex flex-wrap gap-1.5 mt-2">
              ${p.modules.map((m) => `
                <button type="button" onclick="openSirhForm(${m.id})"
                  class="text-[11px] px-2 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high">
                  ${esc(m.modulo)}
                </button>
              `).join('')}
            </div>
          </div>
          <span class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">${p.moduleCount} módulo(s)</span>
        </div>
      `).join('');
    }
  }
}

async function addPersonToModule(event) {
  event.preventDefault();
  const api = desktop();
  if (!api?.sirhUpsert) {
    showToast('SQLite disponible vía servidor D6 (npm start).', 'error');
    return;
  }
  const modId = Number(document.getElementById('add-equipo-modulo')?.value);
  const name = String(document.getElementById('add-equipo-nombre')?.value || '').trim();
  const rol = document.getElementById('add-equipo-rol')?.value || 'equipo';
  const row = rows.find((r) => Number(r.id) === modId);
  if (!row || !name) {
    showToast('Elegí un módulo y una persona.', 'error');
    return;
  }

  let payload = { ...row };
  if (rol === 'responsable') {
    payload.responsable = name;
  } else {
    const people = parseEquipo(row.equipo);
    if (people.some((p) => p.toLowerCase() === name.toLowerCase())) {
      showToast(`${name} ya está en el equipo de ${row.modulo}.`, 'error');
      return;
    }
    payload.equipo = [...people, name].join('\n');
  }

  const res = await api.sirhUpsert(payload);
  if (!res?.ok) {
    showToast(res?.error || 'No se pudo guardar', 'error');
    return;
  }
  document.getElementById('add-equipo-nombre').value = '';
  await reloadRows();
  showToast(rol === 'responsable'
    ? `Responsable de ${row.modulo}: ${name}.`
    : `${name} agregado al equipo de ${row.modulo}.`);
}

async function addProviderToModule(event) {
  event.preventDefault();
  const api = desktop();
  if (!api?.sirhUpsert) {
    showToast('SQLite disponible vía servidor D6 (npm start).', 'error');
    return;
  }
  const modId = Number(document.getElementById('add-proveedor-modulo')?.value);
  const name = String(document.getElementById('add-proveedor-nombre')?.value || '').trim();
  const row = rows.find((r) => Number(r.id) === modId);
  if (!row || !name) {
    showToast('Elegí un módulo y un proveedor.', 'error');
    return;
  }

  const res = await api.sirhUpsert({ ...row, proveedor: name });
  if (!res?.ok) {
    showToast(res?.error || 'No se pudo guardar', 'error');
    return;
  }
  document.getElementById('add-proveedor-nombre').value = '';
  await reloadRows();
  showToast(`Proveedor de ${row.modulo}: ${name}.`);
}

async function reloadRows() {
  const api = desktop();
  if (!api?.sirhList) {
    showToast('Iniciá D6 con npm start (servidor local) para usar SQLite SIRH.', 'error');
    rows = [];
    renderSirhTable();
    renderPeopleViews();
    return;
  }
  rows = await api.sirhList();
  renderSirhTable();
  renderPeopleViews();
  refreshDatalists();
}

function openSirhForm(id) {
  const modal = document.getElementById('sirh-modal');
  const title = document.getElementById('sirh-modal-title');
  const row = id != null ? rows.find((r) => Number(r.id) === Number(id)) : null;
  document.getElementById('f-id').value = row?.id || '';
  document.getElementById('f-modulo').value = row?.modulo || '';
  document.getElementById('f-descripcion').value = row?.descripcion || '';
  document.getElementById('f-area').value = row?.area || 'gestion';
  document.getElementById('f-fase').value = row?.fase || '';
  document.getElementById('f-orden').value = row?.orden ?? 0;
  document.getElementById('f-icono').value = row?.icono || 'view_module';
  document.getElementById('f-activo').checked = row ? Number(row.activo) !== 0 : true;
  document.getElementById('f-estado').value = row?.estado || catalogos.estados[0] || 'Planificado';
  document.getElementById('f-prioridad').value = row?.prioridad || 'Media';
  document.getElementById('f-riesgo').value = row?.riesgo || 'Medio';
  document.getElementById('f-avance').value = row?.avance ?? 0;
  document.getElementById('f-fecha-inicio').value = row?.fecha_inicio || '';
  document.getElementById('f-fecha-fin-prevista').value = row?.fecha_fin_prevista || '';
  document.getElementById('f-fecha-fin-real').value = row?.fecha_fin_real || '';
  document.getElementById('f-responsable').value = row?.responsable || '';
  document.getElementById('f-proveedor').value = row?.proveedor || '';
  document.getElementById('f-equipo').value = row?.equipo || '';
  document.getElementById('f-hito').value = row?.hito || '';
  document.getElementById('f-bloqueo').value = row?.bloqueo || '';
  if (title) title.textContent = row ? `Editar: ${row.modulo}` : 'Nuevo módulo';
  modal?.classList.remove('hidden');
}

function closeSirhForm() {
  document.getElementById('sirh-modal')?.classList.add('hidden');
}

function formPayload() {
  return {
    id: document.getElementById('f-id').value || null,
    modulo: document.getElementById('f-modulo').value,
    descripcion: document.getElementById('f-descripcion').value,
    area: document.getElementById('f-area').value,
    fase: document.getElementById('f-fase').value,
    orden: document.getElementById('f-orden').value,
    icono: document.getElementById('f-icono').value,
    activo: document.getElementById('f-activo').checked ? 1 : 0,
    estado: document.getElementById('f-estado').value,
    prioridad: document.getElementById('f-prioridad').value,
    riesgo: document.getElementById('f-riesgo').value,
    avance: document.getElementById('f-avance').value,
    fecha_inicio: document.getElementById('f-fecha-inicio').value,
    fecha_fin_prevista: document.getElementById('f-fecha-fin-prevista').value,
    fecha_fin_real: document.getElementById('f-fecha-fin-real').value,
    responsable: document.getElementById('f-responsable').value,
    proveedor: document.getElementById('f-proveedor').value,
    equipo: document.getElementById('f-equipo').value,
    hito: document.getElementById('f-hito').value,
    bloqueo: document.getElementById('f-bloqueo').value,
  };
}

async function saveSirhForm(event) {
  event.preventDefault();
  const api = desktop();
  if (!api?.sirhUpsert) {
    showToast('SQLite disponible vía servidor D6 (npm start).', 'error');
    return;
  }
  const res = await api.sirhUpsert(formPayload());
  if (!res?.ok) {
    showToast(res?.error || 'No se pudo guardar', 'error');
    return;
  }
  closeSirhForm();
  await reloadRows();
  showToast('Módulo guardado.');
}

async function toggleSirhActivo(id) {
  const row = rows.find((r) => Number(r.id) === Number(id));
  if (!row) return;
  const api = desktop();
  if (!api?.sirhUpsert) return;
  const res = await api.sirhUpsert({ ...row, activo: Number(row.activo) === 0 ? 1 : 0 });
  if (!res?.ok) {
    showToast(res?.error || 'No se pudo actualizar', 'error');
    return;
  }
  await reloadRows();
  showToast(Number(row.activo) === 0 ? 'Módulo activado.' : 'Módulo desactivado (sigue en catálogo).');
}

async function deleteSirhRow(id) {
  if (!confirm('¿Eliminar este módulo del catálogo? Preferí desactivar si solo querés sacarlo de las vistas.')) return;
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

function setSirhView(view) {
  const allowed = ['modulos', 'equipo', 'proveedores'];
  currentView = allowed.includes(view) ? view : 'modulos';

  document.getElementById('view-modulos')?.classList.toggle('hidden', currentView !== 'modulos');
  document.getElementById('view-equipo')?.classList.toggle('hidden', currentView !== 'equipo');
  document.getElementById('view-proveedores')?.classList.toggle('hidden', currentView !== 'proveedores');
  document.getElementById('btn-nuevo-modulo')?.classList.toggle('hidden', currentView !== 'modulos');

  document.querySelectorAll('.sirh-view-tab').forEach((btn) => {
    const on = btn.getAttribute('data-sirh-view') === currentView;
    btn.classList.toggle('bg-primary', on);
    btn.classList.toggle('text-white', on);
    btn.classList.toggle('border', !on);
    btn.classList.toggle('border-outline-variant', !on);
  });

  mountSidebarNav({ active: currentView === 'modulos' ? 'modulos' : currentView });
  mountTopUtilities({ active: '' });

  const title = document.querySelector('header h2');
  if (title) {
    const titles = {
      modulos: 'D6 · Módulos SIRH',
      equipo: 'D6 · Equipo (por módulos)',
      proveedores: 'D6 · Proveedores (por módulos)',
    };
    title.textContent = titles[currentView] || titles.modulos;
  }

  const hash = window.location.hash || '';
  if (currentView !== 'modulos' && hash !== `#${currentView}`) {
    history.replaceState(null, '', `#${currentView}`);
  } else if (currentView === 'modulos' && (hash === '#equipo' || hash === '#proveedores')) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }

  setHelpSection(currentView === 'modulos' ? 'sirh' : currentView);
}

function wireViewTabs() {
  document.querySelectorAll('.sirh-view-tab').forEach((btn) => {
    btn.addEventListener('click', () => setSirhView(btn.getAttribute('data-sirh-view')));
  });
  window.addEventListener('hashchange', () => {
    const h = (window.location.hash || '').replace('#', '');
    if (h === 'equipo' || h === 'proveedores') setSirhView(h);
    else if (!h) setSirhView('modulos');
  });
}

function applyAreaFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const area = params.get('area');
  if (area && AREA_OPTIONS.some((a) => a.id === area)) {
    const el = document.getElementById('filter-area');
    if (el) el.value = area;
  }
}

function applyViewFromHash() {
  const h = (window.location.hash || '').replace('#', '');
  if (h === 'equipo' || h === 'proveedores') setSirhView(h);
  else setSirhView('modulos');
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
    toggleSirhActivo,
    setSirhView,
    addPersonToModule,
    addProviderToModule,
  });

  wireViewTabs();

  const api = desktop();
  if (api?.sirhCatalogos) {
    catalogos = await api.sirhCatalogos();
  } else {
    catalogos = {
      estados: ['Planificado', 'Alcance', 'En desarrollo', 'En pruebas', 'Operativo', 'Pausado', 'Cancelado'],
      prioridades: ['Alta', 'Media', 'Baja'],
      riesgos: ['Alto', 'Medio', 'Bajo'],
      areas: AREA_OPTIONS.map((a) => ({ id: a.id, label: a.label })),
    };
  }

  const areas = catalogos.areas?.length ? catalogos.areas : AREA_OPTIONS.map((a) => ({ id: a.id, label: a.label }));

  fillSelect(document.getElementById('filter-estado'), catalogos.estados, 'Todos los estados');
  fillSelect(document.getElementById('filter-prioridad'), catalogos.prioridades, 'Todas las prioridades');
  fillSelect(document.getElementById('filter-area'), areas, 'Todas las áreas');
  fillSelect(document.getElementById('f-estado'), catalogos.estados);
  fillSelect(document.getElementById('f-prioridad'), catalogos.prioridades);
  fillSelect(document.getElementById('f-riesgo'), catalogos.riesgos);
  fillSelect(document.getElementById('f-area'), areas);

  applyAreaFromQuery();

  if (api?.sirhDbPath) {
    const p = await api.sirhDbPath();
    const el = document.getElementById('sirh-db-path');
    if (el) el.textContent = p ? `SQLite: ${p}` : 'SQLite: (sin ruta)';
  }

  await reloadRows();
  applyViewFromHash();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
