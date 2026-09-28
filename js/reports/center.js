import { getState } from '../store.js';
import { getProfile } from '../state.js';
import { exportToCSV } from '../board/csv.js';
import { getAverageScore, getCriticalSystemsCount, getPipelineProgress, getTeamCapacity } from '../metrics.js';

function downloadBlob(filename, mime, content) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportReportCSV(scope) {
  const map = {
    ranking: 'ranking',
    sistemas: 'sistemas',
    incidents: 'incidents',
    pipeline: 'pipeline',
    asignacion: 'asignacion',
    proveedores: 'proveedores',
    completo: null,
  };
  if (scope === 'completo') {
    ['ranking', 'sistemas', 'incidents', 'pipeline', 'asignacion', 'proveedores'].forEach((t) => exportToCSV(t));
    return;
  }
  const type = map[scope] || scope;
  exportToCSV(type);
}

export function buildExecutiveHtml() {
  const state = getState();
  const author = state.settings?.operatorName || getProfile().name || 'DDS';
  const date = new Intl.DateTimeFormat('es-AR', { dateStyle: 'full' }).format(new Date());
  const critical = getCriticalSystemsCount(state);
  const pipeline = getPipelineProgress(state);
  const capacity = getTeamCapacity(state);
  const top = [...state.ranking].sort((a, b) => getAverageScore(b) - getAverageScore(a)).slice(0, 5);
  const highInc = state.unattended.filter((u) => (u.priority || 'Alta') === 'Alta').slice(0, 5);

  return `
    <div id="executive-print-root" class="p-8 bg-white text-on-surface" style="font-family: Inter, sans-serif; max-width: 800px; margin: 0 auto;">
      <header class="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
        <div>
          <h1 class="text-2xl font-bold tracking-tight">${state.settings?.appTitle || 'D6'}</h1>
          <p class="text-xs uppercase tracking-widest opacity-60">Informe ejecutivo</p>
        </div>
        <div class="text-right text-xs">
          <p>${date}</p>
          <p class="opacity-60">Exportado por ${author}</p>
        </div>
      </header>
      <section class="grid grid-cols-3 gap-4 mb-8">
        <div class="border border-outline-variant p-4">
          <p class="text-[10px] uppercase opacity-50 font-bold">Activos críticos</p>
          <p class="text-3xl font-bold font-data">${critical}</p>
        </div>
        <div class="border border-outline-variant p-4">
          <p class="text-[10px] uppercase opacity-50 font-bold">Pipeline</p>
          <p class="text-3xl font-bold font-data">${pipeline}%</p>
        </div>
        <div class="border border-outline-variant p-4">
          <p class="text-[10px] uppercase opacity-50 font-bold">Capacidad</p>
          <p class="text-3xl font-bold font-data">${capacity}%</p>
        </div>
      </section>
      <section class="mb-8">
        <h2 class="text-sm font-bold uppercase tracking-widest mb-3">Top equipo</h2>
        <table class="w-full text-sm">
          <thead><tr class="border-b text-left text-[10px] uppercase opacity-50"><th class="py-2">#</th><th>Nombre</th><th>Rol</th><th class="text-right">Score</th></tr></thead>
          <tbody>
            ${top.map((p, i) => `<tr class="border-b border-outline-variant/40"><td class="py-2">${i + 1}</td><td class="font-bold">${p.name}</td><td>${p.dept}</td><td class="text-right font-data">${getAverageScore(p)}</td></tr>`).join('')}
          </tbody>
        </table>
      </section>
      <section>
        <h2 class="text-sm font-bold uppercase tracking-widest mb-3">Incidencias alta</h2>
        ${highInc.length ? highInc.map((u) => `<div class="border-l-4 border-error pl-3 mb-3"><p class="font-bold text-sm">${u.title}</p><p class="text-xs opacity-70">${u.status} — ${u.desc || ''}</p></div>`).join('') : '<p class="text-xs italic opacity-50">Sin incidencias de alta prioridad.</p>'}
      </section>
      <footer class="mt-10 pt-4 border-t text-[10px] uppercase tracking-widest opacity-40 text-center">D6-SIRH · Documento interno</footer>
    </div>
  `;
}

export function openExecutivePreview() {
  const host = document.getElementById('reports-executive-preview');
  if (!host) return;
  host.innerHTML = buildExecutiveHtml();
  host.classList.remove('hidden');
}

