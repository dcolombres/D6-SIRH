import { getState, persistAdmin } from './store.js';
import { applyBrandSettings } from '../brand.js';

function applyBrand() {
    document.documentElement.style.setProperty('--primary-color', getState().settings.primaryColor);
    document.getElementById('primary-color-picker').value = getState().settings.primaryColor;
    document.getElementById('primary-color-hex').value = getState().settings.primaryColor.toUpperCase();
    document.getElementById('app-title-input').value = getState().settings.appTitle || '';
    document.getElementById('app-subtitle-input').value = getState().settings.appSubtitle || '';
    document.getElementById('custom-css-input').value = getState().settings.customCSS || '';

    // Llenar inputs de títulos y etiquetas
    const settingKeys = [
        'sidebarOverview', 'sidebarSistemas', 'sidebarIncidents', 'sidebarRequests', 'sidebarRanking', 'sidebarAsignacion', 'sidebarProveedores',
        'titleOverview', 'subtitleOverview', 'titleSistemas', 'subtitleSistemas', 'titleIncidents', 'subtitleIncidents',
        'titleRequests', 'subtitleRequests', 'titleRanking', 'subtitleRanking', 'titleAsignacion', 'subtitleAsignacion',
        'titleProveedores', 'subtitleProveedores'
    ];
    settingKeys.forEach(key => {
        const el = document.getElementById(`${key}-input`);
        if (el) el.value = getState().settings[key] || '';
    });

    const logoCont = document.getElementById('brand-logo-container');
    if (getState().settings.logoUrl) {
        logoCont.innerHTML = `<img src="${getState().settings.logoUrl}" alt="Logo"/>`;
    } else {
        logoCont.innerHTML = `<span class="text-xl font-bold tracking-tighter">${getState().settings.appTitle}</span>`;
    }

    renderRolesList();
}

// --- ROLES MANAGEMENT ---
function renderRolesList() {
    const container = document.getElementById('roles-list-container');
    const selectField = document.getElementById('field-role');
    if (!container) return;

    let html = '';
    let selectHtml = '';

    getState().settings.roles.forEach((role, i) => {
        html += `
            <div class="flex justify-between items-center p-3 bg-white border border-outline-variant rounded-xl group">
                <div class="flex items-center gap-3">
                    <span class="font-data font-bold text-xs bg-surface-container px-2 py-1 rounded text-primary uppercase">${role.code}</span>
                    <span class="text-xs font-bold">${role.name}</span>
                </div>
                <button onclick="deleteRole(${i})" class="material-symbols-outlined text-outline hover:text-error opacity-0 group-hover:opacity-100 transition-all scale-90">delete</button>
            </div>
        `;
        selectHtml += `<option value="${role.code}">${role.code} (${role.name})</option>`;
    });

    container.innerHTML = html || '<p class="text-center italic text-[10px] py-4 opacity-50">No hay roles definidos.</p>';
    if (selectField) selectField.innerHTML = selectHtml;
}

function addRole() {
    const code = document.getElementById('new-role-code').value.trim().toUpperCase();
    const name = document.getElementById('new-role-name').value.trim();

    if (!code || !name) {
        alert("Debe ingresar sigla y nombre del rol.");
        return;
    }

    if (getState().settings.roles.find(r => r.code === code)) {
        alert("Esa sigla ya existe.");
        return;
    }

    getState().settings.roles.push({ code, name });
    document.getElementById('new-role-code').value = '';
    document.getElementById('new-role-name').value = '';
    persistAdmin();
}

function deleteRole(index) {
    if (confirm("¿Seguro que deseas eliminar este rol?")) {
        getState().settings.roles.splice(index, 1);
        persistAdmin();
    }
}

function updateBrandColor(val) {
    getState().settings.primaryColor = val;
    persistAdmin();
}

function updateCustomCSS(val) {
    getState().settings.customCSS = val;
    const customStyleTag = document.getElementById('custom-css');
    if (customStyleTag) {
        customStyleTag.innerHTML = val || '';
    }
}

function saveCustomCSS() {
    const cssTextarea = document.getElementById('custom-css-input');
    if (!cssTextarea) return;

    getState().settings.customCSS = cssTextarea.value;
    persistAdmin();
    applyBrandSettings(getState());
}

function updateSetting(key, val) {
    if (key === 'sidebarOverview' || key === 'titleOverview') {
        getState().settings[key] = 'Hoy';
    } else {
        getState().settings[key] = val;
    }
    persistAdmin();
}

function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        getState().settings.logoUrl = event.target.result;
        persistAdmin();
    };
    reader.readAsDataURL(file);
}

function removeLogo() {
    getState().settings.logoUrl = null;
    persistAdmin();
}

function updateSidebarLabels() {
    // Admin no usa el sidebar de Hoy; no reescribir etiquetas del tablero desde acá.
    getState().settings.sidebarOverview = 'Hoy';
    getState().settings.titleOverview = 'Hoy';
}

function updateSectionHeaders() {
    const sections = {
        overview: { title: 'titleOverview', subtitle: 'subtitleOverview' },
        sistemas: { title: 'titleSistemas', subtitle: 'subtitleSistemas' },
        incidents: { title: 'titleIncidents', subtitle: 'subtitleIncidents' },
        requests: { title: 'titleRequests', subtitle: 'subtitleRequests' },
        ranking: { title: 'titleRanking', subtitle: 'subtitleRanking' },
        asignacion: { title: 'titleAsignacion', subtitle: 'subtitleAsignacion' },
        proveedores: { title: 'titleProveedores', subtitle: 'subtitleProveedores' },
    };
    for (const [sectionId, keys] of Object.entries(sections)) {
        const titleEl = document.getElementById(`title${sectionId.charAt(0).toUpperCase() + sectionId.slice(1)}-input`);
        const subtitleEl = document.getElementById(`subtitle${sectionId.charAt(0).toUpperCase() + sectionId.slice(1)}-input`);
        if (titleEl) titleEl.value = getState().settings[keys.title];
        if (subtitleEl) subtitleEl.value = getState().settings[keys.subtitle];
    }
}

export {
    applyBrand, renderRolesList, addRole, deleteRole,
    updateBrandColor, updateCustomCSS, saveCustomCSS,
    updateSetting, handleLogoUpload, removeLogo,
    updateSidebarLabels, updateSectionHeaders,
};
