import { initStore, getState } from '../store.js';
import { getProfile } from '../state.js';
import { applyBrandForInforme } from '../brand.js';
import { toggleSidebar, initSidebarFromStorage } from '../shell.js';
import { wireHelpGlobals, setHelpSection } from '../help/guide.js';
import {
  getAverageScore,
  getCriticalSystemsCount,
  getPipelineProgress,
  getTeamCapacity,
  calculateWorkload,
} from '../metrics.js';

const CHART_COLORS = {
  alta: '#ba1a1a',
  media: '#d97706',
  baja: '#059669',
  ink: '#141414',
  muted: '#5c5f66',
  line: '#d8dadd',
  stages: ['#111111', '#404040', '#737686', '#004ac6', '#006c4a'],
  incidents: {
    Pendiente: '#ba1a1a',
    'En Revisión': '#d97706',
    Resuelto: '#059669',
  },
};

let charts = {};

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setHtml(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

function coverage(state) {
  const total = state.sistemas.length;
  const assigned = state.sistemas.filter((s) => (s.team || '').trim()).length;
  const percent = total > 0 ? Math.round((assigned / total) * 100) : 100;
  return { total, assigned, percent };
}

function attentionItems(state) {
  const items = [];
  const highInc = state.unattended.filter((i) => (i.priority || '') === 'Alta' && i.status !== 'Resuelto');
  const pending = state.unattended.filter((i) => i.status === 'Pendiente');
  const critical = getCriticalSystemsCount(state);
  const cov = coverage(state);
  const stalled = state.requests.filter((r) => (r.progress || 0) < 30 && r.priority === 'Alta');
  const noTeamProv = state.proveedores.filter((p) => !(p.team || '').trim()).length;

  if (highInc.length) items.push(`${highInc.length} incidencia(s) de alta prioridad activas.`);
  else if (pending.length) items.push(`${pending.length} incidencia(s) pendientes.`);
  if (critical) items.push(`${critical} sistema(s) críticos en el inventario.`);
  if (cov.percent < 85) items.push(`Cobertura de asignación en ${cov.percent}% — hay activos sin equipo.`);
  if (stalled.length) items.push(`${stalled.length} solicitud(es) Alta con avance bajo (<30%).`);
  if (noTeamProv) items.push(`${noTeamProv} proveedor(es) sin responsable asignado.`);
  if (!items.length) items.push('Sin alertas críticas: operación dentro de parámetros esperados.');
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

function renderKpis(state) {
  const highInc = state.unattended.filter((i) => (i.priority || '') === 'Alta').length;
  const pipeline = getPipelineProgress(state);
  const capacity = getTeamCapacity(state);
  const cov = coverage(state);
  const providers = state.proveedores || [];
  const activeProv = providers.filter((p) => (p.status || 'Activo') === 'Activo').length;

  setText('stat-critical', String(getCriticalSystemsCount(state)));
  setText('stat-critical-hint', `de ${state.sistemas.length} sistemas`);
  setText('stat-incidents-high', String(highInc));
  setText('stat-incidents-hint', `${state.unattended.length} activas en total`);
  setText('stat-pipeline', `${pipeline}%`);
  setText('stat-pipeline-hint', `${state.requests.length} solicitudes`);
  setText('stat-capacity', `${capacity}%`);
  setText('stat-capacity-hint', `${state.ranking.length} personas`);
  setText('stat-coverage', `${cov.percent}%`);
  setText('stat-coverage-hint', `${cov.assigned}/${cov.total} con equipo`);
  setText('stat-providers', String(providers.length));
  setText('stat-providers-hint', `${activeProv} con estado Activo`);
}

function renderAttention(state) {
  const items = attentionItems(state);
  setHtml(
    'list-attention',
    items.map((t) => `<li>${t}</li>`).join(''),
  );
}

function renderFocus(state) {
  const incidents = state.unattended
    .filter((i) => i.priority === 'Alta' || i.status === 'Pendiente')
    .slice(0, 4);
  const requests = [...state.requests]
    .filter((r) => r.priority === 'Alta' || (r.progress || 0) < 40)
    .sort((a, b) => (a.progress || 0) - (b.progress || 0))
    .slice(0, 4);

  const cards = [];
  incidents.forEach((u) => {
    cards.push(`
      <div class="informe-focus-card informe-focus-card--inc">
        <span class="informe-focus-tag">Incidencia</span>
        <h4>${escapeHtml(u.title)}</h4>
        <p>${escapeHtml(u.status)} · ${escapeHtml(u.priority || '—')}</p>
      </div>
    `);
  });
  requests.forEach((r) => {
    cards.push(`
      <div class="informe-focus-card informe-focus-card--req">
        <span class="informe-focus-tag">Solicitud</span>
        <h4>${escapeHtml(r.feature)}</h4>
        <p>${escapeHtml(r.status)} · ${r.progress || 0}% · ${escapeHtml(r.expte || '—')}</p>
      </div>
    `);
  });

  setHtml(
    'list-focus',
    cards.join('') || '<p class="informe-empty">Sin ítems críticos en el radar.</p>',
  );
}

function renderTeam(state) {
  const top = [...state.ranking]
    .sort((a, b) => getAverageScore(b) - getAverageScore(a))
    .slice(0, 8);

  setHtml(
    'table-top-team',
    top
      .map(
        (p, i) => `
      <tr>
        <td class="font-data">${i + 1}</td>
        <td class="font-semibold">${escapeHtml(p.name)}</td>
        <td>${escapeHtml(p.dept || '—')}</td>
        <td class="text-right font-data font-semibold">${getAverageScore(p)}</td>
      </tr>`,
      )
      .join('') || '<tr><td colspan="4" class="informe-empty">Sin datos de equipo</td></tr>',
  );
}

function renderCriticalSystems(state) {
  const list = state.sistemas.filter((s) => s.priority === 'Alta').slice(0, 6);
  setHtml(
    'list-critical-systems',
    list
      .map(
        (s) => `
      <div class="informe-row">
        <div>
          <p class="informe-row-title">${escapeHtml(s.name)}</p>
          <p class="informe-row-meta">${escapeHtml(s.team || 'Sin equipo')} · ${escapeHtml(s.desc || '')}</p>
        </div>
        <span class="informe-pill informe-pill--danger">Alta</span>
      </div>`,
      )
      .join('') || '<p class="informe-empty">Sin sistemas críticos.</p>',
  );
}

function renderProviders(state) {
  const list = state.proveedores || [];
  const gaps = list.filter((p) => !(p.team || '').trim());
  const rows = (gaps.length ? gaps : list).slice(0, 6);

  setHtml(
    'list-providers',
    rows
      .map((p) => {
        const gap = !(p.team || '').trim();
        return `
        <div class="informe-row">
          <div>
            <p class="informe-row-title">${escapeHtml(p.name)}</p>
            <p class="informe-row-meta">${escapeHtml(p.rubro || '—')} · ${escapeHtml(p.status || '—')}${gap ? ' · sin equipo' : ` · ${escapeHtml(p.team)}`}</p>
          </div>
          <span class="informe-pill ${gap ? 'informe-pill--warn' : ''}">${gap ? 'Gap' : 'OK'}</span>
        </div>`;
      })
      .join('') || '<p class="informe-empty">Sin proveedores registrados.</p>',
  );
}

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function initCharts(state) {
  if (typeof Chart === 'undefined') return;
  chartDefaults();
  destroyCharts();

  const pCounts = { Alta: 0, Media: 0, Baja: 0 };
  state.sistemas.forEach((s) => {
    const key = s.priority in pCounts ? s.priority : 'Baja';
    pCounts[key] += 1;
  });

  charts.systems = new Chart(document.getElementById('chart-systems'), {
    type: 'doughnut',
    data: {
      labels: ['Alta', 'Media', 'Baja'],
      datasets: [{
        data: [pCounts.Alta, pCounts.Media, pCounts.Baja],
        backgroundColor: [CHART_COLORS.alta, CHART_COLORS.media, CHART_COLORS.baja],
        borderWidth: 0,
        hoverOffset: 4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${ctx.raw}`,
          },
        },
      },
    },
  });

  const stages = ['Backlog', 'Alcance', 'Desarrollo', 'Testing', 'Deploy'];
  const stageCounts = stages.map((s) => state.requests.filter((r) => r.status === s).length);

  charts.pipeline = new Chart(document.getElementById('chart-pipeline'), {
    type: 'bar',
    data: {
      labels: stages,
      datasets: [{
        data: stageCounts,
        backgroundColor: CHART_COLORS.stages,
        borderRadius: 6,
        barThickness: 22,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { precision: 0 },
          grid: { color: CHART_COLORS.line },
        },
        y: { grid: { display: false } },
      },
    },
  });

  const incLabels = ['Pendiente', 'En Revisión', 'Resuelto'];
  const incData = incLabels.map((s) => state.unattended.filter((i) => i.status === s).length);
  const otherInc = state.unattended.filter((i) => !incLabels.includes(i.status)).length;
  if (otherInc) {
    incLabels.push('Otros');
    incData.push(otherInc);
  }

  charts.incidents = new Chart(document.getElementById('chart-incidents'), {
    type: 'doughnut',
    data: {
      labels: incLabels,
      datasets: [{
        data: incData,
        backgroundColor: incLabels.map((l) => CHART_COLORS.incidents[l] || '#737686'),
        borderWidth: 0,
        hoverOffset: 4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      plugins: { legend: { position: 'bottom' } },
    },
  });

  const workloadTop = [...state.ranking]
    .map((p) => ({ name: p.name, load: calculateWorkload(state, p.name).total }))
    .sort((a, b) => b.load - a.load)
    .slice(0, 6);

  charts.workload = new Chart(document.getElementById('chart-workload'), {
    type: 'bar',
    data: {
      labels: workloadTop.map((w) => w.name.split(' ')[0]),
      datasets: [{
        data: workloadTop.map((w) => w.load),
        backgroundColor: CHART_COLORS.ink,
        borderRadius: 4,
        barThickness: 16,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: CHART_COLORS.line },
          ticks: { precision: 0 },
        },
        x: { grid: { display: false } },
      },
    },
  });
}

function renderMeta(state) {
  const dateEl = document.getElementById('report-date');
  if (dateEl) {
    dateEl.textContent = new Intl.DateTimeFormat('es-AR', { dateStyle: 'full' }).format(new Date());
  }
  const author =
    state.settings?.operatorName?.trim() ||
    getProfile()?.name?.trim() ||
    '';
  setText('report-author', author ? `Exportado por ${author}` : 'Documento de carácter reservado');

  const title = state.settings?.appTitle
    ? `Informe Gerencial · ${state.settings.appTitle}`
    : 'Informe Gerencial';
  setText('informe-title', title);

  const footer = document.getElementById('footer-brand-text');
  if (footer) {
    footer.textContent = `${state.settings?.appTitle || 'D6'} · Documento interno · Gerencia General`;
  }
}

function init() {
  initStore();
  const state = getState();
  applyBrandForInforme(state);
  initSidebarFromStorage();
  wireHelpGlobals();
  setHelpSection('informe');
  Object.assign(window, { toggleSidebar });
  renderMeta(state);
  renderKpis(state);
  renderAttention(state);
  renderFocus(state);
  renderTeam(state);
  renderCriticalSystems(state);
  renderProviders(state);
  initCharts(state);
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
