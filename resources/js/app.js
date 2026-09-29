import './bootstrap';
import Alpine from 'alpinejs';
import Chart from 'chart.js/auto';

window.Chart = Chart;
window.Alpine = Alpine;

function csrf() {
  return document.querySelector('meta[name="csrf-token"]')?.content || '';
}

async function api(url, options = {}) {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-CSRF-TOKEN': csrf(),
      'X-Requested-With': 'XMLHttpRequest',
      ...(options.headers || {}),
    },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || res.statusText);
  return data;
}

function areaLabel(id, catalogs) {
  return catalogs?.areas?.find((a) => a.id === id)?.label || id;
}

function parsePeople(raw) {
  return String(raw || '').split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
}

window.modulosApp = function (rows, catalogs, initialArea) {
  return {
    rows,
    catalogs,
    view: 'modulos',
    q: '',
    area: initialArea || '',
    activo: '1',
    modal: false,
    form: {},
    add: { modId: '', name: '', rol: 'equipo' },
    addProv: { modId: '', name: '' },
    init() {},
    areaLabel(id) { return areaLabel(id, this.catalogs); },
    get filtered() {
      const q = this.q.toLowerCase().trim();
      return this.rows.filter((r) => {
        if (this.area && r.area !== this.area) return false;
        if (this.activo === '1' && Number(r.activo) === 0) return false;
        if (this.activo === '0' && Number(r.activo) !== 0) return false;
        if (!q) return true;
        return [r.modulo, r.descripcion, r.responsable, r.proveedor, r.equipo].join(' ').toLowerCase().includes(q);
      });
    },
    get teamAgg() {
      const map = new Map();
      const add = (name, role, mod) => {
        if (!name) return;
        const key = name.toLowerCase();
        if (!map.has(key)) map.set(key, { name, roles: new Set(), modules: [] });
        const e = map.get(key);
        e.roles.add(role);
        if (!e.modules.some((m) => m.id === mod.id)) e.modules.push({ id: mod.id, modulo: mod.modulo });
      };
      this.rows.filter((r) => Number(r.activo) !== 0).forEach((r) => {
        add(String(r.responsable || '').trim(), 'Responsable', r);
        parsePeople(r.equipo).forEach((p) => add(p, 'Equipo', r));
      });
      return [...map.values()].map((e) => ({ ...e, roles: [...e.roles] })).sort((a, b) => a.name.localeCompare(b.name, 'es'));
    },
    get provAgg() {
      const map = new Map();
      this.rows.filter((r) => Number(r.activo) !== 0 && r.proveedor).forEach((r) => {
        const name = String(r.proveedor).trim();
        const key = name.toLowerCase();
        if (!map.has(key)) map.set(key, { name, modules: [] });
        const e = map.get(key);
        if (!e.modules.some((m) => m.id === r.id)) e.modules.push({ id: r.id, modulo: r.modulo });
      });
      return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'));
    },
    openForm(row) {
      this.form = row ? { ...row, activoBool: Number(row.activo) !== 0 } : {
        id: null, modulo: '', descripcion: '', area: 'gestion', estado: 'Planificado',
        prioridad: 'Media', riesgo: 'Medio', avance: 0, responsable: '', proveedor: '',
        equipo: '', activoBool: true, orden: 0, icono: 'view_module', fase: '',
      };
      this.modal = true;
    },
    async save() {
      const payload = { ...this.form, activo: this.form.activoBool ? 1 : 0 };
      delete payload.activoBool;
      const res = await api('/api/sirh/modulos', { method: 'POST', body: JSON.stringify(payload) });
      const idx = this.rows.findIndex((r) => r.id === res.row.id);
      if (idx >= 0) this.rows[idx] = res.row; else this.rows.push(res.row);
      this.modal = false;
    },
    async toggleActivo(r) {
      const res = await api('/api/sirh/modulos', {
        method: 'POST',
        body: JSON.stringify({ ...r, activo: Number(r.activo) === 0 ? 1 : 0 }),
      });
      const idx = this.rows.findIndex((x) => x.id === r.id);
      if (idx >= 0) this.rows[idx] = res.row;
    },
    async remove(r) {
      if (!confirm('¿Eliminar este módulo?')) return;
      await api(`/api/sirh/modulos/${r.id}`, { method: 'DELETE' });
      this.rows = this.rows.filter((x) => x.id !== r.id);
    },
    async addPerson() {
      const row = this.rows.find((r) => Number(r.id) === Number(this.add.modId));
      if (!row || !this.add.name.trim()) return;
      let payload = { ...row };
      if (this.add.rol === 'responsable') payload.responsable = this.add.name.trim();
      else {
        const people = parsePeople(row.equipo);
        if (people.some((p) => p.toLowerCase() === this.add.name.trim().toLowerCase())) return alert('Ya está en el equipo');
        payload.equipo = [...people, this.add.name.trim()].join('\n');
      }
      const res = await api('/api/sirh/modulos', { method: 'POST', body: JSON.stringify(payload) });
      const idx = this.rows.findIndex((x) => x.id === row.id);
      if (idx >= 0) this.rows[idx] = res.row;
      this.add.name = '';
    },
    async addProvider() {
      const row = this.rows.find((r) => Number(r.id) === Number(this.addProv.modId));
      if (!row || !this.addProv.name.trim()) return;
      const res = await api('/api/sirh/modulos', {
        method: 'POST',
        body: JSON.stringify({ ...row, proveedor: this.addProv.name.trim() }),
      });
      const idx = this.rows.findIndex((x) => x.id === row.id);
      if (idx >= 0) this.rows[idx] = res.row;
      this.addProv.name = '';
    },
  };
};

