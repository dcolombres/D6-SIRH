import { getState } from '../store.js';
import { calculateWorkload, getManagedProviders } from '../metrics.js';
import { getPriorityClass } from '../utils.js';
import { viewState } from './context.js';
import {
  applySort,
  syncViewButtons,
  toggleSortState,
  toolbarSortTh,
} from './list-tools.js';

function toggleAsignacionSort(col = 'workload') {
  toggleSortState(viewState.asignacionSort, col);
  renderAsignacion();
}

function toggleAsignacionView(view) {
  viewState.asignacionView = view;
  syncViewButtons('asignacion', view);
  renderAsignacion();
}

function renderAsignacion() {
  const container = document.getElementById('matrix-personnel-systems');
  if (!container) return;

  const asignacionSearchTerm = (document.getElementById('asignacion-search')?.value || '').toLowerCase();
  const view = viewState.asignacionView || 'cards';
  syncViewButtons('asignacion', view);

  if (getState().ranking.length === 0) {
    container.className = 'col-span-full';
    container.innerHTML = '<div class="py-20 text-center opacity-40"><span class="material-symbols-outlined text-6xl mb-4">person_off</span><p class="text-xl font-bold">No hay personal registrado</p></div>';
    return;
  }

  const priorityOrder = { Alta: 1, Media: 2, Baja: 3 };
  let personnelData = getState().ranking.map((p, index) => {
    const assigned = getState().sistemas.filter((s) => s.team && s.team.split(', ').includes(p.name || ''));
    assigned.sort((a, b) => (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4));
    return {
      ...p,
      _index: index,
      workload: calculateWorkload(getState(), p.name).total,
      assigned,
      managedProviders: getManagedProviders(getState(), p.name || ''),
    };
  });

  personnelData = personnelData.filter((person) =>
    (person.name || '').toLowerCase().includes(asignacionSearchTerm)
    || (person.dept || '').toLowerCase().includes(asignacionSearchTerm)
    || person.assigned.some((sys) => (sys.name || '').toLowerCase().includes(asignacionSearchTerm))
    || person.managedProviders.some((pr) => (pr.name || '').toLowerCase().includes(asignacionSearchTerm)),
  );

  personnelData = applySort(personnelData, viewState.asignacionSort, {
    name: (r) => r.name || '',
    dept: (r) => r.dept || '',
    systems: (r) => r.assigned.length,
    providers: (r) => r.managedProviders.length,
    workload: (r) => r.workload || 0,
  });

  if (view === 'cards') {
    container.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';
    container.innerHTML = personnelData.map((person) => {
      const workloadColor = (person.workload || 0) > 60 ? 'text-error' : ((person.workload || 0) > 30 ? 'text-amber-600' : 'text-emerald-600');
      return `
        <div class="bg-white border border-outline-variant rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
          <div class="relative z-10">
            <div class="flex items-center gap-3 mb-4">
              <div class="flex-1">
                <h4 class="font-bold text-lg leading-tight">${person.name || 'Sin Nombre'}</h4>
                <div class="flex justify-between items-center">
                  <p class="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">${person.dept || '-'}</p>
                  <span class="text-[10px] font-bold ${workloadColor}">Carga: ${person.workload || 0} pts</span>
                </div>
              </div>
            </div>
            <div class="space-y-3">
              <div class="flex justify-between items-center border-b border-outline-variant/30 pb-2">
                <span class="text-[10px] font-bold text-on-surface-variant uppercase">Sistemas Asignados</span>
                <span class="px-2 py-0.5 bg-surface-container-high text-[10px] font-bold rounded-full">${person.assigned.length}</span>
              </div>
              <div class="flex flex-col gap-2">
                ${person.assigned.map((sys) => {
                  const pClass = getPriorityClass(sys.priority);
                  return `
                    <div class="flex items-center gap-2 p-2 rounded-lg ${pClass} border cursor-pointer hover:shadow-sm transition-all" onclick="handleSystemClick('${sys.name || ''}')">
                      <div class="w-1.5 h-6 rounded-full bg-current opacity-40 mr-1"></div>
                      <span class="text-xs font-bold truncate flex-1">${sys.name || 'Sin Nombre'}</span>
                    </div>
                  `;
                }).join('') || '<p class="text-[10px] italic text-on-surface-variant opacity-50 py-2">Sin sistemas asignados</p>'}
              </div>
              <div class="flex justify-between items-center border-b border-outline-variant/30 pb-2 pt-2">
                <span class="text-[10px] font-bold text-on-surface-variant uppercase">Proveedores Gestionados</span>
                <span class="px-2 py-0.5 bg-surface-container-high text-[10px] font-bold rounded-full">${person.managedProviders.length}</span>
              </div>
              <div class="flex flex-wrap gap-2">
                ${person.managedProviders.map((pr) => `
                  <span class="px-2 py-1 bg-secondary-container text-on-secondary-container border border-outline-variant/30 rounded-lg text-[10px] font-bold cursor-pointer hover:brightness-95 transition-all" onclick="switchSection('proveedores')">${pr.name || 'Sin Nombre'}</span>
                `).join('') || '<p class="text-[10px] italic text-on-surface-variant opacity-50 py-1">Sin proveedores asignados</p>'}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
    return;
  }

  const sort = viewState.asignacionSort;
  container.className = 'col-span-full bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm';
  container.innerHTML = `
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead class="bg-surface-container-low border-b border-outline-variant">
          <tr>
            ${toolbarSortTh('Persona', 'name', sort, 'toggleAsignacionSort')}
            ${toolbarSortTh('Rol', 'dept', sort, 'toggleAsignacionSort')}
            ${toolbarSortTh('Sistemas', 'systems', sort, 'toggleAsignacionSort')}
            ${toolbarSortTh('Proveedores', 'providers', sort, 'toggleAsignacionSort')}
            ${toolbarSortTh('Carga', 'workload', sort, 'toggleAsignacionSort')}
          </tr>
        </thead>
        <tbody class="divide-y divide-outline-variant/30">
          ${personnelData.map((person) => `
            <tr class="hover:bg-surface-container-lowest transition-colors">
              <td class="px-6 py-4 font-bold text-sm">${person.name || 'Sin Nombre'}</td>
              <td class="px-6 py-4 text-xs uppercase font-bold text-on-surface-variant opacity-70">${person.dept || '-'}</td>
              <td class="px-6 py-4">
                <div class="flex flex-wrap gap-1">
                  ${person.assigned.map((s) => {
                    const pClass = getPriorityClass(s.priority);
                    return `<span class="px-2 py-0.5 ${pClass} border rounded text-[9px] font-bold cursor-pointer hover:brightness-95 transition-all" onclick="handleSystemClick('${s.name || ''}')">${s.name || 'Sin Nombre'}</span>`;
                  }).join('') || '-'}
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex flex-wrap gap-1">
                  ${person.managedProviders.map((pr) => `<span class="px-2 py-0.5 bg-secondary-container text-on-secondary-container border border-outline-variant/30 rounded text-[9px] font-bold cursor-pointer hover:brightness-95 transition-all" onclick="switchSection('proveedores')">${pr.name || 'Sin Nombre'}</span>`).join('') || '-'}
                </div>
              </td>
              <td class="px-6 py-4 text-right font-data font-bold text-sm ${(person.workload || 0) > 60 ? 'text-error' : 'text-primary'}">${person.workload || 0}</td>
            </tr>
          `).join('') || '<tr><td colspan="5" class="px-6 py-10 text-center italic opacity-50">Sin personal asignado</td></tr>'}
        </tbody>
      </table>
    </div>
  `;
}

export { toggleAsignacionSort, toggleAsignacionView, renderAsignacion, initAsignacionListeners };

function initAsignacionListeners() {
  document.getElementById('asignacion-search')?.addEventListener('input', renderAsignacion);
}
