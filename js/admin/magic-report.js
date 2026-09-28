import { getProfile } from '../state.js';
import {
  getAverageScore,
  getCriticalSystemsCount,
  getPipelineProgress,
  getTeamCapacity,
  calculateWorkload,
} from '../metrics.js';

const COLORS = {
  resumen: '#111111',
  sistemas: '#004ac6',
  incidencias: '#ab0b1c',
  solicitudes: '#737686',
  equipo: '#006c4a',
  asignaciones: '#8b5cf6',
  proveedores: '#0f766e',
};

function item(title, description, tagText, color, offset = 0) {
  return {
    id: Date.now() + offset,
    title,
    description,
    tags: [{ text: tagText, color }],
    image: null,
  };
}

function countBy(arr, key, value) {
  return arr.filter((x) => (x[key] || '') === value).length;
}

function esc(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function p(html) {
  return `<p>${html}</p>`;
}

function subhead(title) {
  return `<h4>${esc(title)}</h4>`;
}

function bullets(items) {
  if (!items.length) return '';
  return `<ul>${items.map((li) => `<li>${li}</li>`).join('')}</ul>`;
}

function assignmentCoverage(state) {
  const total = state.sistemas.length;
  const assigned = state.sistemas.filter((s) => (s.team || '').trim()).length;
  const percent = total > 0 ? Math.round((assigned / total) * 100) : 100;
  return { total, assigned, percent };
}

function buildAttentionBullets(state) {
  const bullets = [];
  const critical = getCriticalSystemsCount(state);
  const highInc = state.unattended.filter((i) => (i.priority || '') === 'Alta' && i.status !== 'Resuelto');
  const pending = state.unattended.filter((i) => i.status === 'Pendiente');
  const coverage = assignmentCoverage(state);
  const stalled = state.requests
    .filter((r) => (r.progress || 0) < 30 && ['Desarrollo', 'Alcance', 'Backlog'].includes(r.status))
    .slice(0, 2);
  const noTeamProv = state.proveedores.filter((p) => !(p.team || '').trim()).length;

  if (highInc.length) {
    bullets.push(`${highInc.length} incidencia(s) de alta prioridad activas requieren seguimiento.`);
  }
  if (pending.length && !highInc.length) {
    bullets.push(`${pending.length} incidencia(s) pendientes sin resolución.`);
  }
  if (critical > 0) {
    bullets.push(`${critical} sistema(s) marcados como críticos en el inventario.`);
  }
  if (coverage.percent < 80) {
    bullets.push(`Cobertura de asignación en ${coverage.percent}% — hay sistemas sin equipo.`);
  }
  if (stalled.length) {
    bullets.push(`Pipeline lento: ${stalled.map((r) => r.feature).join(', ')}.`);
  }
  if (noTeamProv > 0) {
    bullets.push(`${noTeamProv} proveedor(es) sin equipo responsable.`);
  }
  if (!bullets.length) {
    bullets.push('Sin alertas críticas: operación dentro de parámetros esperados.');
  }
  return bullets.slice(0, 3);
}

export function buildExecutiveSection(state) {
  const critical = getCriticalSystemsCount(state);
  const pipeline = getPipelineProgress(state);
  const capacity = getTeamCapacity(state);
  const highInc = state.unattended.filter((i) => (i.priority || '') === 'Alta').length;
  const coverage = assignmentCoverage(state);
  const attention = buildAttentionBullets(state);

  const html =
    p(`<strong>Indicadores:</strong> ${critical} activos críticos · Pipeline ${pipeline}% · Capacidad equipo ${capacity}% · Incidencias alta ${highInc} · Cobertura asignación ${coverage.percent}%.`) +
    subhead('Atención esta semana') +
    bullets(attention.map(esc));
  return item('Resumen ejecutivo', html, 'Resumen', COLORS.resumen, 1000);
}

export function buildSistemasSection(state) {
  const list = state.sistemas || [];
  if (!list.length) {
    return item(
      'Sistemas',
      '<p>No hay sistemas registrados. Agregue activos con prioridad Alta, Media o Baja.</p>',
      'Sistemas',
      COLORS.sistemas,
      2000,
    );
  }
  const alta = countBy(list, 'priority', 'Alta');
  const media = countBy(list, 'priority', 'Media');
  const baja = countBy(list, 'priority', 'Baja');
  const teamCounts = {};
  list.forEach((s) => {
    if (s.team) teamCounts[s.team] = (teamCounts[s.team] || 0) + 1;
  });
  const topTeams = Object.entries(teamCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([t, c]) => `${t} (${c})`)
    .join(', ');

  const critical = list.filter((s) => s.priority === 'Alta').slice(0, 5);
  let html =
    p(`Inventario de <strong>${list.length}</strong> sistemas: ${alta} críticos, ${media} prioritarios, ${baja} estándar.`) +
    p(`Equipos con más carga: ${esc(topTeams || 'N/A')}.`);
  if (critical.length) {
    html +=
      subhead('Top sistemas críticos') +
      bullets(
        critical.map(
          (s, i) =>
            `<strong>${esc(s.name)}</strong> (${esc(s.team || 'Sin equipo')}) — ${esc(s.desc || '')}`,
        ),
      );
  }
  return item('Sistemas', html, 'Sistemas', COLORS.sistemas, 2000);
}

export function buildIncidenciasSection(state) {
  const list = state.unattended || [];
  if (!list.length) {
    return item(
      'Incidencias',
      '<p>No hay incidencias activas registradas.</p>',
      'Incidencias',
      COLORS.incidencias,
      3000,
    );
  }
  const pendiente = countBy(list, 'status', 'Pendiente');
  const revision = countBy(list, 'status', 'En Revisión');
  const resuelto = countBy(list, 'status', 'Resuelto');
  const alta = countBy(list, 'priority', 'Alta');
  const focus = list.filter(
    (i) => i.priority === 'Alta' || i.status === 'Pendiente',
  );

  let html = p(
    `Seguimiento de <strong>${list.length}</strong> incidentes: ${pendiente} pendientes, ${revision} en revisión, ${resuelto} resueltos. <strong>${alta}</strong> de alta prioridad.`,
  );
  if (focus.length) {
    html +=
      subhead('Prioridad de atención (Alta / Pendiente)') +
      bullets(
        focus.slice(0, 10).map(
          (inc) =>
            `<strong>${esc(inc.title)}</strong> (${esc(inc.status)} · ${esc(inc.priority)}) — ${esc(inc.desc || '')}`,
        ),
      );
    if (focus.length > 10) {
      html += p(`${focus.length - 10} adicionales en el tablero.`);
    }
  } else {
    html += p('Sin incidencias Alta ni Pendiente en este momento.');
  }
  return item('Incidencias', html, 'Incidencias', COLORS.incidencias, 3000);
}

export function buildSolicitudesSection(state) {
  const list = state.requests || [];
  if (!list.length) {
    return item(
      'Pipeline / Solicitudes',
      '<p>No hay solicitudes en el pipeline.</p>',
      'Solicitudes',
      COLORS.solicitudes,
      4000,
    );
  }
  const stages = ['Backlog', 'Alcance', 'Desarrollo', 'Testing', 'Deploy'];
  const stageParts = stages.map((s) => `${countBy(list, 'status', s)} ${s.toLowerCase()}`).join(', ');
  const avg = getPipelineProgress(state);

  const priorityRank = { Alta: 0, Media: 1, Estándar: 2, Baja: 3 };
  const top = [...list]
    .sort((a, b) => {
      const pa = priorityRank[a.priority] ?? 9;
      const pb = priorityRank[b.priority] ?? 9;
      if (pa !== pb) return pa - pb;
      return (a.progress || 0) - (b.progress || 0);
    })
    .slice(0, 5);

  const html =
    p(
      `Gestión de <strong>${list.length}</strong> solicitudes (${stageParts}). Progreso promedio: <strong>${avg}%</strong>.`,
    ) +
    subhead('Prioridad / menor avance') +
    bullets(
      top.map(
        (r) =>
          `<strong>${esc(r.feature)}</strong> (${esc(r.status)} · ${esc(r.priority)}) — ${r.progress || 0}% · Expte ${esc(r.expte || '—')}`,
      ),
    );
  return item('Pipeline / Solicitudes', html, 'Solicitudes', COLORS.solicitudes, 4000);
}

export function buildEquipoSection(state) {
  const list = state.ranking || [];
  if (!list.length) {
    return item(
      'Equipo',
      '<p>No hay personal en el ranking. Registre evaluaciones del equipo.</p>',
      'Equipo',
      COLORS.equipo,
      5000,
    );
  }
  const total = list.length;
  const avg = (key) => Math.round(list.reduce((s, p) => s + (p[key] || 0), 0) / total);
  const sorted = [...list].sort((a, b) => getAverageScore(b) - getAverageScore(a));
  const top3 = sorted.slice(0, 3);
  const reinforce = sorted.filter((p) => getAverageScore(p) < 70).slice(0, 3);

  let html =
    p(
      `Evaluación de <strong>${total}</strong> personas — promedio: compromiso ${avg('compromiso')}%, respuesta ${avg('respuesta')}%, capacidad ${avg('capacidad')}%, conocimiento ${avg('conocimiento')}%. Capacidad global: <strong>${getTeamCapacity(state)}%</strong>.`,
    ) +
    subhead('Destacados') +
    bullets(
      top3.map(
        (person) =>
          `<strong>${esc(person.name)}</strong> (${esc(person.dept || '—')}) — score ${getAverageScore(person)}`,
      ),
    );
  if (reinforce.length) {
    html +=
      subhead('A reforzar') +
      bullets(
        reinforce.map(
          (person) =>
            `<strong>${esc(person.name)}</strong> — score ${getAverageScore(person)} (por debajo de 70)`,
        ),
      );
  }
  return item('Equipo', html, 'Equipo', COLORS.equipo, 5000);
}

export function buildAsignacionesSection(state) {
  const coverage = assignmentCoverage(state);
  const teamSummary = {};
  state.sistemas.forEach((s) => {
    if (s.team) teamSummary[s.team] = (teamSummary[s.team] || 0) + 1;
  });
  const topTeams = Object.entries(teamSummary)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([t, c]) => `<strong>${esc(t)}</strong> (${c})`)
    .join(', ');

  const workloads = (state.ranking || [])
    .map((p) => ({ name: p.name, ...calculateWorkload(state, p.name) }))
    .filter((w) => w.total > 0)
    .sort((a, b) => b.total - a.total);

  const overloaded = workloads.filter((w) => w.total >= 80).slice(0, 5);
  const gaps = state.sistemas.filter((s) => !(s.team || '').trim()).slice(0, 5);

  let html = p(
    `<strong>Cobertura:</strong> ${coverage.percent}% de sistemas con equipo (${coverage.assigned}/${coverage.total}).`,
  );
  if (topTeams) html += p(`<strong>Equipos líderes:</strong> ${topTeams}.`);
  if (coverage.percent < 80) {
    html += p('<strong>Alerta:</strong> cobertura por debajo del 80%. Revisar asignación de responsabilidades.');
  } else if (coverage.percent === 100) {
    html += p('Todos los sistemas tienen equipo asignado.');
  }
  if (overloaded.length) {
    html +=
      subhead('Carga elevada') +
      bullets(
        overloaded.map(
          (w) => `<strong>${esc(w.name)}</strong> — carga ${w.total} (${w.count} sistema(s))`,
        ),
      );
  }
  if (gaps.length) {
    html +=
      subhead('Sin equipo asignado') +
      bullets(gaps.map((s) => `<strong>${esc(s.name)}</strong> (${esc(s.priority || '—')})`));
  }
  return item('Asignaciones', html, 'Asignaciones', COLORS.asignaciones, 6000);
}

