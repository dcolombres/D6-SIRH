import { getState, persistState } from '../store.js';
import { refreshUI } from './refresh.js';
import {
    editIndices, getCurrentProviderIndex, setCurrentProviderIndex,
    selectedProviderTeam, selectedProviderSystems, selectedProviderIncidents,
    viewState,
} from './context.js';
import {
    applySort,
    syncViewButtons,
    toggleSortState,
    toolbarSortTh,
} from './list-tools.js';

function toggleProveedoresView(view) {
    viewState.proveedoresView = view;
    syncViewButtons('proveedores', view);
    renderProveedores();
}

function toggleProveedoresSort(col) {
    toggleSortState(viewState.proveedoresSort, col);
    renderProveedores();
}

function providerMetrics(p) {
    const tasks = Array.isArray(p.tasks) ? p.tasks : [];
    const pending = tasks.filter((t) => !t.done);
    return {
        tasks,
        pending,
        pendingHigh: pending.filter((t) => t.priority === 'Alta').length,
        pendingMid: pending.filter((t) => t.priority === 'Media').length,
        pendingLow: pending.filter((t) => t.priority === 'Baja').length,
        linkedSystemsCount: p.linkedSystems ? p.linkedSystems.split(', ').filter(Boolean).length : 0,
        linkedIncidentsCount: p.linkedIncidents ? p.linkedIncidents.split(', ').filter(Boolean).length : 0,
        teamTags: p.team ? p.team.split(', ').filter(Boolean) : [],
    };
}

