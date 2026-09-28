import { getState, persistState, setState, resetState } from '../store.js';
import { refreshUI } from './refresh.js';
import {
    editIndices, getCurrentProviderIndex, setCurrentProviderIndex,
    selectedTeam,
} from './context.js';
import { renderSelectedTeam, closeSystemEditModal } from './sistemas.js';
import { closeProviderModal, cancelEditProviderTask } from './proveedores.js';

// --- EDITING LOGIC ---
function prepareEdit(type, index) {
    editIndices[type] = index;
    const data = getState()[type][index];

    if (type === 'sistemas') {
        document.getElementById('sys-name').value = data.name;
        document.getElementById('sys-priority').value = data.priority;
        document.getElementById('sys-desc').value = data.desc || "";
        
        // Cargar equipo seleccionado
        selectedTeam.length = 0;
        if (data.team) selectedTeam.push(...data.team.split(', '));
        renderSelectedTeam();

        document.getElementById('sys-submit').innerText = "Actualizar Sistema";
        document.getElementById('sys-cancel').classList.remove('hidden');
        document.getElementById('sys-name').focus();
    } else if (type === 'unattended') {
       document.getElementById('unat-title').value = data.title;
       document.getElementById('unat-status').value = data.status;
       document.getElementById('unat-priority').value = data.priority || 'Alta';
       document.getElementById('unat-desc').value = data.desc;
       document.getElementById('unat-submit').innerText = "Actualizar Proyecto";
       document.getElementById('unat-cancel').classList.remove('hidden');
       document.getElementById('unat-title').focus();
    } else if (type === 'requests') {
        document.getElementById('req-feature').value = data.feature;
        document.getElementById('req-expte').value = data.expte || '';
        document.getElementById('req-priority').value = data.priority;
        document.getElementById('req-progress').value = data.progress;
        document.getElementById('req-status').value = data.status;
        document.getElementById('req-submit').innerText = "Actualizar Solicitud";
        document.getElementById('req-cancel').classList.remove('hidden');
        document.getElementById('req-feature').focus();
    } else if (type === 'proveedores') {
        document.getElementById('prov-name').value = data.name || '';
        document.getElementById('prov-rubro').value = data.rubro || '';
        document.getElementById('prov-status').value = data.status || 'Activo';
        document.getElementById('prov-contact').value = data.contactPerson || '';
        document.getElementById('prov-email').value = data.email || '';
        document.getElementById('prov-phone').value = data.phone || '';
        document.getElementById('prov-contract-number').value = data.contractNumber || '';
        document.getElementById('prov-contract-expiry').value = data.contractExpiry || '';
        document.getElementById('prov-payment-terms').value = data.paymentTerms || '';
        document.getElementById('prov-notes').value = data.notes || '';
        document.getElementById('prov-submit').innerText = "Actualizar Proveedor";
        document.getElementById('prov-cancel').classList.remove('hidden');
        document.getElementById('prov-name').focus();
    }
}

function cancelEdit(type) {
    editIndices[type] = null;
    if (type === 'sistemas') {
        document.getElementById('form-sistemas').reset();
        selectedTeam.length = 0;
        renderSelectedTeam();
        document.getElementById('sys-submit').innerText = "Guardar Sistema";
        document.getElementById('sys-cancel').classList.add('hidden');
    } else if (type === 'unattended') {
        document.getElementById('form-unattended').reset();
        document.getElementById('unat-submit').innerText = "Guardar Proyecto";
        document.getElementById('unat-cancel').classList.add('hidden');
    } else if (type === 'requests') {
        document.getElementById('form-requests').reset();
        document.getElementById('req-submit').innerText = "Guardar Solicitud";
        document.getElementById('req-cancel').classList.add('hidden');
    } else if (type === 'proveedores') {
        document.getElementById('form-proveedores').reset();
        document.getElementById('prov-status').value = 'Activo';
        document.getElementById('prov-submit').innerText = "Guardar Proveedor";
        document.getElementById('prov-cancel').classList.add('hidden');
    }
}

function initForms() {
    document.getElementById('form-unattended')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('unat-title').value;
        const status = document.getElementById('unat-status').value;
        const priority = document.getElementById('unat-priority').value;
        const desc = document.getElementById('unat-desc').value;
        if (editIndices.unattended !== null) {
            getState().unattended[editIndices.unattended] = { title, status, priority, desc };
            cancelEdit('unattended');
        } else {
            getState().unattended.push({ title, status, priority, desc });
            e.target.reset();
        }
        refreshUI();
    });

    document.getElementById('form-requests')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const feature = document.getElementById('req-feature').value;
        const expte = document.getElementById('req-expte').value;
        const priority = document.getElementById('req-priority').value;
        const progress = parseInt(document.getElementById('req-progress').value);
        const status = document.getElementById('req-status').value;

        if (editIndices.requests !== null) {
            getState().requests[editIndices.requests] = { feature, expte, priority, progress, status };
            cancelEdit('requests');
        } else {
            getState().requests.push({ feature, expte, priority, progress, status });
            e.target.reset();
        }
        refreshUI();
    });

    document.getElementById('form-proveedores')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('prov-name').value;
        const rubro = document.getElementById('prov-rubro').value;
        const status = document.getElementById('prov-status').value;
        const contactPerson = document.getElementById('prov-contact').value;
        const email = document.getElementById('prov-email').value;
        const phone = document.getElementById('prov-phone').value;
        const contractNumber = document.getElementById('prov-contract-number').value;
        const contractExpiry = document.getElementById('prov-contract-expiry').value;
        const paymentTerms = document.getElementById('prov-payment-terms').value;
        const notes = document.getElementById('prov-notes').value;

        if (editIndices.proveedores !== null) {
            const existing = getState().proveedores[editIndices.proveedores];
            getState().proveedores[editIndices.proveedores] = {
                ...existing, name, rubro, status, contactPerson, email, phone,
                contractNumber, contractExpiry, paymentTerms, notes,
            };
            cancelEdit('proveedores');
        } else {
            getState().proveedores.push({
                name, rubro, status, contactPerson, email, phone,
                contractNumber, contractExpiry, paymentTerms, notes,
                team: '', linkedSystems: '', linkedIncidents: '', tasks: [],
            });
            e.target.reset();
            document.getElementById('prov-status').value = 'Activo';
        }
        refreshUI();
    });
}

function deleteEntry(type, index) {
    const providerIdx = getCurrentProviderIndex();
    if (type === 'proveedores' && providerIdx !== null) {
        if (providerIdx === index) {
            closeProviderModal();
        } else if (providerIdx > index) {
            setCurrentProviderIndex(providerIdx - 1);
        }
    }
    getState()[type].splice(index, 1);
    refreshUI();
}

export { prepareEdit, cancelEdit, deleteEntry, initForms };
