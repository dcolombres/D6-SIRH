import { getState } from '../store.js';
import { getAverageScore } from '../metrics.js';
import { viewState } from './context.js';
import {
  applySort,
  syncViewButtons,
  toggleSortState,
  toolbarSortTh,
} from './list-tools.js';

function toggleRankingView(view) {
  viewState.rankingView = view;
  syncViewButtons('ranking', view);
  renderRanking();
}

function toggleRankingSort(col) {
  toggleSortState(viewState.rankingSort, col);
  renderRanking();
}

function renderRanking() {
  const list = document.getElementById('list-ranking');
  if (!list) return;

  const searchTerm = (document.getElementById('ranking-search')?.value || '').toLowerCase();
  const view = viewState.rankingView || 'table';
  syncViewButtons('ranking', view);

  let rows = getState().ranking
    .map((r, index) => ({
      ...r,
      _index: index,
      _score: getAverageScore(r),
    }))
    .filter((r) => {
      if (!searchTerm) return true;
      return (r.name || '').toLowerCase().includes(searchTerm)
        || (r.dept || '').toLowerCase().includes(searchTerm);
    });

  rows = applySort(rows, viewState.rankingSort, {
    name: (r) => r.name || '',
    dept: (r) => r.dept || '',
    score: (r) => r._score,
    compromiso: (r) => Number(r.compromiso) || 0,
    respuesta: (r) => Number(r.respuesta) || 0,
    capacidad: (r) => Number(r.capacidad) || 0,
    conocimiento: (r) => Number(r.conocimiento) || 0,
  });

  if (view === 'cards') {
    list.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter mb-12';
    list.innerHTML = rows.map((r, i) => {
      const avg = r._score;
      return `
        <div class="group bg-white border border-outline-variant rounded-xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
          <div class="flex justify-between items-start mb-4 gap-3">
            <div class="min-w-0">
              <span class="${i === 0 ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface'} w-7 h-7 inline-flex items-center justify-center rounded-full font-bold font-data text-[10px] mb-2">#${i + 1}</span>
              <h4 class="font-bold text-base truncate group-hover:text-primary transition-colors">${r.name || 'Sin Nombre'}</h4>
              <p class="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-0.5">${r.dept || '-'}</p>
            </div>
            <div class="circular-progress w-12 h-12 rounded-full relative shrink-0" style="--progress: ${avg};">
              <div class="absolute inset-0 flex items-center justify-center font-data font-bold text-[11px]">${avg}</div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2 mb-4 text-[10px] font-bold uppercase">
            <span>C <span class="font-data text-category-c-blue">${r.compromiso || 0}</span></span>
            <span>R <span class="font-data text-category-r-orange">${r.respuesta || 0}</span></span>
            <span>Ca <span class="font-data text-category-ca-green">${r.capacidad || 0}</span></span>
            <span>Co <span class="font-data text-category-co-violet">${r.conocimiento || 0}</span></span>
          </div>
          <div class="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button type="button" class="p-1 hover:bg-surface-container rounded-lg" onclick="prepareEdit('ranking', ${r._index})">
              <span class="material-symbols-outlined text-[18px] text-on-surface-variant hover:text-primary">edit</span>
            </button>
            <button type="button" class="p-1 hover:bg-surface-container rounded-lg" onclick="deleteEntry('ranking', ${r._index})">
              <span class="material-symbols-outlined text-[18px] text-on-surface-variant hover:text-error">delete</span>
            </button>
          </div>
        </div>
      `;
    }).join('') || '<div class="col-span-full py-10 text-center opacity-40 italic">Sin personal registrado</div>';
    return;
  }

  const sort = viewState.rankingSort;
  list.className = 'bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm mb-12';
  list.innerHTML = `
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead class="bg-surface-container-low border-b border-outline-variant">
          <tr>
            <th class="px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">#</th>
            ${toolbarSortTh('Miembro', 'name', sort, 'toggleRankingSort')}
            ${toolbarSortTh('Rol', 'dept', sort, 'toggleRankingSort')}
            ${toolbarSortTh('C', 'compromiso', sort, 'toggleRankingSort')}
            ${toolbarSortTh('R', 'respuesta', sort, 'toggleRankingSort')}
            ${toolbarSortTh('Ca', 'capacidad', sort, 'toggleRankingSort')}
            ${toolbarSortTh('Co', 'conocimiento', sort, 'toggleRankingSort')}
            ${toolbarSortTh('Score', 'score', sort, 'toggleRankingSort')}
            <th class="px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest text-right">Gestión</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-outline-variant/30">
          ${rows.map((r, i) => {
            const avg = r._score;
            return `
              <tr class="hover:bg-surface-container-low transition-colors group">
                <td class="px-6 py-4">
                  <span class="${i === 0 ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface'} w-8 h-8 inline-flex items-center justify-center rounded-full font-bold font-data text-xs">${i + 1}</span>
                </td>
                <td class="px-6 py-4 font-bold text-sm">${r.name || 'Sin Nombre'}</td>
                <td class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">${r.dept || '-'}</td>
                <td class="px-6 py-4 font-data text-xs">${r.compromiso || 0}</td>
                <td class="px-6 py-4 font-data text-xs">${r.respuesta || 0}</td>
                <td class="px-6 py-4 font-data text-xs">${r.capacidad || 0}</td>
                <td class="px-6 py-4 font-data text-xs">${r.conocimiento || 0}</td>
                <td class="px-6 py-4">
                  <div class="circular-progress w-10 h-10 rounded-full relative mx-auto" style="--progress: ${avg};">
                    <div class="absolute inset-0 flex items-center justify-center font-data font-bold text-[10px]">${avg}</div>
                  </div>
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex justify-end gap-2">
                    <button type="button" class="text-on-surface-variant hover:text-primary transition-all" onclick="prepareEdit('ranking', ${r._index})">
                      <span class="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <button type="button" class="text-on-surface-variant hover:text-error transition-all" onclick="deleteEntry('ranking', ${r._index})">
                      <span class="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            `;
          }).join('') || '<tr><td colspan="9" class="px-6 py-10 text-center italic opacity-50">Sin personal registrado</td></tr>'}
        </tbody>
      </table>
    </div>
  `;
}

function initRankingListeners() {
  document.getElementById('ranking-search')?.addEventListener('input', renderRanking);
}

export { renderRanking, initRankingListeners, toggleRankingView, toggleRankingSort };
