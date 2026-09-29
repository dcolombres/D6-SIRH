/** Etiquetas de área del catálogo unificado (datos viven en SQLite). */

export const AREA_OPTIONS = [
  { id: 'gestion', label: 'Gestión', icon: 'manage_accounts', subtitle: 'Dirección de RH' },
  { id: 'tableros', label: 'Tableros', icon: 'dashboard', subtitle: 'Usuarios gerenciales' },
  { id: 'autogestion', label: 'Autogestión', icon: 'person', subtitle: 'Empleados' },
];

export const AREA_LABELS = Object.fromEntries(AREA_OPTIONS.map((a) => [a.id, a.label]));

export function areaLabel(id) {
  return AREA_LABELS[id] || id || 'Gestión';
}