export function buildProveedoresSection(state) {
  const list = state.proveedores || [];
  if (!list.length) {
    return item(
      'Proveedores',
      '<p>No hay proveedores registrados.</p>',
      'Proveedores',
      COLORS.proveedores,
      7000,
    );
  }
  const withTeam = list.filter((p) => (p.team || '').trim()).length;
  const without = list.length - withTeam;
  const byStatus = {};
  list.forEach((p) => {
    const st = p.status || 'Sin estado';
    byStatus[st] = (byStatus[st] || 0) + 1;
  });
  const statusLine = Object.entries(byStatus)
    .map(([k, v]) => `${v} ${k}`)
    .join(', ');

  const focus = [...list]
    .filter((p) => !(p.team || '').trim() || (p.status || '') === 'Inactivo' || (p.priority || '') === 'Alta')
    .slice(0, 5);

  let html = p(
    `<strong>${list.length}</strong> proveedores: ${withTeam} con equipo, ${without} sin responsable. Estado: ${esc(statusLine)}.`,
  );
  if (focus.length) {
    html +=
      subhead('Seguimiento') +
      bullets(
        focus.map((prov) => {
          const note = !(prov.team || '').trim() ? 'sin equipo' : esc(prov.status || '');
          return `<strong>${esc(prov.name)}</strong> (${esc(prov.rubro || '—')}) — ${note}`;
        }),
      );
  }
  return item('Proveedores', html, 'Proveedores', COLORS.proveedores, 7000);
}

export function buildMagicReportMeta(state, existingAuthority = '') {
  const dateShort = new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());
  const appTitle = state.settings?.appTitle || 'DDS';
  const author =
    state.settings?.operatorName?.trim() ||
    getProfile()?.name?.trim() ||
    'DDS';
  const authority = (existingAuthority || '').trim() || 'Dirección DDS';
  return {
    title: `Status ${appTitle} · ${dateShort}`,
    author,
    authority,
  };
}

export function buildMagicReportItems(state) {
  return [
    buildExecutiveSection(state),
    buildSistemasSection(state),
    buildIncidenciasSection(state),
    buildSolicitudesSection(state),
    buildEquipoSection(state),
    buildAsignacionesSection(state),
    buildProveedoresSection(state),
  ];
}

export function hasMeaningfulReportContent(items) {
  if (!items || !items.length) return false;
  return items.some((it) => {
    const title = (it.title || '').trim();
    const desc = (it.description || '').replace(/<[^>]+>/g, '').trim();
    const isDraftOnly = (it.tags || []).some((t) => t.text === 'Borrador') && !title && !desc;
    return !isDraftOnly && (title || desc);
  });
}
