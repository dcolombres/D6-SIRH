const TOP_TITLES = {
  overview: 'D6 · Hoy',
};

let activeGroup = 'overview';

export function toggleSidebar() {
  document.body.classList.toggle('sidebar-collapsed');
  const isCollapsed = document.body.classList.contains('sidebar-collapsed');
  localStorage.setItem('d6_sidebar_collapsed', isCollapsed);
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

export function switchSection(sectionId, { onSwitch } = {}) {
  const resolved = 'overview';
  activeGroup = resolved;
  setActiveNav(`nav-${resolved}`);
  showSection(resolved);

  const topBar = document.getElementById('top-bar-title');
  if (topBar) topBar.innerText = TOP_TITLES[resolved] || 'D6 · SIRH';

  if (typeof onSwitch === 'function') onSwitch(resolved, activeGroup);
  return resolved;
}

export function getActiveGroup() {
  return activeGroup;
}
