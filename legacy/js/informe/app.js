import { initStore, getState } from '../store.js';
import { getProfile } from '../state.js';
import { applyBrandForInforme } from '../brand.js';
import { toggleSidebar, initSidebarFromStorage } from '../shell.js';
import { wireHelpGlobals, setHelpSection } from '../help/guide.js';
import { mountSidebarNav, mountTopUtilities } from '../sirh/shell-nav.js';
import { aggregateTeam, aggregateProviders } from '../sirh/people.js';

const CHART_COLORS = {
  alta: '#ba1a1a',
  media: '#d97706',
  baja: '#059669',
  ink: '#141414',
  muted: '#5c5f66',
  line: '#d8dadd',
  stages: ['#111111', '#404040', '#737686', '#004ac6', '#006c4a'],
};

let charts = {};
let sirhRows = [];

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setHtml(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function activeSirh() {
  return sirhRows.filter((r) => Number(r.activo) !== 0);
}

function sirhCoverage() {
  const rows = activeSirh();
  const total = rows.length;
  const assigned = rows.filter((r) => String(r.responsable || '').trim() || String(r.equipo || '').trim()).length;
  const percent = total > 0 ? Math.round((assigned / total) * 100) : 100;
  return { total, assigned, percent };
}

function attentionItems() {
  const items = [];
  const cov = sirhCoverage();
  const riskHigh = activeSirh().filter((r) => String(r.riesgo || '').toLowerCase() === 'alto').length;
  const noProv = activeSirh().filter((r) => !String(r.proveedor || '').trim()).length;
  const team = aggregateTeam(sirhRows);
  const today = new Date().toISOString().slice(0, 10);
  const vencidos = activeSirh().filter((r) => {
    const fin = String(r.fecha_fin_prevista || '').trim();
    const cerrado = ['Operativo', 'Cancelado'].includes(r.estado);
    return fin && fin < today && !cerrado;
  }).length;

  if (riskHigh) items.push(`${riskHigh} módulo(s) con riesgo alto.`);
  if (vencidos) items.push(`${vencidos} módulo(s) con fin previsto vencido.`);
  if (cov.percent < 85) items.push(`Cobertura de equipo: ${cov.percent}% (${cov.assigned}/${cov.total}).`);
  if (noProv > Math.ceil(cov.total / 2)) items.push(`${noProv} módulo(s) sin proveedor.`);
  if (!team.length) items.push('Ninguna persona vinculada — cargá responsable/equipo en Módulos.');
  if (!items.length) items.push('Sin alertas críticas en el catálogo SIRH.');
  return items.slice(0, 5);
}

function chartDefaults() {
  if (typeof Chart === 'undefined') return;
  Chart.defaults.font.family = "'Inter', sans-serif";
  Chart.defaults.color = CHART_COLORS.muted;
  Chart.defaults.plugins.legend.labels.boxWidth = 10;
  Chart.defaults.plugins.legend.labels.font = { size: 11, weight: '600' };
}

function destroyCharts() {
  Object.values(charts).forEach((c) => {
    try { c.destroy(); } catch (_) { /* noop */ }
  });
  charts = {};
}

function renderKpis() {
  const rows = activeSirh();
  const cov = sirhCoverage();
  const providers = aggregateProviders(sirhRows);
  const team = aggregateTeam(sirhRows);
  const riskHigh = rows.filter((r) => String(r.riesgo || '').toLowerCase() === 'alto').length;
  const avanceMedio = rows.length
    ? Math.round(rows.reduce((s, r) => s + (Number(r.avance) || 0), 0) / rows.length)
    : 0;

  setText('stat-critical', String(riskHigh));
  setText('stat-critical-hint', `de ${rows.length} módulos activos`);
  setText('stat-incidents-high', String(rows.filter((r) => String(r.prioridad || '').toLowerCase() === 'alta').length));
  setText('stat-incidents-hint', 'prioridad alta');
  setText('stat-pipeline', `${avanceMedio}%`);
  setText('stat-pipeline-hint', 'avance medio del catálogo');
  setText('stat-capacity', `${team.length}`);
  setText('stat-capacity-hint', 'personas en módulos');
  setText('stat-coverage', `${cov.percent}%`);
  setText('stat-coverage-hint', `${cov.assigned}/${cov.total} con responsable/equipo`);
  setText('stat-providers', String(providers.length));
  setText('stat-providers-hint', 'proveedores vinculados');
}

function renderAttention() {
  setHtml('list-attention', attentionItems().map((t) => `<li>${t}</li>`).join(''));
}

function renderFocus() {
  const modules = [...activeSirh()]
    .filter((r) => String(r.riesgo || '').toLowerCase() === 'alto' || String(r.prioridad || '').toLowerCase() === 'alta')
    .slice(0, 6);
  setHtml(
    'list-focus',
    modules.map((m) => `
      <div class="informe-focus-card informe-focus-card--req">
        <span class="informe-focus-tag">Módulo</span>
        <h4>${escapeHtml(m.modulo)}</h4>
        <p>${escapeHtml(m.estado)} · ${escapeHtml(m.riesgo || '—')} · ${Number(m.avance) || 0}%</p>
      </div>
    `).join('') || '<p class="informe-empty">Sin ítems críticos.</p>',
  );
}

function renderTeam() {
  const top = aggregateTeam(sirhRows).slice(0, 8);
  setHtml(
    'table-top-team',
    top.map((p, i) => `
      <tr>
        <td class="font-data">${i + 1}</td>
        <td class="font-semibold">${escapeHtml(p.name)}</td>
        <td>${escapeHtml(p.roles.join(', '))}</td>
        <td class="text-right font-data font-semibold">${p.moduleCount}</td>
      </tr>`).join('')
      || '<tr><td colspan="4" class="informe-empty">Sin personas. <a href="/pages/sirh.html#equipo">Cargar en Equipo</a></td></tr>',
  );
}

function renderCriticalSystems() {
  const list = activeSirh()
    .filter((r) => String(r.prioridad || '').toLowerCase() === 'alta' || String(r.riesgo || '').toLowerCase() === 'alto')
    .slice(0, 6);
  setHtml(
    'list-critical-systems',
    list.map((s) => `
      <div class="informe-row">
        <div>
          <p class="informe-row-title">${escapeHtml(s.modulo)}</p>
          <p class="informe-row-meta">${escapeHtml(s.responsable || 'Sin responsable')} · ${escapeHtml(s.proveedor || 'sin proveedor')}</p>
        </div>
        <span class="informe-pill informe-pill--danger">${escapeHtml(s.riesgo || s.prioridad || 'Alta')}</span>
      </div>`).join('') || '<p class="informe-empty">Sin módulos críticos.</p>',
  );
}

function renderProviders() {
  const list = aggregateProviders(sirhRows);
  if (!list.length) {
    setHtml('list-providers', '<p class="informe-empty">Sin proveedores. <a href="/pages/sirh.html#proveedores">Cargar desde Módulos</a></p>');
    return;
  }
  setHtml(
    'list-providers',
    list.slice(0, 6).map((p) => `
      <div class="informe-row">
        <div>
          <p class="informe-row-title">${escapeHtml(p.name)}</p>
          <p class="informe-row-meta">${p.moduleCount} módulo(s)</p>
        </div>
        <a href="/pages/sirh.html#proveedores" class="informe-pill">Ver</a>
      </div>`).join(''),
  );
}

function initCharts() {
  if (typeof Chart === 'undefined') return;
  chartDefaults();
  destroyCharts();

  const pCounts = { Alta: 0, Media: 0, Baja: 0 };
  activeSirh().forEach((s) => {
    const key = s.prioridad in pCounts ? s.prioridad : 'Baja';
    pCounts[key] += 1;
  });

  const elSys = document.getElementById('chart-systems');
  if (elSys) {
    charts.systems = new Chart(elSys, {
      type: 'doughnut',
      data: {
        labels: ['Alta', 'Media', 'Baja'],
        datasets: [{
          data: [pCounts.Alta, pCounts.Media, pCounts.Baja],
          backgroundColor: [CHART_COLORS.alta, CHART_COLORS.media, CHART_COLORS.baja],
          borderWidth: 0,
        }],
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: '62%', plugins: { legend: { position: 'bottom' } } },
    });
  }

  const byEstado = {};
  activeSirh().forEach((r) => {
    const k = r.estado || 'Sin estado';
    byEstado[k] = (byEstado[k] || 0) + 1;
  });
  const estadoLabels = Object.keys(byEstado);
  const elPipe = document.getElementById('chart-pipeline');
  if (elPipe) {
    charts.pipeline = new Chart(elPipe, {
      type: 'bar',
      data: {
        labels: estadoLabels,
        datasets: [{ data: estadoLabels.map((k) => byEstado[k]), backgroundColor: CHART_COLORS.stages, borderRadius: 6, barThickness: 22 }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: CHART_COLORS.line } },
          y: { grid: { display: false } },
        },
      },
    });
  }

  const byRiesgo = {};
  activeSirh().forEach((r) => {
    const k = r.riesgo || 'Medio';
    byRiesgo[k] = (byRiesgo[k] || 0) + 1;
  });
  const riesgoLabels = Object.keys(byRiesgo);
  const elInc = document.getElementById('chart-incidents');
  if (elInc) {
    charts.incidents = new Chart(elInc, {
      type: 'doughnut',
      data: {
        labels: riesgoLabels,
        datasets: [{
          data: riesgoLabels.map((k) => byRiesgo[k]),
          backgroundColor: [CHART_COLORS.alta, CHART_COLORS.media, CHART_COLORS.baja, '#737686'],
          borderWidth: 0,
        }],
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: '62%', plugins: { legend: { position: 'bottom' } } },
    });
  }

  const workloadTop = aggregateTeam(sirhRows).slice(0, 6);
  const elWork = document.getElementById('chart-workload');
  if (elWork) {
    charts.workload = new Chart(elWork, {
      type: 'bar',
      data: {
        labels: workloadTop.map((w) => w.name.split(' ')[0]),
        datasets: [{ data: workloadTop.map((w) => w.moduleCount), backgroundColor: CHART_COLORS.ink, borderRadius: 4, barThickness: 16 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: CHART_COLORS.line }, ticks: { precision: 0 } },
          x: { grid: { display: false } },
        },
      },
    });
  }
}