window.tableroApp = function (rows, catalogs) {
  return {
    rows,
    catalogs,
    q: '', estado: '', prioridad: '', area: '', riesgo: '',
    charts: { estado: null, avance: null },
    init() { this.$watch('filtered', () => this.renderCharts(), { deep: true }); this.renderCharts(); },
    areaLabel(id) { return areaLabel(id, this.catalogs); },
    reset() { this.q = ''; this.estado = ''; this.prioridad = ''; this.area = ''; this.riesgo = ''; },
    get filtered() {
      const q = this.q.toLowerCase().trim();
      return this.rows.filter((r) => {
        if (this.estado && r.estado !== this.estado) return false;
        if (this.prioridad && r.prioridad !== this.prioridad) return false;
        if (this.area && r.area !== this.area) return false;
        if (this.riesgo && r.riesgo !== this.riesgo) return false;
        if (!q) return true;
        return [r.modulo, r.responsable, r.proveedor, r.equipo].join(' ').toLowerCase().includes(q);
      });
    },
    get kpis() {
      const list = this.filtered;
      const n = list.length || 1;
      const avance = Math.round(list.reduce((s, r) => s + Number(r.avance || 0), 0) / n);
      const riesgoAlto = list.filter((r) => String(r.riesgo).toLowerCase() === 'alto').length;
      return [
        { label: 'Módulos', value: list.length },
        { label: 'Avance medio', value: `${list.length ? avance : 0}%` },
        { label: 'Riesgo alto', value: riesgoAlto },
        { label: 'Filtrados', value: list.length },
      ];
    },
    renderCharts() {
      const byEstado = {};
      this.filtered.forEach((r) => { byEstado[r.estado] = (byEstado[r.estado] || 0) + 1; });
      const elE = document.getElementById('tablero-chart-estado');
      const elA = document.getElementById('tablero-chart-avance');
      if (!elE || !elA) return;
      this.charts.estado?.destroy();
      this.charts.avance?.destroy();
      this.charts.estado = new Chart(elE, {
        type: 'doughnut',
        data: { labels: Object.keys(byEstado), datasets: [{ data: Object.values(byEstado) }] },
        options: { plugins: { legend: { position: 'bottom' } } },
      });
      const top = [...this.filtered].sort((a, b) => b.avance - a.avance).slice(0, 12);
      this.charts.avance = new Chart(elA, {
        type: 'bar',
        data: { labels: top.map((r) => r.modulo), datasets: [{ label: 'Avance %', data: top.map((r) => r.avance) }] },
        options: { indexAxis: 'y', scales: { x: { max: 100 } }, plugins: { legend: { display: false } } },
      });
    },
  };
};

window.adminApp = function () {
  return {
    msg: '',
    async exportBackup() {
      const data = await api('/api/sirh/backup');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `d6_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      this.msg = 'Paquete exportado.';
    },
    async importBackup(ev) {
      const file = ev.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      const payload = JSON.parse(text);
      await api('/api/sirh/backup', { method: 'POST', body: JSON.stringify(payload) });
      this.msg = 'Import aplicado. Recargá la página.';
      ev.target.value = '';
    },
    async undoImport() {
      await api('/api/sirh/undo-import', { method: 'POST', body: '{}' });
      this.msg = 'Import deshecho. Recargá la página.';
    },
  };
};

document.addEventListener('DOMContentLoaded', () => {
  const hoy = window.__D6_HOY__;
  if (hoy?.byEstado) {
    const el = document.getElementById('chart-estado');
    if (el) {
      new Chart(el, {
        type: 'doughnut',
        data: { labels: Object.keys(hoy.byEstado), datasets: [{ data: Object.values(hoy.byEstado) }] },
        options: { plugins: { legend: { position: 'bottom' } } },
      });
    }
  }
});

Alpine.start();
