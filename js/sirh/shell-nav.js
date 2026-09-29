/**
 * Nav lateral: Hoy → Módulos → Tablero
 * Informe y Administración van en el header (derecha), con íconos.
 * @param {{ active?: string }} opts
 */
function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function linkItem(href, icon, label, active, id) {
  const cls = active
    ? 'nav-item active w-full flex items-center gap-3 px-4 py-3 rounded text-secondary hover:bg-surface-container-high transition-all'
    : 'nav-item w-full flex items-center gap-3 px-4 py-3 rounded text-secondary hover:bg-surface-container-high transition-all';
  return `<a href="${esc(href)}" id="${esc(id || '')}" class="${cls}" title="${esc(label)}">
    <span class="material-symbols-outlined">${esc(icon)}</span>
    <span class="sidebar-label text-sm font-semibold">${esc(label)}</span>
  </a>`;
}

/** Íconos Informe + Administración para el header derecho. */
export function topUtilityLinksHtml({ active = '' } = {}) {
  const informeOn = active === 'informe';
  const adminOn = active === 'admin';
  const base = 'p-2 rounded-lg transition-all inline-flex items-center justify-center';
  const idle = `${base} text-secondary hover:bg-surface-container-high`;
  const on = `${base} bg-primary/10 text-primary`;
  return `
    <a href="/pages/informe.html" class="${informeOn ? on : idle}" title="Informe" aria-label="Informe">
      <span class="material-symbols-outlined">present_to_all</span>
    </a>
    <a href="/pages/admin.html" class="${adminOn ? on : idle}" title="Administración" aria-label="Administración">
      <span class="material-symbols-outlined">settings</span>
    </a>
  `;
}

export function mountTopUtilities({ active = '' } = {}) {
  const host = document.getElementById('d6-top-utils');
  if (!host) return;
  host.innerHTML = topUtilityLinksHtml({ active });
}

export function mountSidebarNav({ active = '' } = {}) {
  const host = document.getElementById('d6-sidebar-nav');
  if (!host) return;

  const modulosActive = active === 'modulos' || active === 'equipo' || active === 'proveedores';
  const tableroActive = active === 'gerencia' || active === 'tablero';

  host.innerHTML = `
    <p class="px-4 pt-1 pb-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70 sidebar-label">Follow-up SIRH</p>
    ${linkItem('/pages/index.html', 'today', 'Hoy', active === 'hoy' || active === 'overview', 'nav-hoy')}
    ${linkItem('/pages/sirh.html', 'view_module', 'Módulos SIRH', modulosActive, 'nav-modulos')}
    ${linkItem('/pages/gerencia.html', 'analytics', 'Tablero', tableroActive, 'nav-gerencia')}
  `;
}
