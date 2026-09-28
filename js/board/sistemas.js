import { getState } from '../store.js';
import { refreshUI } from './refresh.js';
import { editIndices, selectedModalTeam, selectedTeam, viewState } from './context.js';
import {
  applySort,
  priorityRank,
  syncViewButtons,
  toggleSortState,
  toolbarSortTh,
} from './list-tools.js';

function renderModalTeamSelection() {
    const select = document.getElementById('modal-sys-team-select');
    if (!select) return;

    const currentValue = select.value;
    select.innerHTML = '<option value="">Seleccionar personal...</option>' +
        getState().ranking.map(person =>
            `<option value="${person.name || ''}">${person.name || 'Sin Nombre'} (${person.dept || '-'})</option>`
        ).join('');
    select.value = currentValue;
    renderSelectedModalTeam();
}

function addModalTeamMember() {
    const select = document.getElementById('modal-sys-team-select');
    const name = select.value;
    if (name && !selectedModalTeam.includes(name)) {
        selectedModalTeam.push(name);
        renderSelectedModalTeam();
        select.value = '';
    }
}

function removeModalTeamMember(name) {
    const idx = selectedModalTeam.indexOf(name);
    if (idx >= 0) selectedModalTeam.splice(idx, 1);
    renderSelectedModalTeam();
}

function renderSelectedModalTeam() {
    const container = document.getElementById('modal-sys-team-list');
    if (!container) return;

    if (selectedModalTeam.length === 0) {
        container.innerHTML = '<p class="text-[10px] text-on-surface-variant italic opacity-50">Ningún miembro seleccionado...</p>';
        return;
    }

    container.innerHTML = selectedModalTeam.map(name => `
        <div class="flex items-center gap-2 bg-secondary-container text-on-secondary-container px-3 py-1 rounded-lg shadow-sm">
            <span class="text-[10px] font-bold">${name}</span>
            <button type="button" onclick="removeModalTeamMember('${name}')" class="hover:text-error transition-colors">
                <span class="material-symbols-outlined text-[14px]">close</span>
            </button>
        </div>
    `).join('');
}

function openSystemEditModal(systemName) {
    const systemIndex = getSystemIndexByName(systemName);
    if (systemIndex === -1) return;

    editIndices.modalSistemas = systemIndex;
    const data = getState().sistemas[systemIndex];

    document.getElementById('modal-sys-name').value = data.name;
    document.getElementById('modal-sys-priority').value = data.priority;
    document.getElementById('modal-sys-desc').value = data.desc || '';

    selectedModalTeam.length = 0;
    if (data.team) selectedModalTeam.push(...data.team.split(', '));
    renderModalTeamSelection();

    document.getElementById('system-edit-modal').classList.remove('hidden');
    document.getElementById('modal-sys-name').focus();
}

function closeSystemEditModal() {
    document.getElementById('system-edit-modal').classList.add('hidden');
    document.getElementById('form-modal-sistemas').reset();
    selectedModalTeam.length = 0;
    editIndices.modalSistemas = null;
    renderSelectedModalTeam();
}

function handleSystemClick(systemName) {
    openSystemEditModal(systemName);
}

function getSystemIndexByName(systemName) {
    return getState().sistemas.findIndex(s => s.name === systemName);
}

function renderTeamSelection() {
    const select = document.getElementById('sys-team-select');
    if (!select) return;

    const currentValue = select.value;
    select.innerHTML = '<option value="">Seleccionar personal...</option>' +
        getState().ranking.map(person =>
            `<option value="${person.name}">${person.name} (${person.dept})</option>`
        ).join('');
    select.value = currentValue;
    renderSelectedTeam();
}

function addTeamMember() {
    const select = document.getElementById('sys-team-select');
    const name = select.value;
    if (name && !selectedTeam.includes(name)) {
        selectedTeam.push(name);
        renderSelectedTeam();
        select.value = '';
    }
}

function removeTeamMember(name) {
    const idx = selectedTeam.indexOf(name);
    if (idx >= 0) selectedTeam.splice(idx, 1);
    renderSelectedTeam();
}

