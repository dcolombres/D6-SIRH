import { getState } from '../store.js';

let chartEstado = null;
let chartAvance = null;

function destroyCharts() {
  if (chartEstado) {
    chartEstado.destroy();
    chartEstado = null;
  }
  if (chartAvance) {
    chartAvance.destroy();
    chartAvance = null;
  }
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.innerText = val;
}

function setHTML(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderSirhCharts(stats) {
  if (typeof Chart === 'undefined') return;
  const estadoCanvas = document.getElementById('overview-chart-estado');
  const avanceCanvas = document.getElementById('overview-chart-avance');
  if (!estadoCanvas || !avanceCanvas) return;

  destroyCharts();

  const estadoLabels = Object.keys(stats.byEstado || {});
  const estadoValues = estadoLabels.map((k) => stats.byEstado[k]);
  const palette = ['#004ac6', '#1a2744', '#006c4a', '#b45309', '#ba1a1a', '#5c5f66', '#008cc7'];

  chartEstado = new Chart(estadoCanvas, {
    type: 'doughnut',
    data: {
      labels: estadoLabels,
      datasets: [{
        data: estadoValues,
        backgroundColor: estadoLabels.map((_, i) => palette[i % palette.length]),
        borderWidth: 0,
      }],
    },
    options: {
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
      },
      cutout: '58%',
    },
  });

  const avanceRows = stats.avance || [];
  chartAvance = new Chart(avanceCanvas, {
    type: 'bar',
    data: {
      labels: avanceRows.map((r) => r.modulo),
      datasets: [{
        label: 'Avance %',
        data: avanceRows.map((r) => r.avance),
        backgroundColor: '#004ac6',
        borderRadius: 4,
      }],
    },
    options: {
      indexAxis: 'y',
      plugins: { legend: { display: false } },
      scales: {
        x: { min: 0, max: 100, ticks: { font: { size: 10 } } },
        y: { ticks: { font: { size: 10 } } },
      },
    },
  });
}

function renderFocusFromStats(stats) {
  const risks = (stats.avance || []).filter((r) => String(r.riesgo || '').toLowerCase() === 'alto').slice(0, 4);
  const lateHint = stats.vencidos > 0
    ? `<div class="p-4 bg-white border border-outline-variant rounded-xl border-l-4 border-error">
        <div class="flex justify-between items-start mb-2">
          <span class="text-[9px] font-bold text-error uppercase">Vencidos</span>
          <span class="material-symbols-outlined text-error text-sm">event_busy</span>
        </div>
        <h4 class="font-bold text-sm mb-1">${stats.vencidos} módulo(s) con fin previsto vencido</h4>
        <p class="text-[10px] text-on-surface-variant">Revisá fechas en Módulos y actualizá estado o plazo.</p>
      </div>`
    : '';

  const riskCards = risks.map((r) => `
    <div class="p-4 bg-white border border-outline-variant rounded-xl border-l-4 border-amber-500">
      <div class="flex justify-between items-start mb-2">
        <span class="text-[9px] font-bold text-amber-700 uppercase">Riesgo alto</span>
        <span class="font-data text-[10px] font-bold">${r.avance}%</span>
      </div>
      <h4 class="font-bold text-sm mb-1">${esc(r.modulo)}</h4>
      <p class="text-[10px] text-on-surface-variant uppercase font-bold opacity-60">${esc(r.estado)}</p>
    </div>
  `).join('');

  setHTML(
    'overview-focus-items',
    (lateHint + riskCards) || '<div class="col-span-full py-10 text-center opacity-30 italic">Sin alertas SIRH críticas.</div>',
  );
}

async function renderOverview() {
  const today = new Intl.DateTimeFormat('es-AR', { dateStyle: 'full' }).format(new Date());
  setVal('overview-subtitle', `D6 · Seguimiento SIRH (${today})`);

  let stats = null;
  try {
    if (window.ddsDesktop?.sirhStats) {
      stats = await window.ddsDesktop.sirhStats();
    } else {
      const res = await fetch('/api/sirh/stats');
      const data = await res.json();
      stats = data.stats;
    }
  } catch (err) {
    console.warn('SIRH stats no disponibles', err);
  }

  if (!stats) {
    setVal('overview-avg-workload', '—');
    setVal('overview-critical-count', '—');
    setVal('overview-pipeline-load', '—');
    setVal('overview-staff-efficiency', '—');
    setHTML('overview-focus-items', '<div class="col-span-full py-10 text-center opacity-30 italic">Iniciá el servidor D6 para ver KPIs SIRH.</div>');
    return;
  }

  setVal('overview-avg-workload', `${stats.total}`);
  setVal('overview-critical-count', `${stats.riesgoAlto}`);
  setVal('overview-pipeline-load', `${stats.avanceMedio}%`);
  setVal('overview-staff-efficiency', `${stats.vencidos}`);

  renderFocusFromStats(stats);
  renderSirhCharts(stats);

  // Secciones legacy de ranking: vaciar si existen
  setHTML('overview-max-workload', '<p class="text-[10px] italic opacity-50">Vista de carga personal deshabilitada en D6. Usá Módulos SIRH.</p>');
  setHTML('overview-min-workload', '');
  setHTML('overview-top-performers', '<p class="text-[10px] italic opacity-50">Sin ranking de personal.</p>');
  setHTML('overview-low-performers', '');

  const estadoEntries = Object.entries(stats.byEstado || {});
  const distHTML = estadoEntries.map(([label, count]) => {
    const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
    return `
      <div class="space-y-1">
        <div class="flex justify-between text-[10px] font-bold uppercase">
          <span>${esc(label)}</span>
          <span class="font-data">${count}</span>
        </div>
        <div class="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
          <div class="bg-primary h-full" style="width: ${pct}%"></div>
        </div>
      </div>
    `;
  }).join('') || '<p class="text-[10px] italic opacity-50">Sin módulos…</p>';

  const healthHost = document.getElementById('overview-system-health');
  if (healthHost) healthHost.innerHTML = distHTML;

  // silence unused getState for lint if any
  void getState;
}

export { renderOverview };