export async function exportExecutivePdf() {
  openExecutivePreview();
  const root = document.getElementById('executive-print-root');
  if (!root) {
    alert('No se pudo preparar el informe.');
    return;
  }
  if (typeof html2canvas === 'undefined' || !window.jspdf) {
    window.print();
    return;
  }
  try {
    const canvas = await html2canvas(root, { scale: 2, backgroundColor: '#ffffff' });
    const img = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 16;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(img, 'PNG', 8, 8, imgWidth, Math.min(imgHeight, pageHeight - 16));
    const stamp = new Date().toISOString().slice(0, 10);
    pdf.save(`dds_informe_${stamp}.pdf`);
  } catch (e) {
    console.error(e);
    alert('Error al generar PDF. Se abrirá impresión del navegador.');
    window.print();
  }
}

export function renderReportsPanel() {
  const host = document.getElementById('reports-panel');
  if (!host) return;
  host.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div class="space-y-4">
        <h3 class="text-sm font-bold uppercase tracking-widest">SIRH</h3>
        <p class="text-sm text-on-surface-variant">Exportá módulos desde SQLite o abrí el tablero de Gerencia.</p>
        <div class="flex flex-wrap gap-2">
          <button type="button" onclick="exportSirhCsv()" class="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold uppercase hover:opacity-90 transition-all">CSV módulos SIRH</button>
          <a href="/pages/sirh.html" class="px-4 py-2 border border-outline-variant rounded-lg text-xs font-bold uppercase hover:bg-surface-container inline-flex items-center">ABM Módulos</a>
          <a href="/pages/helical.html" class="px-4 py-2 border border-outline-variant rounded-lg text-xs font-bold uppercase hover:bg-surface-container inline-flex items-center">Gerencia Helical</a>
        </div>
      </div>
      <div class="space-y-4">
        <h3 class="text-sm font-bold uppercase tracking-widest">Operación (secundario)</h3>
        <p class="text-sm text-on-surface-variant">CSV de operación / proveedores e informe PDF.</p>
        <div class="flex flex-wrap gap-2">
          ${[
            ['sistemas', 'Sistemas'],
            ['incidents', 'Incidencias'],
            ['pipeline', 'Solicitudes'],
            ['proveedores', 'Proveedores'],
          ].map(([id, label]) => `
            <button type="button" onclick="exportReportCSV('${id}')" class="px-4 py-2 border border-outline-variant rounded-lg text-xs font-bold uppercase hover:bg-surface-container transition-all">${label}</button>
          `).join('')}
          <button type="button" onclick="openExecutivePreview()" class="px-4 py-2 border border-outline-variant rounded-lg text-xs font-bold uppercase hover:bg-surface-container">Vista previa PDF</button>
          <button type="button" onclick="exportExecutivePdf()" class="px-4 py-2 border border-outline-variant rounded-lg text-xs font-bold uppercase hover:bg-surface-container">Exportar PDF</button>
          <a href="/pages/informe.html" class="px-4 py-2 border border-outline-variant rounded-lg text-xs font-bold uppercase hover:bg-surface-container inline-flex items-center">Informe Gerencial</a>
        </div>
      </div>
    </div>
    <div id="reports-executive-preview" class="hidden mt-8 border border-outline-variant bg-white"></div>
  `;
}

async function exportSirhCsv() {
  try {
    const rows = window.ddsDesktop?.sirhList
      ? await window.ddsDesktop.sirhList()
      : (await (await fetch('/api/sirh/modulos')).json()).rows || [];
    const headers = ['id', 'modulo', 'fase', 'estado', 'prioridad', 'avance', 'riesgo', 'fecha_inicio', 'fecha_fin_prevista', 'fecha_fin_real', 'responsable', 'proveedor', 'hito', 'bloqueo'];
    const lines = [headers.join(';')];
    rows.forEach((r) => {
      lines.push(headers.map((h) => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(';'));
    });
    downloadBlob(`d6_sirh_modulos_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8', `\uFEFF${lines.join('\n')}`);
  } catch (err) {
    alert(err.message || 'No se pudo exportar SIRH');
  }
}

export function wireReportsGlobals() {
  Object.assign(window, {
    exportReportCSV,
    openExecutivePreview,
    exportExecutivePdf,
    renderReportsPanel,
    exportSirhCsv,
  });
}
