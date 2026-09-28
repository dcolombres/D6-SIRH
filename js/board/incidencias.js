import { getState, persistState } from '../store.js';
import { getPriorityColors } from '../utils.js';
import { viewState } from './context.js';
import { refreshUI } from './refresh.js';
import {
  applySort,
  priorityRank,
  syncViewButtons,
  toggleSortState,
  toolbarSortTh,
} from './list-tools.js';

function toggleHubView(view) {
    viewState.hubView = view;
    syncViewButtons('hub', view);
    renderStatus();
}

function togglePipelineView(view) {
    viewState.pipelineView = view;
    syncViewButtons('pipeline', view);
    renderStatus();
}

function toggleIncidentsSort(col) {
    toggleSortState(viewState.incidentsSort, col);
    renderStatus();
}

function togglePipelineSort(col) {
    toggleSortState(viewState.pipelineSort, col);
    renderStatus();
}

function filterIncidents(term) {
    return getState().unattended
        .map((u, index) => ({ ...u, _index: index }))
        .filter((u) => {
            if (!term) return true;
            return (u.title || '').toLowerCase().includes(term)
                || (u.status || '').toLowerCase().includes(term)
                || (u.desc || '').toLowerCase().includes(term)
                || (u.priority || '').toLowerCase().includes(term);
        });
}

function filterRequests(term) {
    return getState().requests
        .map((r, index) => ({ ...r, _index: index }))
        .filter((r) => {
            if (!term) return true;
            return (r.feature || '').toLowerCase().includes(term)
                || (r.expte || '').toLowerCase().includes(term)
                || (r.status || '').toLowerCase().includes(term)
                || (r.priority || '').toLowerCase().includes(term);
        });
}

function renderStatus() {
    const unattendedCount = document.getElementById('status-metric-unattended');
    const requestsCount = document.getElementById('status-metric-requests');
    const incidentBadge = document.getElementById('incident-count-badge');
    const requestBadge = document.getElementById('request-count-badge');
    const tableSummary = document.getElementById('request-table-summary');

    const incidentSearchTerm = (document.getElementById('incidents-search')?.value || '').toLowerCase();
    const pipelineSearchTerm = (document.getElementById('pipeline-search')?.value || '').toLowerCase();

    let filteredUnattended = filterIncidents(incidentSearchTerm);
    let filteredRequests = filterRequests(pipelineSearchTerm);

    filteredUnattended = applySort(filteredUnattended, viewState.incidentsSort, {
        priority: (r) => priorityRank(r.priority || 'Alta'),
        title: (r) => r.title || '',
        status: (r) => r.status || '',
        desc: (r) => r.desc || '',
    });

    filteredRequests = applySort(filteredRequests, viewState.pipelineSort, {
        feature: (r) => r.feature || '',
        priority: (r) => priorityRank(r.priority || 'Estándar'),
        progress: (r) => Number(r.progress) || 0,
        status: (r) => r.status || '',
        expte: (r) => r.expte || '',
    });

    if (unattendedCount) unattendedCount.innerText = filteredUnattended.length;
    if (requestsCount) requestsCount.innerText = filteredRequests.length;
    if (incidentBadge) incidentBadge.innerText = `${filteredUnattended.length} Pendientes`;
    if (requestBadge) requestBadge.innerText = `${filteredRequests.length} en Backlog`;
    if (tableSummary) tableSummary.innerText = `Mostrando ${filteredRequests.length} solicitudes`;

    syncViewButtons('hub', viewState.hubView);
    syncViewButtons('pipeline', viewState.pipelineView);

    renderIncidentsList(filteredUnattended);
    renderRequestsList(filteredRequests);
    renderClosedIncidents(incidentSearchTerm);
    renderClosedRequests(pipelineSearchTerm);
}