function providerCardHtml(p, index, m) {
    const statusBadge = p.status === 'Inactivo'
        ? '<span class="px-2 py-0.5 bg-surface-container-high text-on-surface-variant text-[10px] font-bold rounded-full uppercase">Inactivo</span>'
        : '<span class="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase">Activo</span>';

    return `
        <div class="bg-white border border-outline-variant p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col gap-3">
            <div class="flex justify-between items-start gap-2">
                <div>
                    <h4 class="font-bold leading-tight">${p.name || 'Sin Nombre'}</h4>
                    <p class="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">${p.rubro || 'Sin Rubro'}</p>
                </div>
                ${statusBadge}
            </div>
            <div class="text-[11px] text-on-surface-variant space-y-0.5">
                ${p.contactPerson ? `<p class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">person</span>${p.contactPerson}</p>` : ''}
                ${p.email ? `<p class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">mail</span>${p.email}</p>` : ''}
                ${p.phone ? `<p class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">call</span>${p.phone}</p>` : ''}
            </div>
            <div class="flex flex-wrap gap-1">
                ${m.teamTags.map((n) => `<span class="px-2 py-0.5 bg-secondary-container text-on-secondary-container text-[9px] font-bold rounded">${n}</span>`).join('') || '<span class="text-[10px] italic text-on-surface-variant opacity-50">Sin responsable interno</span>'}
            </div>
            <div class="grid grid-cols-3 gap-2 text-center py-2 border-y border-outline-variant/30">
                <div>
                    <p class="text-[9px] font-bold text-on-surface-variant uppercase">Sistemas</p>
                    <p class="font-bold font-data text-sm">${m.linkedSystemsCount}</p>
                </div>
                <div>
                    <p class="text-[9px] font-bold text-on-surface-variant uppercase">Incidencias</p>
                    <p class="font-bold font-data text-sm">${m.linkedIncidentsCount}</p>
                </div>
                <div>
                    <p class="text-[9px] font-bold text-on-surface-variant uppercase">Tareas</p>
                    <p class="font-bold font-data text-sm">${m.pending.length}</p>
                </div>
            </div>
            <div class="flex gap-1 flex-wrap">
                ${m.pendingHigh > 0 ? `<span class="px-2 py-0.5 bg-red-100 text-red-700 text-[9px] font-bold rounded-full">${m.pendingHigh} Alta</span>` : ''}
                ${m.pendingMid > 0 ? `<span class="px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-bold rounded-full">${m.pendingMid} Media</span>` : ''}
                ${m.pendingLow > 0 ? `<span class="px-2 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold rounded-full">${m.pendingLow} Baja</span>` : ''}
                ${m.pending.length === 0 ? '<span class="text-[10px] italic text-on-surface-variant opacity-50">Sin tareas pendientes</span>' : ''}
            </div>
            <div class="flex justify-end gap-2 pt-2 border-t border-outline-variant/30 no-print">
                <button type="button" onclick="prepareEdit('proveedores', ${index})" class="p-1.5 hover:bg-surface-container rounded-lg transition-colors" title="Editar datos"><span class="material-symbols-outlined text-sm text-on-surface-variant hover:text-primary">edit</span></button>
                <button type="button" onclick="openProviderModal(${index})" class="p-1.5 hover:bg-surface-container rounded-lg transition-colors" title="Gestionar vínculos y tareas"><span class="material-symbols-outlined text-sm text-on-surface-variant hover:text-primary">tune</span></button>
                <button type="button" onclick="deleteEntry('proveedores', ${index})" class="p-1.5 hover:bg-surface-container rounded-lg transition-colors" title="Eliminar"><span class="material-symbols-outlined text-sm text-on-surface-variant hover:text-error">delete</span></button>
            </div>
        </div>
    `;
}

function renderProveedores() {
    const container = document.getElementById('list-proveedores');
    if (!container) return;

    const searchTerm = (document.getElementById('proveedores-search')?.value || '').toLowerCase();
    const view = viewState.proveedoresView || 'cards';
    syncViewButtons('proveedores', view);

    if (getState().proveedores.length === 0) {
        container.className = '';
        container.innerHTML = '<div class="py-20 text-center opacity-40"><span class="material-symbols-outlined text-6xl mb-4">handshake</span><p class="text-xl font-bold">No hay proveedores registrados</p></div>';
        return;
    }

    let rows = getState().proveedores
        .map((p, index) => {
            const m = providerMetrics(p);
            return { ...p, _index: index, ...m };
        })
        .filter((p) => {
            if (!searchTerm) return true;
            return (p.name || '').toLowerCase().includes(searchTerm)
                || (p.rubro || '').toLowerCase().includes(searchTerm)
                || (p.contactPerson || '').toLowerCase().includes(searchTerm)
                || (p.status || '').toLowerCase().includes(searchTerm)
                || (p.team || '').toLowerCase().includes(searchTerm)
                || (p.email || '').toLowerCase().includes(searchTerm);
        });

    rows = applySort(rows, viewState.proveedoresSort, {
        name: (r) => r.name || '',
        rubro: (r) => r.rubro || '',
        status: (r) => r.status || '',
        contact: (r) => r.contactPerson || '',
        team: (r) => r.team || '',
        systems: (r) => r.linkedSystemsCount,
        incidents: (r) => r.linkedIncidentsCount,
        tasks: (r) => r.pending.length,
    });

    if (view === 'table') {
        const sort = viewState.proveedoresSort;
        container.className = 'bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm mb-12';
        container.innerHTML = `
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-surface-container-low border-b border-outline-variant">
                        <tr>
                            ${toolbarSortTh('Proveedor', 'name', sort, 'toggleProveedoresSort')}
                            ${toolbarSortTh('Rubro', 'rubro', sort, 'toggleProveedoresSort')}
                            ${toolbarSortTh('Estado', 'status', sort, 'toggleProveedoresSort')}
                            ${toolbarSortTh('Contacto', 'contact', sort, 'toggleProveedoresSort')}
                            ${toolbarSortTh('Equipo', 'team', sort, 'toggleProveedoresSort')}
                            ${toolbarSortTh('Sistemas', 'systems', sort, 'toggleProveedoresSort')}
                            ${toolbarSortTh('Incidencias', 'incidents', sort, 'toggleProveedoresSort')}
                            ${toolbarSortTh('Tareas', 'tasks', sort, 'toggleProveedoresSort')}
                            <th class="px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest text-right">Gestión</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-outline-variant/30">
                        ${rows.map((p) => {
                            const statusBadge = p.status === 'Inactivo'
                                ? '<span class="px-2 py-0.5 bg-surface-container-high text-on-surface-variant text-[10px] font-bold rounded-full uppercase">Inactivo</span>'
                                : '<span class="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase">Activo</span>';
                            return `
                                <tr class="hover:bg-surface-container-low transition-colors">
                                    <td class="px-6 py-4 font-bold text-sm">${p.name || 'Sin Nombre'}</td>
                                    <td class="px-6 py-4 text-xs text-on-surface-variant font-bold">${p.rubro || '—'}</td>
                                    <td class="px-6 py-4">${statusBadge}</td>
                                    <td class="px-6 py-4 text-xs text-on-surface-variant">${p.contactPerson || '—'}</td>
                                    <td class="px-6 py-4 text-xs">${p.teamTags.join(', ') || '—'}</td>
                                    <td class="px-6 py-4 font-data text-sm">${p.linkedSystemsCount}</td>
                                    <td class="px-6 py-4 font-data text-sm">${p.linkedIncidentsCount}</td>
                                    <td class="px-6 py-4 font-data text-sm">${p.pending.length}</td>
                                    <td class="px-6 py-4 text-right">
                                        <div class="flex justify-end gap-1">
                                            <button type="button" onclick="prepareEdit('proveedores', ${p._index})" class="p-1.5 hover:bg-surface-container rounded-lg" title="Editar"><span class="material-symbols-outlined text-sm text-on-surface-variant hover:text-primary">edit</span></button>
                                            <button type="button" onclick="openProviderModal(${p._index})" class="p-1.5 hover:bg-surface-container rounded-lg" title="Vínculos y tareas"><span class="material-symbols-outlined text-sm text-on-surface-variant hover:text-primary">tune</span></button>
                                            <button type="button" onclick="deleteEntry('proveedores', ${p._index})" class="p-1.5 hover:bg-surface-container rounded-lg" title="Eliminar"><span class="material-symbols-outlined text-sm text-on-surface-variant hover:text-error">delete</span></button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('') || '<tr><td colspan="9" class="px-6 py-10 text-center italic opacity-50">Sin resultados para la búsqueda.</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;
        return;
    }

    container.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter mb-12';
    container.innerHTML = rows.map((p) => providerCardHtml(p, p._index, p)).join('')
        || '<div class="col-span-full py-10 text-center italic opacity-50">Sin resultados para la búsqueda.</div>';
}

// --- PROVEEDORES: MODAL DE GESTIÓN (VÍNCULOS Y TAREAS) ---

function getProviderTagStore(group) {
    if (group === 'team') return selectedProviderTeam;
    if (group === 'systems') return selectedProviderSystems;
    if (group === 'incidents') return selectedProviderIncidents;
    return [];
}

function setProviderTagStore(group, arr) {
    const store = getProviderTagStore(group);
    store.length = 0;
    store.push(...arr);
}

function renderProviderTagSelectors() {
    const teamSelect = document.getElementById('provider-team-select');
    if (teamSelect) {
        teamSelect.innerHTML = '<option value="">Seleccionar personal...</option>' +
            getState().ranking.map(p => `<option value="${p.name || ''}">${p.name || 'Sin Nombre'} (${p.dept || '-'})</option>`).join('');
    }
    const systemsSelect = document.getElementById('provider-systems-select');
    if (systemsSelect) {
        systemsSelect.innerHTML = '<option value="">Seleccionar sistema...</option>' +
            getState().sistemas.map(s => `<option value="${s.name || ''}">${s.name || 'Sin Nombre'}</option>`).join('');
    }
    const incidentsSelect = document.getElementById('provider-incidents-select');
    if (incidentsSelect) {
        const options = [
            ...getState().unattended.map(u => `<option value="${u.title || ''}">${u.title || 'Sin Título'}</option>`),
            ...getState().finishedIncidents.map(u => `<option value="${u.title || ''}">${u.title || 'Sin Título'} (Cerrada)</option>`)
        ];
        incidentsSelect.innerHTML = '<option value="">Seleccionar incidencia...</option>' + options.join('');
    }

    renderProviderTagList('team');
    renderProviderTagList('systems');
    renderProviderTagList('incidents');
}

function renderProviderTagList(group) {
    const container = document.getElementById(`provider-${group}-list`);
    if (!container) return;
    const items = getProviderTagStore(group);

    if (items.length === 0) {
        container.innerHTML = '<p class="text-[10px] text-on-surface-variant italic opacity-50">Ninguno seleccionado...</p>';
        return;
    }

    container.innerHTML = items.map(name => `
        <div class="flex items-center gap-2 bg-secondary-container text-on-secondary-container px-2.5 py-1 rounded-lg shadow-sm">
            <span class="text-[10px] font-bold">${name}</span>
            <button type="button" onclick="removeProviderTag('${group}', '${String(name).replace(/'/g, "\\'")}')" class="hover:text-error transition-colors">
                <span class="material-symbols-outlined text-[14px]">close</span>
            </button>
        </div>
    `).join('');
}

function addProviderTag(group) {
    const select = document.getElementById(`provider-${group}-select`);
    if (!select) return;
    const value = select.value;
    const items = getProviderTagStore(group);
    if (value && !items.includes(value)) {
        items.push(value);
        renderProviderTagList(group);
        select.value = '';
    }
}

function removeProviderTag(group, value) {
    const items = getProviderTagStore(group).filter(n => n !== value);
    setProviderTagStore(group, items);
    renderProviderTagList(group);
}

function saveProviderLinks() {
    if (getCurrentProviderIndex() === null) return;
    const provider = getState().proveedores[getCurrentProviderIndex()];
    if (!provider) return;
    provider.team = selectedProviderTeam.join(", ");
    provider.linkedSystems = selectedProviderSystems.join(", ");
    provider.linkedIncidents = selectedProviderIncidents.join(", ");
    refreshUI();
}

function openProviderModal(index) {
    const provider = getState().proveedores[index];
    if (!provider) return;
    setCurrentProviderIndex(index);
    setProviderTagStore('team', provider.team ? provider.team.split(', ').filter(Boolean) : []);
    setProviderTagStore('systems', provider.linkedSystems ? provider.linkedSystems.split(', ').filter(Boolean) : []);
    setProviderTagStore('incidents', provider.linkedIncidents ? provider.linkedIncidents.split(', ').filter(Boolean) : []);

    const nameEl = document.getElementById('provider-modal-name');
    if (nameEl) nameEl.innerText = provider.name || 'Sin Nombre';

    renderProviderTagSelectors();
    cancelEditProviderTask();
    renderProviderTasks();

    document.getElementById('provider-manage-modal').classList.remove('hidden');
}

function closeProviderModal() {
    document.getElementById('provider-manage-modal').classList.add('hidden');
    setCurrentProviderIndex(null);
    cancelEditProviderTask();
}

// --- PROVEEDORES: MINI-KANBAN DE TAREAS ---
function renderProviderTasks() {
    if (getCurrentProviderIndex() === null) return;
    const provider = getState().proveedores[getCurrentProviderIndex()];
    if (!provider) return;
    if (!Array.isArray(provider.tasks)) provider.tasks = [];

    const columns = {
        'Alta': document.getElementById('provider-tasks-alta'),
        'Media': document.getElementById('provider-tasks-media'),
        'Baja': document.getElementById('provider-tasks-baja')
    };
    Object.values(columns).forEach(c => { if (c) c.innerHTML = ''; });

    const taskCard = (task, idx) => `
        <div class="bg-white border border-outline-variant p-3 rounded-lg shadow-sm">
            <div class="flex justify-between items-start mb-1 gap-2">
                <h5 class="font-bold text-xs leading-tight">${task.title || 'Sin Título'}</h5>
                <div class="flex gap-1 shrink-0">
                    <button type="button" onclick="prepareEditProviderTask(${idx})" title="Editar"><span class="material-symbols-outlined text-[14px] text-on-surface-variant hover:text-primary">edit</span></button>
                    <button type="button" onclick="toggleProviderTaskDone(${idx})" title="Marcar como completada"><span class="material-symbols-outlined text-[14px] text-emerald-700">done</span></button>
                    <button type="button" onclick="deleteProviderTask(${idx})" title="Eliminar"><span class="material-symbols-outlined text-[14px] text-on-surface-variant hover:text-error">close</span></button>
                </div>
            </div>
            ${task.desc ? `<p class="text-[11px] text-on-surface-variant">${task.desc}</p>` : ''}
        </div>
    `;

    provider.tasks.forEach((task, idx) => {
        if (task.done) return;
        const col = columns[task.priority] || columns['Baja'];
        if (col) col.insertAdjacentHTML('beforeend', taskCard(task, idx));
    });

    Object.values(columns).forEach(col => {
        if (col && !col.innerHTML) {
            col.innerHTML = '<p class="text-[10px] italic text-on-surface-variant opacity-40 text-center py-3">Sin tareas</p>';
        }
    });

    const doneTasks = provider.tasks.filter(t => t.done);
    const doneCountEl = document.getElementById('provider-tasks-done-count');
    const doneListEl = document.getElementById('provider-tasks-done-list');
    if (doneCountEl) doneCountEl.innerText = `${doneTasks.length} tareas completadas`;
    if (doneListEl) {
        doneListEl.innerHTML = provider.tasks.map((task, idx) => {
            if (!task.done) return '';
            return `
                <span class="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-bold">
                    ${task.title || 'Sin Título'}
                    <button type="button" onclick="toggleProviderTaskDone(${idx})" title="Reabrir" class="hover:text-primary"><span class="material-symbols-outlined text-[12px]">undo</span></button>
                    <button type="button" onclick="deleteProviderTask(${idx})" title="Eliminar" class="hover:text-error"><span class="material-symbols-outlined text-[12px]">close</span></button>
                </span>
            `;
        }).join('');
    }
}

function prepareEditProviderTask(index) {
    if (getCurrentProviderIndex() === null) return;
    const provider = getState().proveedores[getCurrentProviderIndex()];
    const task = provider && provider.tasks[index];
    if (!task) return;
    editIndices.providerTask = index;
    document.getElementById('ptask-title').value = task.title || '';
    document.getElementById('ptask-desc').value = task.desc || '';
    document.getElementById('ptask-priority').value = task.priority || 'Alta';
    document.getElementById('ptask-submit').innerText = 'Actualizar';
    document.getElementById('ptask-cancel').classList.remove('hidden');
    document.getElementById('ptask-title').focus();
}

function cancelEditProviderTask() {
    editIndices.providerTask = null;
    const form = document.getElementById('form-provider-task');
    if (form) form.reset();
    const prioritySelect = document.getElementById('ptask-priority');
    if (prioritySelect) prioritySelect.value = 'Alta';
    const submitBtn = document.getElementById('ptask-submit');
    if (submitBtn) submitBtn.innerText = 'Agregar';
    const cancelBtn = document.getElementById('ptask-cancel');
    if (cancelBtn) cancelBtn.classList.add('hidden');
}

function toggleProviderTaskDone(index) {
    if (getCurrentProviderIndex() === null) return;
    const provider = getState().proveedores[getCurrentProviderIndex()];
    const task = provider && provider.tasks[index];
    if (!task) return;
    task.done = !task.done;
    if (editIndices.providerTask === index) cancelEditProviderTask();
    refreshUI();
    renderProviderTasks();
}

function deleteProviderTask(index) {
    if (getCurrentProviderIndex() === null) return;
    const provider = getState().proveedores[getCurrentProviderIndex()];
    if (!provider || !Array.isArray(provider.tasks)) return;
    provider.tasks.splice(index, 1);
    if (editIndices.providerTask === index) cancelEditProviderTask();
    refreshUI();
    renderProviderTasks();
}

function initProviderTaskForm() {
    document.getElementById('form-provider-task')?.addEventListener('submit', (e) => {
        e.preventDefault();
        if (getCurrentProviderIndex() === null) return;
        const provider = getState().proveedores[getCurrentProviderIndex()];
        if (!provider) return;
        if (!Array.isArray(provider.tasks)) provider.tasks = [];

        const title = document.getElementById('ptask-title').value;
        const desc = document.getElementById('ptask-desc').value;
        const priority = document.getElementById('ptask-priority').value;

        if (editIndices.providerTask !== null) {
            const existing = provider.tasks[editIndices.providerTask];
            provider.tasks[editIndices.providerTask] = { ...existing, title, desc, priority };
            cancelEditProviderTask();
        } else {
            provider.tasks.push({ title, desc, priority, done: false });
            cancelEditProviderTask();
        }
        refreshUI();
        renderProviderTasks();
    });
}

export {
    renderProveedores,
    toggleProveedoresView,
    toggleProveedoresSort,
    getProviderTagStore, setProviderTagStore,
    renderProviderTagSelectors, renderProviderTagList,
    addProviderTag, removeProviderTag, saveProviderLinks,
    openProviderModal, closeProviderModal,
    renderProviderTasks, prepareEditProviderTask, cancelEditProviderTask,
    toggleProviderTaskDone, deleteProviderTask,
    initProviderTaskForm,
};
