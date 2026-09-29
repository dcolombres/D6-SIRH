/** Agregaciones de personas y proveedores desde el catálogo de módulos. */

export function parsePeople(raw) {
  return String(raw || '')
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Personas vinculadas a módulos (responsable + equipo).
 * @returns {Array<{ name: string, roles: string[], modules: Array<{id,modulo,area}> }>}
 */
export function aggregateTeam(rows = []) {
  const map = new Map();

  function add(name, role, mod) {
    const key = name.toLowerCase();
    if (!map.has(key)) {
      map.set(key, { name, roles: new Set(), modules: [] });
    }
    const entry = map.get(key);
    entry.roles.add(role);
    if (!entry.modules.some((m) => m.id === mod.id)) {
      entry.modules.push({ id: mod.id, modulo: mod.modulo, area: mod.area });
    }
  }

  rows.filter((r) => Number(r.activo) !== 0).forEach((r) => {
    const resp = String(r.responsable || '').trim();
    if (resp) add(resp, 'Responsable', r);
    parsePeople(r.equipo).forEach((p) => add(p, 'Equipo', r));
  });

  return [...map.values()]
    .map((e) => ({
      name: e.name,
      roles: [...e.roles],
      modules: e.modules,
      moduleCount: e.modules.length,
    }))
    .sort((a, b) => b.moduleCount - a.moduleCount || a.name.localeCompare(b.name, 'es'));
}

/**
 * Proveedores vinculados a módulos (campo proveedor).
 * @returns {Array<{ name: string, modules: Array<{id,modulo,area}> }>}
 */
export function aggregateProviders(rows = []) {
  const map = new Map();

  rows.filter((r) => Number(r.activo) !== 0).forEach((r) => {
    const name = String(r.proveedor || '').trim();
    if (!name) return;
    const key = name.toLowerCase();
    if (!map.has(key)) map.set(key, { name, modules: [] });
    const entry = map.get(key);
    if (!entry.modules.some((m) => m.id === r.id)) {
      entry.modules.push({ id: r.id, modulo: r.modulo, area: r.area });
    }
  });

  return [...map.values()]
    .map((e) => ({ ...e, moduleCount: e.modules.length }))
    .sort((a, b) => b.moduleCount - a.moduleCount || a.name.localeCompare(b.name, 'es'));
}

export function uniqueProviderNames(rows = []) {
  return aggregateProviders(rows).map((p) => p.name);
}

export function uniquePeopleNames(rows = []) {
  return aggregateTeam(rows).map((p) => p.name);
}
