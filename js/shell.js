const TOP_TITLES = {
  overview: 'D6 · Hoy',
  operacion: 'D6 · Operación',
  sistemas: 'D6 · Sistemas',
  incidents: 'D6 · Incidencias',
  pipeline: 'D6 · Solicitudes',
  proveedores: 'D6 · Proveedores',
  reports: 'D6 · Reportes SIRH',
};

let activeGroup = 'overview';

export function toggleSidebar() {
  document.body.classList.toggle('sidebar-collapsed');
  const isCollapsed = document.body.classList.contains('sidebar-collapsed');
  localStorage.setItem('d6_sidebar_collapsed', isCollapsed);
  // Migración de clave antigua
  localStorage.removeItem('dds_sidebar_collapsed');
  const icon = document.querySelector('aside button span');
  if (icon) icon.innerText = isCollapsed ? 'menu' : 'menu_open';
}

export function initSidebarFromStorage() {
  const collapsed = localStorage.getItem('d6_sidebar_collapsed') === 'true'
    || localStorage.getItem('dds_sidebar_collapsed') === 'true';
  if (collapsed) {
    document.body.classList.add('sidebar-collapsed');
    const icon = document.querySelector('aside button span');
    if (icon) icon.innerText = 'menu';
  }
}

function showSection(sectionId) {
  document.querySelectorAll('main > div > section').forEach((s) => s.classList.add('hidden'));
  const target = document.getElementById(`section-${sectionId}`);
  if (target) target.classList.remove('hidden');
}

function setActiveNav(navId) {
  document.querySelectorAll('.nav-item').forEach((n) => n.classList.remove('active'));
  document.getElementById(navId)?.classList.add('active');
}

function setOpsTab(tab) {
  document.querySelectorAll('[data-ops-tab]').forEach((btn) => {
    const on = btn.getAttribute('data-ops-tab') === tab;
    btn.classList.toggle('bg-primary', on);
    btn.classList.toggle('text-white', on);
  });
}

export function switchSection(sectionId, { onSwitch } = {}) {
  let resolved = sectionId;

  if (sectionId === 'operacion') {
    activeGroup = 'operacion';
    resolved = 'sistemas';
    setActiveNav('nav-operacion');
    setOpsTab('sistemas');
    document.getElementById('ops-tabs')?.classList.remove('hidden');
  } else if (['sistemas', 'incidents', 'pipeline'].includes(sectionId)) {
    activeGroup = 'operacion';
    setActiveNav('nav-operacion');
    setOpsTab(sectionId);
    document.getElementById('ops-tabs')?.classList.remove('hidden');
  } else {
    activeGroup = sectionId;
    setActiveNav(`nav-${sectionId}`);
    document.getElementById('ops-tabs')?.classList.add('hidden');
  }

  showSection(resolved);

  const topBar = document.getElementById('top-bar-title');
  if (topBar) topBar.innerText = TOP_TITLES[resolved] || TOP_TITLES[sectionId] || 'D6';

  if (typeof onSwitch === 'function') onSwitch(resolved, activeGroup);
  return resolved;
}

export function getActiveGroup() {
  return activeGroup;
}
