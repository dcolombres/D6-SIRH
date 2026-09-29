import { getState, persistAdmin, resetAdminState } from './store.js';

function renderStats() {
    document.getElementById('count-systems').innerText = getState().sistemas.length;
    document.getElementById('count-unattended').innerText = getState().unattended.length;
    document.getElementById('count-requests').innerText = getState().requests.length;
    document.getElementById('count-personnel').innerText = getState().ranking.length;
    document.getElementById('count-providers').innerText = getState().proveedores.length;
}

function processMassLoad() {
    const high = document.getElementById('txt-high').value.split('\n').filter(n => n.trim());
    const mid = document.getElementById('txt-mid').value.split('\n').filter(n => n.trim());
    const low = document.getElementById('txt-low').value.split('\n').filter(n => n.trim());
    const unatt = document.getElementById('txt-unattended').value.split('\n').filter(n => n.trim());
    const reqs = document.getElementById('txt-requests').value.split('\n').filter(n => n.trim());
    const pers = document.getElementById('txt-personnel').value.split('\n').filter(n => n.trim());
    const provs = document.getElementById('txt-providers').value.split('\n').filter(n => n.trim());

    high.forEach(n => getState().sistemas.push({ name: n, priority: 'Alta', team: '', desc: '' }));
    mid.forEach(n => getState().sistemas.push({ name: n, priority: 'Media', team: '', desc: '' }));
    low.forEach(n => getState().sistemas.push({ name: n, priority: 'Baja', team: '', desc: '' }));
    unatt.forEach(n => getState().unattended.push({ title: n, status: 'Sin Atención', desc: '' }));
    reqs.forEach(n => getState().requests.push({ feature: n, priority: 'Estándar', progress: 0, status: 'Backlog' }));
    pers.forEach(n => getState().ranking.push({ name: n, dept: 'XX', compromiso: 50, respuesta: 50, capacidad: 50, conocimiento: 50 }));
    provs.forEach(n => getState().proveedores.push({
        name: n, rubro: 'Sin Categoría', contactPerson: '', email: '', phone: '', status: 'Activo',
        contractNumber: '', contractExpiry: '', paymentTerms: '', notes: '',
        team: '', linkedSystems: '', linkedIncidents: '', tasks: []
    }));

    persistAdmin();
    alert('Carga masiva completada con éxito.');

    // Clear textareas
    ['txt-high', 'txt-mid', 'txt-low', 'txt-unattended', 'txt-requests', 'txt-personnel', 'txt-providers'].forEach(id => {
        document.getElementById(id).value = '';
    });
}

function renderEditList() {
    const container = document.getElementById('edit-list-container');
    let html = '';

    // Groups
    const groups = [
        { key: 'sistemas', label: 'Sistemas', color: 'text-on-surface-variant' },
        { key: 'unattended', label: 'Incidentes', color: 'text-error' },
        { key: 'requests', label: 'Solicitudes', color: 'text-blue-700' },
        { key: 'ranking', label: 'Personal', color: 'text-primary' },
        { key: 'proveedores', label: 'Proveedores', color: 'text-emerald-700' }
    ];

    groups.forEach(group => {
        if (getState()[group.key].length > 0) {
            html += `<div class="pt-4 pb-2 border-b border-outline-variant"><p class="text-[10px] font-bold uppercase tracking-widest ${group.color}">${group.label}</p></div>`;
            getState()[group.key].forEach((item, i) => {
                const title = item.name || item.title || item.feature;
                const sub = group.key === 'ranking' ? item.dept : (group.key === 'sistemas' ? item.priority : (item.status || ''));
                html += `
                    <div class="flex justify-between items-center p-3 hover:bg-surface-container rounded-lg transition-all group">
                        <div>
                            <p class="text-sm font-bold">${title}</p>
                            <p class="text-[10px] text-on-surface-variant uppercase font-bold">${sub}</p>
                        </div>
                        <button onclick="openEdit('${group.key}', ${i})" class="material-symbols-outlined text-outline hover:text-primary opacity-0 group-hover:opacity-100 transition-all">edit</button>
                    </div>
                `;
            });
        }
    });

    container.innerHTML = html || '<p class="text-center italic text-xs py-10 opacity-50">No hay datos para editar.</p>';
}

function openEdit(type, index) {
    const data = getState()[type][index];
    document.getElementById('edit-type').value = type;
    document.getElementById('edit-index').value = index;
    document.getElementById('edit-name').value = data.name || data.title || data.feature;
    document.getElementById('edit-desc').value = data.desc || '';

    // Toggle fields
    document.getElementById('fields-sistemas').classList.add('hidden');
    document.getElementById('fields-requests').classList.add('hidden');
    document.getElementById('fields-ranking').classList.add('hidden');

    if (type === 'sistemas') {
        document.getElementById('fields-sistemas').classList.remove('hidden');
        document.getElementById('field-team').value = data.team || '';
    } else if (type === 'requests') {
        document.getElementById('fields-requests').classList.remove('hidden');
        document.getElementById('field-progress').value = data.progress || 0;
        document.getElementById('field-priority').value = data.priority || 'Estándar';
    } else if (type === 'ranking') {
        document.getElementById('fields-ranking').classList.remove('hidden');
        document.getElementById('field-role').value = data.dept || '';
    }

    document.getElementById('edit-modal').classList.remove('hidden');
}

function closeEditModal() {
    document.getElementById('edit-modal').classList.add('hidden');
}

function saveExtraInfo(e) {
    e.preventDefault();
    const type = document.getElementById('edit-type').value;
    const i = document.getElementById('edit-index').value;
    const name = document.getElementById('edit-name').value;
    const desc = document.getElementById('edit-desc').value;

    const item = getState()[type][i];
    if (item.name !== undefined) item.name = name;
    else if (item.title !== undefined) item.title = name;
    else if (item.feature !== undefined) item.feature = name;

    item.desc = desc;

    if (type === 'sistemas') {
        item.team = document.getElementById('field-team').value;
    } else if (type === 'requests') {
        item.progress = parseInt(document.getElementById('field-progress').value);
        item.priority = document.getElementById('field-priority').value;
    } else if (type === 'ranking') {
        item.dept = document.getElementById('field-role').value;
    }

    persistAdmin();
    closeEditModal();
}

function clearAllData() {
    if (confirm('¿Estás seguro de que deseas limpiar todos los datos? Esto borrará sistemas, incidentes, solicitudes, proveedores y el personal registrado.')) {
        resetAdminState();
        location.reload();
    }
}

export {
    renderStats, processMassLoad, renderEditList,
    openEdit, closeEditModal, saveExtraInfo, clearAllData,
};
