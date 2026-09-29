/** Shared list/table controls for Operación sections */

const PRIORITY_RANK = {
  Alta: 1,
  Media: 2,
  Estándar: 2,
  Baja: 3,
};

export function priorityRank(value) {
  return PRIORITY_RANK[value] ?? 9;
}

export function toggleSortState(sort, col) {
  if (sort.col === col) {
    sort.dir = sort.dir === 'asc' ? 'desc' : 'asc';
  } else {
    sort.col = col;
    sort.dir = 'asc';
  }
}

export function sortIndicator(sort, col) {
  if (sort.col !== col) return '';
  return sort.dir === 'asc' ? ' ↑' : ' ↓';
}

/**
 * @param {Array} rows - objects with `_index` and fields
 * @param {{col:string,dir:string}} sort
 * @param {Record<string, (row)=> string|number>} getters
 */
export function applySort(rows, sort, getters) {
  const get = getters[sort.col];
  if (!get) return rows;
  const dir = sort.dir === 'desc' ? -1 : 1;
  return [...rows].sort((a, b) => {
    const va = get(a);
    const vb = get(b);
    if (typeof va === 'number' && typeof vb === 'number') {
      return (va - vb) * dir;
    }
    return String(va ?? '').localeCompare(String(vb ?? ''), 'es', { sensitivity: 'base' }) * dir;
  });
}

export function syncViewButtons(prefix, view) {
  const cards = document.getElementById(`btn-${prefix}-cards`);
  const table = document.getElementById(`btn-${prefix}-table`);
  if (cards) {
    const on = view === 'cards';
    cards.classList.toggle('bg-primary', on);
    cards.classList.toggle('text-white', on);
    cards.classList.toggle('text-on-surface-variant', !on);
  }
  if (table) {
    const on = view === 'table';
    table.classList.toggle('bg-primary', on);
    table.classList.toggle('text-white', on);
    table.classList.toggle('text-on-surface-variant', !on);
  }
}

export function toolbarSortTh(label, col, sort, onclickFn) {
  const active = sort.col === col;
  return `<th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest cursor-pointer select-none hover:text-primary transition-colors ${active ? 'text-primary' : 'text-on-surface-variant'}" onclick="${onclickFn}('${col}')">${label}${sortIndicator(sort, col)}</th>`;
}
