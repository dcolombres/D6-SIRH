export function applyBrandSettings(state, options = {}) {
   if (state.settings) {
        document.documentElement.style.setProperty('--primary-color', state.settings.primaryColor || '#000000');
        document.documentElement.style.setProperty('--tertiary-color', state.settings.primaryColor || '#000000');
        
        // Custom CSS
        const customStyleTag = document.getElementById('custom-css');
        if (customStyleTag) {
            customStyleTag.innerHTML = state.settings.customCSS || '';
        }

        // App Identity
        const appTitle = state.settings.appTitle || 'D6';
        const appSubtitle = state.settings.appSubtitle || 'Tablero de gestión Interna';
        document.title = (state.settings.appTitle || 'D6');
        
        const titleEl = document.getElementById('sidebar-app-title');
        const subtitleEl = document.getElementById('sidebar-app-subtitle');
        if (titleEl) titleEl.innerText = appTitle;
        if (subtitleEl) subtitleEl.innerText = appSubtitle;

        // Sidebar Navigation Labels
        const navLabels = {
            'nav-overview': state.settings.sidebarOverview || 'Hoy',
            'nav-proveedores': state.settings.sidebarProveedores,
            'nav-reports': state.settings.sidebarReports || 'Reportes',
        };
        for (const [id, label] of Object.entries(navLabels)) {
            const btn = document.getElementById(id);
            const span = document.getElementById(`label-${id}`);
            if (btn && label) btn.title = label;
            if (span && label) span.innerText = label;
        }

        // Section Headers
        const sections = {
            'overview': { title: 'titleOverview', subtitle: 'subtitleOverview' },
            'sistemas': { title: 'titleSistemas', subtitle: 'subtitleSistemas' },
            'incidents': { title: 'titleIncidents', subtitle: 'subtitleIncidents' },
            'requests': { title: 'titleRequests', subtitle: 'subtitleRequests' },
            'ranking': { title: 'titleRanking', subtitle: 'subtitleRanking' },
            'asignacion': { title: 'titleAsignacion', subtitle: 'subtitleAsignacion' },
            'proveedores': { title: 'titleProveedores', subtitle: 'subtitleProveedores' },
            'reports': { title: 'titleReports', subtitle: 'subtitleReports' },
        };
        for (const [key, fields] of Object.entries(sections)) {
            const tEl = document.getElementById(`title-${key}`);
            const sEl = document.getElementById(`subtitle-${key}`);
            if (tEl) tEl.innerText = state.settings[fields.title];
            if (sEl) sEl.innerText = state.settings[fields.subtitle];
        }

        // Roles Dynamic Rendering
        const rolesRefList = document.getElementById('roles-reference-list');
        const roleSelect = document.getElementById('rank-dept');
        if (state.settings.roles) {
            if (rolesRefList) {
                // Get unique roles currently in use by personnel
                const usedRoleCodes = [...new Set(state.ranking.map(p => p.dept))];
                const usedRoles = state.settings.roles.filter(r => usedRoleCodes.includes(r.code));
                
                if (usedRoles.length > 0) {
                    rolesRefList.innerHTML = '<span class="opacity-50">Roles en uso:</span> ' + usedRoles.map(r => 
                        `<span class="font-bold">${r.code}</span>: ${r.name}`
                    ).join(' <span class="mx-1 opacity-20">/</span> ');
                } else {
                    rolesRefList.innerHTML = '<span class="italic opacity-50 text-[10px]">No hay roles asignados actualmente</span>';
                }
            }
            if (roleSelect) {
                roleSelect.innerHTML = state.settings.roles.map(r => 
                    `<option value="${r.code}">${r.code} (${r.name})</option>`
                ).join('');
            }
        }
        
        const logoContainer = document.getElementById('brand-logo-container');
        if (logoContainer && state.settings.logoUrl) {
            // Solo reemplazamos si hay logo, si no mantenemos los textos (que ya actualizamos arriba)
            logoContainer.innerHTML = `<img src="${state.settings.logoUrl}" alt="Logo"/>`;
        }
    }

}

export function applyBrandForInforme(state) {
    if (!state?.settings) return;
    document.documentElement.style.setProperty('--primary-color', state.settings.primaryColor || '#000000');

    const customStyleTag = document.getElementById('custom-css');
    if (customStyleTag) {
        customStyleTag.innerHTML = state.settings.customCSS || '';
    }

    const appTitle = state.settings.appTitle || 'D6';
    const appSubtitle = state.settings.appSubtitle || 'Tablero de gestión Interna';
    document.title = appTitle + ' - Informe Gerencial';

    const titleEl = document.getElementById('sidebar-app-title');
    const subtitleEl = document.getElementById('sidebar-app-subtitle');
    if (titleEl) titleEl.innerText = appTitle;
    if (subtitleEl) subtitleEl.innerText = appSubtitle;

    const logoContainer = document.getElementById('brand-logo-container');
    if (logoContainer && state.settings.logoUrl) {
        logoContainer.innerHTML = `<img src="${state.settings.logoUrl}" alt="Logo"/>`;
    }

    const docBrand = document.getElementById('informe-doc-brand');
    if (docBrand) docBrand.textContent = appTitle;
}