function renderSelectedTeam() {
    const container = document.getElementById('sys-team-list');
    if (!container) return;

    if (selectedTeam.length === 0) {
        container.innerHTML = '<p class="text-[10px] text-on-surface-variant italic opacity-50">Ningún miembro seleccionado...</p>';
        return;
    }

    container.innerHTML = selectedTeam.map(name => `
        <div class="flex items-center gap-2 bg-secondary-container text-on-secondary-container px-3 py-1 rounded-lg shadow-sm">
            <span class="text-[10px] font-bold">${name}</span>
            <button type="button" onclick="removeTeamMember('${name}')" class="hover:text-error transition-colors">
                <span class="material-symbols-outlined text-[14px]">close</span>
            </button>
        </div>
    `).join('');
}

function resetSistemasFormEdit() {
    document.getElementById('form-sistemas').reset();
    selectedTeam.length = 0;
    renderSelectedTeam();
    document.getElementById('sys-submit').innerText = 'Guardar Sistema';
    document.getElementById('sys-cancel').classList.add('hidden');
    editIndices.sistemas = null;
}

function getFilteredSistemas() {
    const searchTerm = (document.getElementById('sistemas-search')?.value || '').toLowerCase();
    return getState().sistemas
        .map((s, index) => ({ ...s, _index: index }))
        .filter((s) => {
            if (!searchTerm) return true;
            return (s.name || '').toLowerCase().includes(searchTerm)
                || (s.desc || '').toLowerCase().includes(searchTerm)
                || (s.team || '').toLowerCase().includes(searchTerm)
                || (s.priority || '').toLowerCase().includes(searchTerm);
        });
}

function systemCardHtml(s, index) {
    const colorClass = s.priority === 'Alta' ? 'status-border-error' : (s.priority === 'Media' ? 'status-border-amber' : 'status-border-tertiary');
    return `
        <div class="bg-white border border-outline-variant p-4 rounded-lg shadow-sm ${colorClass} hover:shadow-md transition-all">
            <div class="flex justify-between items-start mb-2">
                <h4 class="font-bold">${s.name || 'Sin Nombre'}</h4>
                <div class="flex gap-2">
                    <button type="button" onclick="prepareEdit('sistemas', ${index})"><span class="material-symbols-outlined text-sm text-on-surface-variant hover:text-primary">edit</span></button>
                    <button type="button" onclick="deleteEntry('sistemas', ${index})"><span class="material-symbols-outlined text-sm text-on-surface-variant hover:text-error">close</span></button>
                </div>
            </div>
            <p class="text-sm text-on-surface-variant mb-4">${s.desc || ''}</p>
            <div class="flex justify-between items-center pt-3 border-t border-outline-variant">
                <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-[14px] text-on-surface-variant">group</span>
                    <span class="text-[10px] text-on-surface-variant font-bold">${s.team || 'Sin Asignar'}</span>
                </div>
                <span class="text-[10px] font-bold uppercase bg-surface-container-high px-2 py-0.5 rounded">${s.priority || 'Baja'}</span>
            </div>
        </div>
    `;
}

function toggleSistemasView(view) {
    viewState.sistemasView = view;
    syncViewButtons('sistemas', view);
    renderSistemas();
}

function toggleSistemasSort(col) {
    toggleSortState(viewState.sistemasSort, col);
    renderSistemas();
}

