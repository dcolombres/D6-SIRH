/**
 * Vista gerencial nativa SIRH — KPIs, filtros, charts y detalle desde SQLite.
 */

export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function fold(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function estadoClass(estado) {
  const k = fold(estado);
  if (k.includes('prueba') || k.includes('operativo')) return 'ok';
  if (k.includes('desarrollo')) return 'info';
  if (k.includes('alcance') || k.includes('pausado')) return 'warn';
  if (k.includes('cancel')) return 'danger';
  return 'muted';
}

export function riskClass(r) {
  const k = fold(r);
  if (k === 'alto') return 'danger';
  if (k === 'medio') return 'warn';
  return 'ok';
}

export function computeKpis(rows) {
  const today = new Date().toISOString().slice(0, 10);
  let avanceSum = 0;
  let prioridadAlta = 0;
  let riesgoAlto = 0;
  let vencidos = 0;
  const byEstado = {};
  const byRiesgo = {};

  rows.forEach((r) => {
    avanceSum += Number(r.avance) || 0;
    if (fold(r.prioridad) === 'alta') prioridadAlta += 1;
    if (fold(r.riesgo) === 'alto') riesgoAlto += 1;
    const estado = r.estado || 'Sin estado';
    const riesgo = r.riesgo || 'Medio';
    byEstado[estado] = (byEstado[estado] || 0) + 1;
    byRiesgo[riesgo] = (byRiesgo[riesgo] || 0) + 1;
    const fin = String(r.fecha_fin_prevista || '').trim();
    const cerrado = fold(estado) === 'operativo' || fold(estado) === 'cancelado';
    if (fin && fin < today && !cerrado) vencidos += 1;
  });

  return {
    total: rows.length,
    avanceMedio: rows.length ? Math.round(avanceSum / rows.length) : 0,
    prioridadAlta,
    riesgoAlto,
    vencidos,
    byEstado,
    byRiesgo,
  };
}

export function filterRows(rows, filters = {}) {
  const q = fold(filters.q);
  return rows.filter((r) => {
    if (filters.estado && r.estado !== filters.estado) return false;
    if (filters.prioridad && r.prioridad !== filters.prioridad) return false;
    if (filters.fase && r.fase !== filters.fase) return false;
    if (filters.riesgo && r.riesgo !== filters.riesgo) return false;
    if (!q) return true;
    const blob = fold([r.modulo, r.responsable, r.proveedor, r.bloqueo, r.hito, r.fase].join(' '));
    return blob.includes(q);
  });
}

export function uniqueValues(rows, key) {
  const seen = {};
  const out = [];
  rows.forEach((r) => {
    const v = r[key];
    if (v && !seen[v]) {
      seen[v] = 1;
      out.push(v);
    }
  });
  return out.sort();
}

export function renderKpiCards(host, kpis) {
  if (!host) return;
  const items = [
    { label: 'Módulos', value: kpis.total, hint: 'en vista filtrada' },
    { label: 'Avance medio', value: `${kpis.avanceMedio}%`, hint: 'ponderación simple' },
    { label: 'Prioridad alta', value: kpis.prioridadAlta, hint: 'requieren foco' },
    { label: 'Riesgo alto', value: kpis.riesgoAlto, hint: 'bloqueos críticos' },
    { label: 'Vencidos', value: kpis.vencidos, hint: 'fin previsto pasado' },
  ];
  host.innerHTML = items.map((item) => `
    <div class="bg-white border border-outline-variant rounded-2xl p-5 shadow-sm relative overflow-hidden">
      <div class="absolute -right-4 -top-4 w-16 h-16 rounded-full bg-primary/5"></div>
      <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">${esc(item.label)}</p>
      <p class="text-3xl font-bold font-data mt-1 text-on-surface">${esc(item.value)}</p>
      <p class="text-[11px] text-on-surface-variant mt-1">${esc(item.hint)}</p>
    </div>
  `).join('');
}

export function renderModuleCards(host, rows) {
  if (!host) return;
  if (!rows.length) {
    host.innerHTML = '<div class="col-span-full py-10 text-center text-on-surface-variant italic">Sin módulos para los filtros</div>';
    return;
  }
  host.innerHTML = rows.slice(0, 6).map((r) => {
    const who = r.proveedor
      ? `${esc(r.responsable || '—')} · Prov: ${esc(r.proveedor)}`
      : esc(r.responsable || '—');
    const fechas = `${esc(r.fecha_inicio || '—')} → ${esc(r.fecha_fin_prevista || '—')}`;
    return `
      <article class="bg-white border border-outline-variant rounded-2xl p-5 shadow-sm flex flex-col gap-2 min-h-[160px]">
        <div class="flex flex-wrap gap-1">
          <span class="sirh-badge ${estadoClass(r.estado)}">${esc(r.estado)}</span>
          <span class="sirh-badge ${riskClass(r.riesgo)}">${esc(r.riesgo)}</span>
        </div>
        <h4 class="font-bold text-base">${esc(r.modulo)}</h4>
        <p class="text-xs text-on-surface-variant">${esc(r.fase)} · ${who}</p>
        <div class="h-2 bg-surface-container rounded-full overflow-hidden">
          <div class="h-full bg-emerald-600" style="width:${Number(r.avance) || 0}%"></div>
        </div>
        <p class="text-xs text-on-surface-variant"><strong class="font-data">${Number(r.avance) || 0}%</strong> · ${fechas}</p>
        <p class="text-xs text-on-surface-variant">Hito: ${esc(r.hito || '—')}</p>
      </article>
    `;
  }).join('');
}

export function renderDetailTable(host, metaEl, rows) {
  if (metaEl) metaEl.textContent = `(${rows.length})`;
  if (!host) return;
  if (!rows.length) {
    host.innerHTML = '<div class="py-10 text-center text-on-surface-variant italic">Sin filas</div>';
    return;
  }
  host.innerHTML = `
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-surface-container-low text-[10px] uppercase tracking-wider text-on-surface-variant sticky top-0">
          <tr>
            <th class="text-left px-4 py-3">Módulo</th>
            <th class="text-left px-3 py-3">Fase</th>
            <th class="text-left px-3 py-3">Estado</th>
            <th class="text-left px-3 py-3">Prioridad</th>
            <th class="text-left px-3 py-3">Avance</th>
            <th class="text-left px-3 py-3">Riesgo</th>
            <th class="text-left px-3 py-3">Inicio</th>
            <th class="text-left px-3 py-3">Fin prev.</th>
            <th class="text-left px-3 py-3">Responsable</th>
            <th class="text-left px-3 py-3">Proveedor</th>
            <th class="text-left px-3 py-3">Bloqueo</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((r) => `
            <tr class="border-t border-outline-variant/50 hover:bg-surface-container-low/50">
              <td class="px-4 py-3 font-semibold">${esc(r.modulo)}</td>
              <td class="px-3 py-3">${esc(r.fase || '—')}</td>
              <td class="px-3 py-3"><span class="sirh-badge ${estadoClass(r.estado)}">${esc(r.estado)}</span></td>
              <td class="px-3 py-3">${esc(r.prioridad || '—')}</td>
              <td class="px-3 py-3 font-data font-bold">${Number(r.avance) || 0}%</td>
              <td class="px-3 py-3"><span class="sirh-badge ${riskClass(r.riesgo)}">${esc(r.riesgo)}</span></td>
              <td class="px-3 py-3 font-data text-xs">${esc(r.fecha_inicio || '—')}</td>
              <td class="px-3 py-3 font-data text-xs">${esc(r.fecha_fin_prevista || '—')}</td>
              <td class="px-3 py-3 text-xs">${esc(r.responsable || '—')}</td>
              <td class="px-3 py-3 text-xs">${esc(r.proveedor || '—')}</td>
              <td class="px-3 py-3 text-xs max-w-[220px]">${esc(r.bloqueo || '—')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

const PALETTE = ['#0b3d91', '#0f1c33', '#0d6b4c', '#9a5b00', '#a11919', '#5a6170', '#008cc7'];

export function renderEstadoChart(canvas, byEstado, chartRef) {
  if (!canvas || typeof Chart === 'undefined') return null;
  if (chartRef) chartRef.destroy();
  const labels = Object.keys(byEstado || {});
  return new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: labels.map((k) => byEstado[k]),
        backgroundColor: labels.map((_, i) => PALETTE[i % PALETTE.length]),
        borderWidth: 0,
      }],
    },
    options: {
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } },
      cutout: '58%',
    },
  });
}

export function renderAvanceChart(canvas, rows, chartRef) {
  if (!canvas || typeof Chart === 'undefined') return null;
  if (chartRef) chartRef.destroy();
  const top = [...rows].sort((a, b) => (Number(b.avance) || 0) - (Number(a.avance) || 0)).slice(0, 10);
  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels: top.map((r) => r.modulo),
      datasets: [{
        label: 'Avance %',
        data: top.map((r) => Number(r.avance) || 0),
        backgroundColor: '#0b3d91',
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

export function apiBridge() {
  return window.d6Api || window.ddsDesktop || null;
}