function renderMeta(state) {
  const dateEl = document.getElementById('report-date');
  if (dateEl) {
    dateEl.textContent = new Intl.DateTimeFormat('es-AR', { dateStyle: 'full' }).format(new Date());
  }
  const author = state.settings?.operatorName?.trim() || getProfile()?.name?.trim() || '';
  setText('report-author', author ? `Exportado por ${author}` : 'Documento de carácter reservado');
  setText('informe-title', state.settings?.appTitle ? `Informe Gerencial · ${state.settings.appTitle}` : 'Informe Gerencial SIRH');
  const footer = document.getElementById('footer-brand-text');
  if (footer) footer.textContent = `${state.settings?.appTitle || 'D6'} · Documento interno · SIRH`;
}

async function loadSirh() {
  const api = window.d6Api || window.ddsDesktop;
  if (api?.sirhList) {
    sirhRows = await api.sirhList();
    return;
  }
  try {
    const res = await fetch('/api/sirh/modulos');
    const data = await res.json();
    sirhRows = data.rows || [];
  } catch {
    sirhRows = [];
  }
}

async function init() {
  initStore();
  const state = getState();
  applyBrandForInforme(state);
  initSidebarFromStorage();
  wireHelpGlobals();
  setHelpSection('informe');
  mountSidebarNav({ active: 'informe' });
  mountTopUtilities({ active: 'informe' });
  Object.assign(window, { toggleSidebar });

  await loadSirh();
  renderMeta(state);
  renderKpis();
  renderAttention();
  renderFocus();
  renderTeam();
  renderCriticalSystems();
  renderProviders();
  initCharts();
}

function handlePrint() {
  const exportButton = document.getElementById('export-pdf-button');
  const originalHtml = exportButton?.innerHTML;
  if (exportButton) {
    exportButton.disabled = true;
    exportButton.innerHTML = '<span class="material-symbols-outlined text-sm">print</span><span class="text-[10px] font-bold uppercase tracking-wider hidden md:inline">…</span>';
  }
  setTimeout(() => {
    window.print();
    setTimeout(() => {
      if (exportButton) {
        exportButton.disabled = false;
        exportButton.innerHTML = originalHtml;
      }
    }, 800);
  }, 80);
}

Object.assign(window, { handlePrint });

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export { init };