function renderIncidentsList(rows) {
    const list = document.getElementById('list-unattended');
    if (!list) return;

    if (viewState.hubView === 'cards') {
        list.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter';
        list.innerHTML = rows.map((u) => {
            const colors = getPriorityColors(u.priority || 'Alta');
            return `
                <div class="group bg-white border border-outline-variant p-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden">
                    <div class="absolute top-0 left-0 w-1.5 h-full ${colors.border}"></div>
                    <div class="flex justify-between items-start mb-3">
                        <div class="flex gap-2 flex-wrap">
                            <span class="text-[10px] font-bold ${colors.text} tracking-widest uppercase ${colors.bg} px-2 py-0.5 rounded">${u.priority || 'Alta'}</span>
                            <span class="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase bg-surface-container px-2 py-0.5 rounded">${u.status || 'Sin Status'}</span>
                        </div>
                        <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button type="button" onclick="prepareEdit('unattended', ${u._index})" class="p-1 hover:bg-surface-container rounded-lg transition-colors"><span class="material-symbols-outlined text-[18px] text-on-surface-variant hover:text-primary">edit</span></button>
                            <button type="button" onclick="closeIncident(${u._index})" class="p-1 hover:bg-surface-container rounded-lg transition-colors"><span class="material-symbols-outlined text-[18px] text-emerald-700">done</span></button>
                            <button type="button" onclick="deleteEntry('unattended', ${u._index})" class="p-1 hover:bg-surface-container rounded-lg transition-colors"><span class="material-symbols-outlined text-[18px] text-on-surface-variant hover:text-error">close</span></button>
                        </div>
                    </div>
                    <h4 class="text-base font-bold mb-2 group-hover:text-primary transition-colors">${u.title || 'Sin Título'}</h4>
                    <p class="text-sm text-on-surface-variant leading-relaxed">${u.desc || ''}</p>
                </div>
            `;
        }).join('') || '<div class="flex flex-col items-center justify-center h-full opacity-40 py-10 col-span-full"><span class="material-symbols-outlined text-4xl mb-2">check_circle</span><p class="text-sm font-bold">Sin incidentes</p></div>';
        return;
    }

    const sort = viewState.incidentsSort;
    list.className = 'col-span-full bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm';
    list.innerHTML = `
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead class="bg-surface-container-low border-b border-outline-variant">
                    <tr>
                        ${toolbarSortTh('Semáforo', 'priority', sort, 'toggleIncidentsSort')}
                        ${toolbarSortTh('Incidente / Sistema', 'title', sort, 'toggleIncidentsSort')}
                        ${toolbarSortTh('Status / Motivo', 'status', sort, 'toggleIncidentsSort')}
                        ${toolbarSortTh('Descripción', 'desc', sort, 'toggleIncidentsSort')}
                        <th class="px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest text-right">Gestión</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-outline-variant/30">
                    ${rows.map((u) => {
                        const colors = getPriorityColors(u.priority || 'Alta');
                        return `
                            <tr class="hover:bg-surface-container-low transition-colors group">
                                <td class="px-6 py-4">
                                    <span class="px-2 py-0.5 ${colors.bg} ${colors.text} text-[10px] font-bold rounded-full uppercase border border-outline-variant/20">${u.priority || 'Alta'}</span>
                                </td>
                                <td class="px-6 py-4 font-bold text-sm">${u.title || 'Sin Título'}</td>
                                <td class="px-6 py-4 text-xs font-bold text-on-surface-variant opacity-70">${u.status || 'Sin Status'}</td>
                                <td class="px-6 py-4 text-sm text-on-surface-variant">${u.desc || ''}</td>
                                <td class="px-6 py-4 text-right">
                                    <div class="flex justify-end gap-2">
                                        <button type="button" onclick="prepareEdit('unattended', ${u._index})" class="p-1 hover:bg-surface-container rounded-lg transition-colors"><span class="material-symbols-outlined text-sm text-on-surface-variant hover:text-primary">edit</span></button>
                                        <button type="button" onclick="closeIncident(${u._index})" class="p-1 hover:bg-surface-container rounded-lg transition-colors"><span class="material-symbols-outlined text-sm text-emerald-700">done</span></button>
                                        <button type="button" onclick="deleteEntry('unattended', ${u._index})" class="p-1 hover:bg-surface-container rounded-lg transition-colors"><span class="material-symbols-outlined text-sm text-on-surface-variant hover:text-error">close</span></button>
                                    </div>
                                </td>
                            </tr>
                        `;
                    }).join('') || '<tr><td colspan="5" class="py-10 text-center italic opacity-50">Sin incidentes registrados</td></tr>'}
                </tbody>
            </table>
        </div>
    `;
}

