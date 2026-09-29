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

async function exportSirhCsv() {
  try {
    const api = window.d6Api || window.ddsDesktop;
    const rows = api?.sirhList
      ? await api.sirhList()
      : (await (await fetch('/api/sirh/modulos')).json()).rows || [];
    const headers = [
      'id', 'modulo', 'area', 'fase', 'estado', 'prioridad', 'avance', 'riesgo',
      'fecha_inicio', 'fecha_fin_prevista', 'fecha_fin_real', 'responsable', 'proveedor',
      'equipo', 'hito', 'bloqueo', 'descripcion', 'activo', 'orden',
    ];
    const lines = [headers.join(';')];
    rows.forEach((r) => {
      lines.push(headers.map((h) => {
        let v = r[h] ?? '';
        if (h === 'equipo') v = String(v).replace(/\n/g, ' | ');
        return `"${String(v).replace(/"/g, '""')}"`;
      }).join(';'));
    });
    downloadBlob(`d6_sirh_modulos_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8', `\uFEFF${lines.join('\n')}`);
  } catch (err) {
    alert(err.message || 'No se pudo exportar SIRH');
  }
}

export function renderReportsPanel() {
  const host = document.getElementById('reports-panel');
  if (!host) return;
  host.innerHTML = `
    <div class="bg-white border border-outline-variant rounded-2xl p-6 space-y-4 max-w-2xl">
      <h3 class="text-sm font-bold uppercase tracking-widest">Reportes SIRH</h3>
      <p class="text-sm text-on-surface-variant">Misma fuente SQLite que Hoy, Módulos y Tablero.</p>
      <div class="flex flex-wrap gap-2">
        <button type="button" onclick="exportSirhCsv()" class="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold uppercase hover:opacity-90 transition-all">CSV módulos</button>
        <a href="/pages/sirh.html" class="px-4 py-2 border border-outline-variant rounded-lg text-xs font-bold uppercase hover:bg-surface-container inline-flex items-center">Módulos</a>
        <a href="/pages/gerencia.html" class="px-4 py-2 border border-outline-variant rounded-lg text-xs font-bold uppercase hover:bg-surface-container inline-flex items-center">Tablero</a>
        <a href="/pages/informe.html" class="px-4 py-2 border border-outline-variant rounded-lg text-xs font-bold uppercase hover:bg-surface-container inline-flex items-center">Informe</a>
      </div>
    </div>
  `;
}

export function wireReportsGlobals() {
  Object.assign(window, {
    renderReportsPanel,
    exportSirhCsv,
  });
}