function renderSistemas() {
    const cardsView = document.getElementById('sistemas-cards-view');
    const tableView = document.getElementById('sistemas-table-view');
    const filtered = getFilteredSistemas();
    const view = viewState.sistemasView || 'cards';
    syncViewButtons('sistemas', view);

    if (cardsView) cardsView.classList.toggle('hidden', view !== 'cards');
    if (tableView) tableView.classList.toggle('hidden', view !== 'table');

    if (view === 'table') {
        const sort = viewState.sistemasSort;
        const rows = applySort(filtered, sort, {
            name: (r) => r.name || '',
            priority: (r) => priorityRank(r.priority),
            team: (r) => r.team || '',
            desc: (r) => r.desc || '',
        });
        const head = document.getElementById('sistemas-table-head');
        const body = document.getElementById('sistemas-table-body');
        if (head) {
            head.innerHTML = `
                ${toolbarSortTh('Sistema', 'name', sort, 'toggleSistemasSort')}
                ${toolbarSortTh('Prioridad', 'priority', sort, 'toggleSistemasSort')}
                ${toolbarSortTh('Equipo', 'team', sort, 'toggleSistemasSort')}
                ${toolbarSortTh('Descripción', 'desc', sort, 'toggleSistemasSort')}
                <th class="px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest text-right">Gestión</th>
            `;
        }
        if (body) {
            body.innerHTML = rows.map((s) => `
                <tr class="hover:bg-surface-container-low transition-colors">
                    <td class="px-6 py-4 font-bold text-sm">${s.name || 'Sin Nombre'}</td>
                    <td class="px-6 py-4"><span class="text-[10px] font-bold uppercase bg-surface-container-high px-2 py-0.5 rounded">${s.priority || 'Baja'}</span></td>
                    <td class="px-6 py-4 text-xs text-on-surface-variant font-bold">${s.team || 'Sin Asignar'}</td>
                    <td class="px-6 py-4 text-sm text-on-surface-variant">${s.desc || ''}</td>
                    <td class="px-6 py-4 text-right">
                        <div class="flex justify-end gap-2">
                            <button type="button" onclick="prepareEdit('sistemas', ${s._index})" class="p-1 hover:bg-surface-container rounded-lg"><span class="material-symbols-outlined text-sm text-on-surface-variant hover:text-primary">edit</span></button>
                            <button type="button" onclick="deleteEntry('sistemas', ${s._index})" class="p-1 hover:bg-surface-container rounded-lg"><span class="material-symbols-outlined text-sm text-on-surface-variant hover:text-error">close</span></button>
                        </div>
                    </td>
                </tr>
            `).join('') || '<tr><td colspan="5" class="px-6 py-10 text-center italic opacity-50">Sin sistemas</td></tr>';
        }
        return;
    }

    const columns = {
        Alta: document.getElementById('kanban-alta'),
        Media: document.getElementById('kanban-media'),
        Baja: document.getElementById('kanban-baja'),
    };
    Object.values(columns).forEach((c) => { if (c) c.innerHTML = ''; });

    filtered.forEach((s) => {
        const card = systemCardHtml(s, s._index);
        if (columns[s.priority]) columns[s.priority].insertAdjacentHTML('beforeend', card);
        else if (columns.Baja) columns.Baja.insertAdjacentHTML('beforeend', card);
    });
}

export function initSistemasForms() {
    document.getElementById('form-sistemas').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('sys-name').value;
        const priority = document.getElementById('sys-priority').value;
        const desc = document.getElementById('sys-desc').value;
        if (selectedTeam.length === 0) {
            alert('Por favor, asigne al menos un miembro al equipo.');
            return;
        }
        const team = selectedTeam.join(', ');
        if (editIndices.sistemas !== null) {
            getState().sistemas[editIndices.sistemas] = { name, priority, team, desc };
            resetSistemasFormEdit();
        } else {
            getState().sistemas.push({ name, priority, team, desc });
            e.target.reset();
            selectedTeam.length = 0;
            renderSelectedTeam();
        }
        refreshUI();
    });

    document.getElementById('form-modal-sistemas').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('modal-sys-name').value;
        const priority = document.getElementById('modal-sys-priority').value;
        const desc = document.getElementById('modal-sys-desc').value;
        if (selectedModalTeam.length === 0) {
            alert('Por favor, asigne al menos un miembro al equipo.');
            return;
        }
        const team = selectedModalTeam.join(', ');
        if (editIndices.modalSistemas !== null) {
            getState().sistemas[editIndices.modalSistemas] = { name, priority, team, desc };
        }
        refreshUI();
        closeSystemEditModal();
    });

    document.getElementById('sistemas-search')?.addEventListener('input', renderSistemas);
}

export {
    renderModalTeamSelection, addModalTeamMember, removeModalTeamMember, renderSelectedModalTeam,
    openSystemEditModal, closeSystemEditModal, handleSystemClick,
    renderTeamSelection, addTeamMember, removeTeamMember, renderSelectedTeam,
    renderSistemas, getSystemIndexByName,
    toggleSistemasView, toggleSistemasSort,
};