function renderRequestsList(rows) {
    const list = document.getElementById('list-requests');
    if (!list) return;

    if (viewState.pipelineView === 'cards') {
        list.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter';
        list.innerHTML = rows.map((r) => `
            <div class="group bg-white border border-outline-variant p-5 rounded-xl shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                <div class="absolute top-0 left-0 w-1.5 h-full ${r.priority === 'Alta' ? 'bg-error' : (r.priority === 'Estándar' || r.priority === 'Media' ? 'bg-amber-500' : 'bg-slate-300')}"></div>
                <div class="flex justify-between items-start mb-3 gap-2">
                    <div>
                        <p class="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60 mb-1">${r.expte || 'SIN-EXPTE'}</p>
                        <h4 class="text-base font-bold group-hover:text-primary transition-colors">${r.feature || 'Sin Título'}</h4>
                    </div>
                    <span class="text-[10px] font-bold uppercase tracking-wider shrink-0">${r.priority || 'Estándar'}</span>
                </div>
                <div class="mb-4">
                    <div class="flex justify-between text-[10px] font-data mb-1.5">
                        <span class="font-bold">${r.progress || 0}%</span>
                        <span class="text-on-surface-variant italic opacity-70">${r.status || 'Sin Status'}</span>
                    </div>
                    <div class="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                        <div class="h-full bg-primary rounded-full" style="width: ${r.progress || 0}%"></div>
                    </div>
                </div>
                <div class="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button type="button" class="p-1 hover:bg-surface-container rounded-lg" onclick="prepareEdit('requests', ${r._index})"><span class="material-symbols-outlined text-[18px] text-on-surface-variant hover:text-primary">edit</span></button>
                    <button type="button" class="p-1 hover:bg-surface-container rounded-lg" onclick="closeRequest(${r._index})" title="Cerrar solicitud"><span class="material-symbols-outlined text-[18px] text-emerald-700">done</span></button>
                    <button type="button" class="p-1 hover:bg-surface-container rounded-lg" onclick="deleteEntry('requests', ${r._index})"><span class="material-symbols-outlined text-[18px] text-on-surface-variant hover:text-error">delete</span></button>
                </div>
            </div>
        `).join('') || '<div class="col-span-full py-10 text-center opacity-40 italic">No hay solicitudes registradas</div>';
        return;
    }

    const sort = viewState.pipelineSort;
    list.className = 'bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm';
    list.innerHTML = `
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead class="bg-surface-container-low border-b border-outline-variant">
                    <tr>
                        ${toolbarSortTh('Requerimiento', 'feature', sort, 'togglePipelineSort')}
                        ${toolbarSortTh('EXPTE', 'expte', sort, 'togglePipelineSort')}
                        ${toolbarSortTh('Prioridad', 'priority', sort, 'togglePipelineSort')}
                        ${toolbarSortTh('Progreso', 'progress', sort, 'togglePipelineSort')}
                        ${toolbarSortTh('Status', 'status', sort, 'togglePipelineSort')}
                        <th class="px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest text-right">Gestión</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-outline-variant/30">
                    ${rows.map((r) => `
                        <tr class="hover:bg-surface-container-low transition-colors group">
                            <td class="px-6 py-5 font-bold text-sm group-hover:text-primary transition-colors">${r.feature || 'Sin Título'}</td>
                            <td class="px-6 py-5 text-[10px] text-on-surface-variant uppercase font-bold opacity-70 font-data">${r.expte || 'SIN-EXPTE'}</td>
                            <td class="px-6 py-5">
                                <div class="flex items-center gap-2">
                                    <span class="w-2 h-2 rounded-full ${r.priority === 'Alta' ? 'bg-error' : (r.priority === 'Estándar' || r.priority === 'Media' ? 'bg-emerald-500' : 'bg-slate-300')}"></span>
                                    <span class="text-[10px] font-bold uppercase tracking-wider">${r.priority || 'Estándar'}</span>
                                </div>
                            </td>
                            <td class="px-6 py-5">
                                <div class="w-28">
                                    <div class="flex justify-between text-[10px] font-data mb-1.5">
                                        <span class="font-bold">${r.progress || 0}%</span>
                                    </div>
                                    <div class="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                                        <div class="h-full bg-primary rounded-full" style="width: ${r.progress || 0}%"></div>
                                    </div>
                                </div>
                            </td>
                            <td class="px-6 py-5 text-xs text-on-surface-variant font-bold">${r.status || 'Sin Status'}</td>
                            <td class="px-6 py-5 text-right">
                                <div class="flex justify-end gap-2">
                                    <button type="button" class="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-white hover:shadow-md hover:text-primary transition-all" onclick="prepareEdit('requests', ${r._index})">
                                        <span class="material-symbols-outlined text-[18px]">edit</span>
                                    </button>
                                    <button type="button" class="w-8 h-8 flex items-center justify-center rounded-lg text-emerald-700 hover:bg-white hover:shadow-md transition-all" onclick="closeRequest(${r._index})" title="Cerrar solicitud">
                                        <span class="material-symbols-outlined text-[18px]">done</span>
                                    </button>
                                    <button type="button" class="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-white hover:shadow-md hover:text-error transition-all" onclick="deleteEntry('requests', ${r._index})">
                                        <span class="material-symbols-outlined text-[18px]">delete</span>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('') || '<tr><td colspan="6" class="px-6 py-10 text-center text-on-surface-variant opacity-50 italic">No hay solicitudes registradas</td></tr>'}
                </tbody>
            </table>
        </div>
    `;
}

function renderClosedIncidents(searchTerm = '') {
    const table = document.getElementById('table-closed-incidents');
    const badge = document.getElementById('closed-incident-count-badge');
    if (!table) return;

    const filteredClosed = getState().finishedIncidents.filter(u =>
        (u.title || '').toLowerCase().includes(searchTerm) ||
        (u.status || '').toLowerCase().includes(searchTerm) ||
        (u.desc || '').toLowerCase().includes(searchTerm)
    );

    if (badge) badge.innerText = `${filteredClosed.length} cerradas`;

    table.innerHTML = filteredClosed.map(u => {
        const colors = u.priority === 'Alta'
            ? { bg: 'bg-red-50', text: 'text-red-700' }
            : u.priority === 'Media'
                ? { bg: 'bg-amber-50', text: 'text-amber-700' }
                : { bg: 'bg-emerald-50', text: 'text-emerald-700' };

        return `
            <tr class="hover:bg-surface-container-low transition-colors">
                <td class="px-6 py-4">
                    <span class="px-2 py-0.5 ${colors.bg} ${colors.text} text-[10px] font-bold rounded-full uppercase border border-outline-variant/20">${u.priority || 'Alta'}</span>
                </td>
                <td class="px-6 py-4 font-bold text-sm">${u.title || 'Sin Título'}</td>
                <td class="px-6 py-4 text-xs font-bold text-on-surface-variant opacity-70">${u.status || 'Sin Status'}</td>
                <td class="px-6 py-4 text-sm text-on-surface-variant">${u.desc || ''}</td>
            </tr>
        `;
    }).join('') || '<tr><td colspan="4" class="px-6 py-10 text-center text-on-surface-variant opacity-50 italic">Aún no hay incidencias cerradas.</td></tr>';
}

function renderClosedRequests(searchTerm = '') {
    const table = document.getElementById('table-closed-requests');
    const badge = document.getElementById('closed-requests-count-badge');
    if (!table) return;

    const filtered = getState().finishedRequests.filter(r =>
        (r.feature || '').toLowerCase().includes(searchTerm) ||
        (r.expte || '').toLowerCase().includes(searchTerm) ||
        (r.status || '').toLowerCase().includes(searchTerm) ||
        (r.note || '').toLowerCase().includes(searchTerm)
    );

    if (badge) badge.innerText = `${filtered.length} cerradas`;

    table.innerHTML = filtered.map((r) => {
        const actualIndex = getState().finishedRequests.indexOf(r);
        const colors = r.priority === 'Alta'
            ? { bg: 'bg-red-50', text: 'text-red-700' }
            : r.priority === 'Estándar' || r.priority === 'Media'
                ? { bg: 'bg-amber-50', text: 'text-amber-700' }
                : { bg: 'bg-emerald-50', text: 'text-emerald-700' };

        const closedDate = r.closedAt ? new Date(r.closedAt).toLocaleString('es-AR') : '-';

        return `
            <tr class="hover:bg-surface-container-low transition-colors">
                <td class="px-6 py-4">
                    <span class="px-2 py-0.5 ${colors.bg} ${colors.text} text-[10px] font-bold rounded-full uppercase border border-outline-variant/20">${r.priority || 'Estándar'}</span>
                </td>
                <td class="px-6 py-4 font-bold text-sm">${r.feature || 'Sin Título'}</td>
                <td class="px-6 py-4 text-xs font-bold text-on-surface-variant opacity-70">${r.expte || '-'}</td>
                <td class="px-6 py-4 text-sm text-on-surface-variant">${r.note || '-'}</td>
                <td class="px-6 py-4 text-right text-[10px] text-on-surface-variant">${closedDate}</td>
                <td class="px-6 py-4 text-center">
                    <button type="button" onclick="editClosedRequest(${actualIndex})" class="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors" title="Editar">
                        <span class="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <button type="button" onclick="deleteClosedRequest(${actualIndex})" class="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-red-100 text-red-600 transition-colors" title="Eliminar">
                        <span class="material-symbols-outlined text-sm">delete</span>
                    </button>
                </td>
            </tr>
        `;
    }).join('') || '<tr><td colspan="6" class="px-6 py-10 text-center text-on-surface-variant opacity-50 italic">Aún no hay solicitudes cerradas.</td></tr>';
}

function closeRequest(index) {
    if (index < 0 || index >= getState().requests.length) return;
    const note = prompt('Agregar nota opcional al cerrar la solicitud:');
    const [req] = getState().requests.splice(index, 1);
    req.note = note || '';
    req.closedAt = new Date().toISOString();
    getState().finishedRequests.unshift(req);
    refreshUI();
}

function editClosedRequest(index) {
    if (index < 0 || index >= getState().finishedRequests.length) return;
    const req = getState().finishedRequests[index];
    const newNote = prompt('Editar nota de cierre:', req.note || '');
    if (newNote !== null) {
        req.note = newNote;
        persistState();
        renderClosedRequests();
    }
}

function deleteClosedRequest(index) {
    if (index < 0 || index >= getState().finishedRequests.length) return;
    if (confirm('¿Está seguro de que desea eliminar esta solicitud cerrada?')) {
        getState().finishedRequests.splice(index, 1);
        refreshUI();
    }
}

function closeIncident(index) {
    if (index < 0 || index >= getState().unattended.length) return;
    const [incident] = getState().unattended.splice(index, 1);
    getState().finishedIncidents.unshift(incident);
    refreshUI();
}

export {
    renderStatus, toggleHubView, togglePipelineView,
    toggleIncidentsSort, togglePipelineSort,
    renderClosedIncidents, renderClosedRequests,
    closeRequest, editClosedRequest, deleteClosedRequest, closeIncident,
    initIncidenciasListeners,
};

function initIncidenciasListeners() {
    document.getElementById('incidents-search')?.addEventListener('input', renderStatus);
    document.getElementById('pipeline-search')?.addEventListener('input', renderStatus);
}
