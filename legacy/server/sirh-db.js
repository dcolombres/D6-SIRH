const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const ESTADOS_CLASICOS = [
  'Planificado',
  'Alcance',
  'En desarrollo',
  'En pruebas',
  'Operativo',
  'Pausado',
  'Cancelado',
];

const PRIORIDADES = ['Alta', 'Media', 'Baja'];
const RIESGOS = ['Alto', 'Medio', 'Bajo'];
const AREAS = ['gestion', 'tableros', 'autogestion'];
const AREA_LABELS = {
  gestion: 'Gestión',
  tableros: 'Tableros',
  autogestion: 'Autogestión',
};

/** Catálogo de producto (áreas) + módulos de seguimiento ya conocidos. */
const SEED_MODULOS = [
  // —— Gestión
  { modulo: 'Nómina', area: 'gestion', fase: 'Nómina', descripcion: 'ABM y parametrización de nómina', icono: 'payments', orden: 10, estado: 'Alcance', prioridad: 'Alta', avance: 22, riesgo: 'Alto', responsable: 'Equipo Nómina', proveedor: 'Consultora liquidaciones', fecha_inicio: '2026-04-01', fecha_fin_prevista: '2026-12-15', bloqueo: 'Reglas de conceptos y conceptos variables', hito: 'Motor de liquidación piloto' },
  { modulo: 'Contratos', area: 'gestion', fase: 'Core RRHH', descripcion: 'Contratos y modalidades de vínculo', icono: 'contract', orden: 20, estado: 'Planificado', prioridad: 'Alta', avance: 5, riesgo: 'Medio', hito: 'Tipologías de contrato' },
  { modulo: 'Edificios', area: 'gestion', fase: 'Core RRHH', descripcion: 'Sedes, edificios y ubicaciones', icono: 'apartment', orden: 30, estado: 'Planificado', prioridad: 'Media', avance: 0, riesgo: 'Bajo', hito: 'Catálogo de sedes' },
  { modulo: 'Organigrama', area: 'gestion', fase: 'Core RRHH', descripcion: 'Estructura organizacional', icono: 'account_tree', orden: 40, estado: 'Alcance', prioridad: 'Alta', avance: 35, riesgo: 'Medio', responsable: 'Equipo Funcional', fecha_inicio: '2026-03-01', fecha_fin_prevista: '2026-07-31', bloqueo: 'Árbol de cargos vs. organigrama oficial', hito: 'Modelo de puestos' },
  { modulo: 'Roles', area: 'gestion', fase: 'Plataforma', descripcion: 'Roles y perfiles institucionales', icono: 'badge', orden: 50, estado: 'En desarrollo', prioridad: 'Alta', avance: 63, riesgo: 'Medio', responsable: 'Equipo Plataforma', fecha_inicio: '2026-01-10', fecha_fin_prevista: '2026-06-15', bloqueo: 'Matriz de permisos por área', hito: 'RBAC por módulo' },
  { modulo: 'Servicio médico', area: 'gestion', fase: 'Operación', descripcion: 'Gestión de servicio médico', icono: 'medical_services', orden: 60, estado: 'Planificado', prioridad: 'Media', avance: 0, riesgo: 'Medio', hito: 'Alcance clínico' },
  { modulo: 'Bandas horarias', area: 'gestion', fase: 'Operación', descripcion: 'Aplicación de bandas horarias', icono: 'schedule', orden: 70, estado: 'En desarrollo', prioridad: 'Alta', avance: 44, riesgo: 'Alto', responsable: 'Equipo Integraciones', proveedor: 'Proveedor biométrico', fecha_inicio: '2026-02-15', fecha_fin_prevista: '2026-09-30', bloqueo: 'Conector reloj biométrico', hito: 'Marcaciones diarias' },
  { modulo: 'Liquidación horas extras', area: 'gestion', fase: 'Nómina', descripcion: 'Liquidación de HH.EE.', icono: 'more_time', orden: 80, estado: 'Planificado', prioridad: 'Media', avance: 0, riesgo: 'Medio', hito: 'Reglas de HH.EE.' },
  { modulo: 'Unidades retributivas', area: 'gestion', fase: 'Nómina', descripcion: 'Unidades retributivas', icono: 'paid', orden: 90, estado: 'Planificado', prioridad: 'Baja', avance: 0, riesgo: 'Bajo', hito: 'Catálogo UR' },
  { modulo: 'Legajos', area: 'gestion', fase: 'Core RRHH', descripcion: 'Alta, baja y traslados de personal', icono: 'folder_shared', orden: 15, estado: 'En desarrollo', prioridad: 'Alta', avance: 58, riesgo: 'Alto', responsable: 'Equipo Funcional', fecha_inicio: '2026-02-01', fecha_fin_prevista: '2026-08-15', bloqueo: 'Definición de tipologías de vínculo', hito: 'Alta / baja / traslado' },
  { modulo: 'Núcleo / Identidad', area: 'gestion', fase: 'Plataforma', descripcion: 'Identidad y API de personas', icono: 'fingerprint', orden: 5, estado: 'En desarrollo', prioridad: 'Alta', avance: 72, riesgo: 'Medio', responsable: 'Equipo Plataforma', fecha_inicio: '2026-01-15', fecha_fin_prevista: '2026-06-30', bloqueo: 'SSO institucional pendiente de homologación', hito: 'API personas v1' },
  { modulo: 'Licencias (gestión)', area: 'gestion', fase: 'Operación', descripcion: 'Administración de licencias y ausencias', icono: 'event_available', orden: 65, estado: 'En pruebas', prioridad: 'Media', avance: 81, riesgo: 'Bajo', responsable: 'Equipo Funcional', fecha_inicio: '2025-11-01', fecha_fin_prevista: '2026-04-30', bloqueo: 'Sin bloqueo crítico', hito: 'Workflow de aprobación' },
  { modulo: 'Evaluaciones de desempeño', area: 'gestion', fase: 'Desarrollo', descripcion: 'Ciclo de evaluaciones', icono: 'rate_review', orden: 95, estado: 'Planificado', prioridad: 'Media', avance: 8, riesgo: 'Medio', responsable: 'Equipo Funcional', fecha_inicio: '2026-08-01', fecha_fin_prevista: '2027-01-31', bloqueo: 'Modelo de competencias no cerrado', hito: 'Ciclo anual' },

  // —— Tableros
  { modulo: 'Haberes', area: 'tableros', fase: 'Analítica', descripcion: 'Tablero gerencial de haberes', icono: 'monitoring', orden: 110, estado: 'En desarrollo', prioridad: 'Media', avance: 40, riesgo: 'Medio', responsable: 'Equipo Datos', fecha_inicio: '2026-03-15', fecha_fin_prevista: '2026-08-31', bloqueo: 'Catálogo de indicadores RRHH', hito: 'Pack Gerencia v1' },
  { modulo: 'Banda horaria (tablero)', area: 'tableros', fase: 'Analítica', descripcion: 'Tablero de banda horaria', icono: 'nest_clock_farsight_analog', orden: 120, estado: 'Planificado', prioridad: 'Media', avance: 0, riesgo: 'Bajo', hito: 'Indicadores de asistencia' },
  { modulo: 'Organigrama (tablero)', area: 'tableros', fase: 'Analítica', descripcion: 'Consulta gerencial de organigrama', icono: 'account_tree', orden: 130, estado: 'Planificado', prioridad: 'Baja', avance: 0, riesgo: 'Bajo', hito: 'Vista gerencial' },
  { modulo: 'Haberes completo', area: 'tableros', fase: 'Analítica', descripcion: 'Vista ampliada de haberes', icono: 'analytics', orden: 140, estado: 'Planificado', prioridad: 'Media', avance: 0, riesgo: 'Medio', hito: 'Pack ampliado' },

  // —— Autogestión
  { modulo: 'Mis recibos', area: 'autogestion', fase: 'Autoservicio', descripcion: 'Consulta de recibos de sueldo', icono: 'receipt_long', orden: 210, estado: 'En desarrollo', prioridad: 'Media', avance: 49, riesgo: 'Medio', responsable: 'Equipo UX', fecha_inicio: '2026-01-20', fecha_fin_prevista: '2026-07-15', bloqueo: 'Diseño responsive institucional', hito: 'Consulta de recibos' },
  { modulo: 'Mi banda horaria', area: 'autogestion', fase: 'Autoservicio', descripcion: 'Consulta de banda horaria personal', icono: 'schedule', orden: 220, estado: 'Planificado', prioridad: 'Media', avance: 10, riesgo: 'Medio', hito: 'Vista personal' },
  { modulo: 'Mis cursos', area: 'autogestion', fase: 'Autoservicio', descripcion: 'Capacitaciones asignadas', icono: 'school', orden: 230, estado: 'Planificado', prioridad: 'Baja', avance: 10, riesgo: 'Bajo', responsable: 'Equipo Funcional', fecha_inicio: '2026-07-01', fecha_fin_prevista: '2026-11-30', bloqueo: 'Prioridad diferida a Q3', hito: 'Catálogo de cursos' },
  { modulo: 'Mis certificados médicos', area: 'autogestion', fase: 'Autoservicio', descripcion: 'Certificados médicos', icono: 'health_and_safety', orden: 240, estado: 'Planificado', prioridad: 'Media', avance: 0, riesgo: 'Medio', hito: 'Carga de certificados' },
  { modulo: 'Mis licencias', area: 'autogestion', fase: 'Autoservicio', descripcion: 'Licencias y ausencias del empleado', icono: 'event_available', orden: 250, estado: 'En pruebas', prioridad: 'Media', avance: 67, riesgo: 'Bajo', responsable: 'Equipo UX', fecha_inicio: '2025-12-01', fecha_fin_prevista: '2026-05-31', bloqueo: 'Sin bloqueo crítico', hito: 'Solicitud de licencia' },
  { modulo: 'Beneficios', area: 'autogestion', fase: 'Autoservicio', descripcion: 'Alta y consulta de beneficios', icono: 'card_giftcard', orden: 260, estado: 'En pruebas', prioridad: 'Baja', avance: 67, riesgo: 'Bajo', responsable: 'Equipo UX', fecha_inicio: '2025-12-01', fecha_fin_prevista: '2026-05-31', bloqueo: 'Sin bloqueo crítico', hito: 'Alta de beneficios' },
];

let SQL = null;
let db = null;
let dbPath = null;

function nowIso() {
  return new Date().toISOString();
}

function persist() {
  if (!db || !dbPath) return;
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

function rowFromStmt(stmt) {
  const cols = stmt.getColumnNames();
  const values = stmt.get();
  const row = {};
  cols.forEach((c, i) => { row[c] = values[i]; });
  return row;
}

function normalizeEquipo(raw) {
  if (Array.isArray(raw)) {
    return raw.map((s) => String(s || '').trim()).filter(Boolean).join('\n');
  }
  return String(raw || '')
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .join('\n');
}

function normalizeArea(area) {
  const a = String(area || '').trim().toLowerCase();
  return AREAS.includes(a) ? a : 'gestion';
}

function normalizeActivo(v) {
  if (v === false || v === 0 || v === '0' || v === 'false') return 0;
  return 1;
}

function listModulos() {
  const rows = [];
  const stmt = db.prepare('SELECT * FROM sirh_modulos ORDER BY orden ASC, id ASC');
  while (stmt.step()) rows.push(rowFromStmt(stmt));
  stmt.free();
  return rows.map((r) => ({
    ...r,
    activo: Number(r.activo) === 0 ? 0 : 1,
    orden: Number(r.orden) || 0,
    avance: Number(r.avance) || 0,
  }));
}

function tableHasColumn(table, column) {
  const stmt = db.prepare(`PRAGMA table_info(${table})`);
  let found = false;
  while (stmt.step()) {
    const info = rowFromStmt(stmt);
    if (info.name === column) found = true;
  }
  stmt.free();
  return found;
}

function migrateColumns() {
  const extras = [
    ['proveedor', "TEXT NOT NULL DEFAULT ''"],
    ['fecha_inicio', "TEXT NOT NULL DEFAULT ''"],
    ['fecha_fin_prevista', "TEXT NOT NULL DEFAULT ''"],
    ['fecha_fin_real', "TEXT NOT NULL DEFAULT ''"],
    ['area', "TEXT NOT NULL DEFAULT 'gestion'"],
    ['activo', 'INTEGER NOT NULL DEFAULT 1'],
    ['descripcion', "TEXT NOT NULL DEFAULT ''"],
    ['orden', 'INTEGER NOT NULL DEFAULT 0'],
    ['icono', "TEXT NOT NULL DEFAULT 'view_module'"],
    ['equipo', "TEXT NOT NULL DEFAULT ''"],
  ];
  extras.forEach(([col, def]) => {
    if (!tableHasColumn('sirh_modulos', col)) {
      db.run(`ALTER TABLE sirh_modulos ADD COLUMN ${col} ${def}`);
    }
  });
}

function guessArea(name) {
  const n = String(name || '').toLowerCase();
  if (/recibo|portal|curso|capacit|beneficio|certificado|autoserv|empleado|mi /.test(n)) return 'autogestion';
  if (/tablero|haberes|reportes? gerenc|anal[ií]tica/.test(n)) return 'tableros';
  return 'gestion';
}

/** Inserta módulos del catálogo que aún no existen (por nombre). */
function ensureCatalogCoverage() {
  const existing = new Set(listModulos().map((r) => String(r.modulo || '').trim().toLowerCase()));
  const ts = nowIso();
  let added = 0;
  const insert = db.prepare(`
    INSERT INTO sirh_modulos
    (modulo, fase, estado, prioridad, avance, riesgo, responsable, proveedor,
     fecha_inicio, fecha_fin_prevista, fecha_fin_real, bloqueo, hito, updated_at,
     area, activo, descripcion, orden, icono, equipo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  SEED_MODULOS.forEach((m) => {
    const key = String(m.modulo || '').trim().toLowerCase();
    if (!key || existing.has(key)) return;
    insert.run([
      m.modulo, m.fase || '', m.estado || 'Planificado', m.prioridad || 'Media',
      m.avance || 0, m.riesgo || 'Medio', m.responsable || '', m.proveedor || '',
      m.fecha_inicio || '', m.fecha_fin_prevista || '', m.fecha_fin_real || '',
      m.bloqueo || '', m.hito || '', ts,
      normalizeArea(m.area), 1, m.descripcion || '', m.orden || 0, m.icono || 'view_module',
      normalizeEquipo(m.equipo),
    ]);
    existing.add(key);
    added += 1;
  });
  insert.free();

  // Backfill área vacía / genérica en filas viejas
  listModulos().forEach((r) => {
    if (!r.area || r.area === '') {
      db.run('UPDATE sirh_modulos SET area=? WHERE id=?', [guessArea(r.modulo), r.id]);
    }
  });

  if (added) persist();
  return added;
}

function insertSeedRow(insert, m, ts) {
  insert.run([
    m.modulo, m.fase || '', m.estado || 'Planificado', m.prioridad || 'Media',
    m.avance || 0, m.riesgo || 'Medio', m.responsable || '', m.proveedor || '',
    m.fecha_inicio || '', m.fecha_fin_prevista || '', m.fecha_fin_real || '',
    m.bloqueo || '', m.hito || '', ts,
    normalizeArea(m.area), normalizeActivo(m.activo ?? 1), m.descripcion || '',
    m.orden || 0, m.icono || 'view_module', normalizeEquipo(m.equipo),
  ]);
}

function ensureSchemaAndSeed() {
  db.run(`
    CREATE TABLE IF NOT EXISTS sirh_modulos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      modulo TEXT NOT NULL,
      fase TEXT NOT NULL DEFAULT '',
      estado TEXT NOT NULL DEFAULT 'Planificado',
      prioridad TEXT NOT NULL DEFAULT 'Media',
      avance INTEGER NOT NULL DEFAULT 0,
      riesgo TEXT NOT NULL DEFAULT 'Medio',
      responsable TEXT NOT NULL DEFAULT '',
      proveedor TEXT NOT NULL DEFAULT '',
      fecha_inicio TEXT NOT NULL DEFAULT '',
      fecha_fin_prevista TEXT NOT NULL DEFAULT '',
      fecha_fin_real TEXT NOT NULL DEFAULT '',
      bloqueo TEXT NOT NULL DEFAULT '',
      hito TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL,
      area TEXT NOT NULL DEFAULT 'gestion',
      activo INTEGER NOT NULL DEFAULT 1,
      descripcion TEXT NOT NULL DEFAULT '',
      orden INTEGER NOT NULL DEFAULT 0,
      icono TEXT NOT NULL DEFAULT 'view_module',
      equipo TEXT NOT NULL DEFAULT ''
    );
  `);

  migrateColumns();

  const countStmt = db.prepare('SELECT COUNT(*) AS c FROM sirh_modulos');
  countStmt.step();
  const count = countStmt.get()[0];
  countStmt.free();

  if (count === 0) {
    const insert = db.prepare(`
      INSERT INTO sirh_modulos
      (modulo, fase, estado, prioridad, avance, riesgo, responsable, proveedor,
       fecha_inicio, fecha_fin_prevista, fecha_fin_real, bloqueo, hito, updated_at,
       area, activo, descripcion, orden, icono, equipo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const ts = nowIso();
    SEED_MODULOS.forEach((m) => insertSeedRow(insert, m, ts));
    insert.free();
    persist();
  } else {
    ensureCatalogCoverage();
  }
}

async function initSirhDb(userDataPath) {
  if (db) return { ok: true, path: dbPath };

  SQL = await initSqlJs({
    locateFile: (file) => path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', file),
  });

  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }
  dbPath = path.join(userDataPath, 'sirh.sqlite');
  if (fs.existsSync(dbPath)) {
    const buf = fs.readFileSync(dbPath);
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
  }

  ensureSchemaAndSeed();
  persist();
  return { ok: true, path: dbPath };
}

function normalizeEstado(estado) {
  const raw = String(estado || '').trim();
  if (ESTADOS_CLASICOS.includes(raw)) return raw;
  return 'Planificado';
}

function rowFieldsFromPayload(payload = {}) {
  const ts = nowIso();
  const modulo = String(payload.modulo || '').trim();
  if (!modulo) throw new Error('El nombre del módulo es obligatorio.');

  const fields = {
    modulo,
    fase: String(payload.fase || '').trim(),
    estado: normalizeEstado(payload.estado),
    prioridad: PRIORIDADES.includes(String(payload.prioridad || '').trim())
      ? String(payload.prioridad).trim()
      : 'Media',
    avance: Math.max(0, Math.min(100, Number(payload.avance) || 0)),
    riesgo: RIESGOS.includes(String(payload.riesgo || '').trim())
      ? String(payload.riesgo).trim()
      : 'Medio',
    responsable: String(payload.responsable || '').trim(),
    proveedor: String(payload.proveedor || '').trim(),
    equipo: normalizeEquipo(payload.equipo),
    fecha_inicio: String(payload.fecha_inicio || '').trim(),
    fecha_fin_prevista: String(payload.fecha_fin_prevista || '').trim(),
    fecha_fin_real: String(payload.fecha_fin_real || '').trim(),
    bloqueo: String(payload.bloqueo || '').trim(),
    hito: String(payload.hito || '').trim(),
    area: normalizeArea(payload.area),
    activo: normalizeActivo(payload.activo),
    descripcion: String(payload.descripcion || '').trim(),
    orden: Math.max(0, Number(payload.orden) || 0),
    icono: String(payload.icono || 'view_module').trim() || 'view_module',
    updated_at: ts,
  };

  if (fields.estado === 'Operativo' && !fields.fecha_fin_real) {
    fields.fecha_fin_real = ts.slice(0, 10);
  }
  return fields;
}

function upsertModulo(payload = {}) {
  const fields = rowFieldsFromPayload(payload);
  const id = payload.id != null && payload.id !== '' ? Number(payload.id) : null;

  if (id && Number.isFinite(id)) {
    db.run(
      `UPDATE sirh_modulos SET
        modulo=?, fase=?, estado=?, prioridad=?, avance=?, riesgo=?,
        responsable=?, proveedor=?, fecha_inicio=?, fecha_fin_prevista=?, fecha_fin_real=?,
        bloqueo=?, hito=?, updated_at=?, area=?, activo=?, descripcion=?, orden=?, icono=?, equipo=?
       WHERE id=?`,
      [
        fields.modulo, fields.fase, fields.estado, fields.prioridad, fields.avance, fields.riesgo,
        fields.responsable, fields.proveedor, fields.fecha_inicio, fields.fecha_fin_prevista, fields.fecha_fin_real,
        fields.bloqueo, fields.hito, fields.updated_at, fields.area, fields.activo, fields.descripcion,
        fields.orden, fields.icono, fields.equipo, id,
      ],
    );
    persist();
    return listModulos().find((r) => r.id === id) || { id, ...fields };
  }

  db.run(
    `INSERT INTO sirh_modulos
     (modulo, fase, estado, prioridad, avance, riesgo, responsable, proveedor,
      fecha_inicio, fecha_fin_prevista, fecha_fin_real, bloqueo, hito, updated_at,
      area, activo, descripcion, orden, icono, equipo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      fields.modulo, fields.fase, fields.estado, fields.prioridad, fields.avance, fields.riesgo,
      fields.responsable, fields.proveedor, fields.fecha_inicio, fields.fecha_fin_prevista, fields.fecha_fin_real,
      fields.bloqueo, fields.hito, fields.updated_at, fields.area, fields.activo, fields.descripcion,
      fields.orden, fields.icono, fields.equipo,
    ],
  );
  persist();
  const rows = listModulos();
  return rows[rows.length - 1];
}

function deleteModulo(id) {
  const num = Number(id);
  if (!Number.isFinite(num)) throw new Error('ID inválido.');
  db.run('DELETE FROM sirh_modulos WHERE id=?', [num]);
  persist();
  return { ok: true, id: num };
}

function replaceAllModulos(rows) {
  if (!Array.isArray(rows)) throw new Error('sirh_modulos debe ser un array.');
  db.run('DELETE FROM sirh_modulos');
  const insert = db.prepare(`
    INSERT INTO sirh_modulos
    (modulo, fase, estado, prioridad, avance, riesgo, responsable, proveedor,
     fecha_inicio, fecha_fin_prevista, fecha_fin_real, bloqueo, hito, updated_at,
     area, activo, descripcion, orden, icono, equipo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const ts = nowIso();
  rows.forEach((payload) => {
    try {
      const fields = rowFieldsFromPayload({ ...payload, updated_at: payload.updated_at || ts });
      fields.updated_at = String(payload.updated_at || ts);
      insert.run([
        fields.modulo, fields.fase, fields.estado, fields.prioridad, fields.avance, fields.riesgo,
        fields.responsable, fields.proveedor, fields.fecha_inicio, fields.fecha_fin_prevista,
        fields.fecha_fin_real, fields.bloqueo, fields.hito, fields.updated_at,
        fields.area, fields.activo, fields.descripcion, fields.orden, fields.icono, fields.equipo,
      ]);
    } catch {
      /* skip invalid */
    }
  });
  insert.free();
  persist();
  return { ok: true, rows: listModulos().length };
}

function exportModulosPayload() {
  return listModulos().map((r) => ({
    modulo: r.modulo,
    fase: r.fase,
    estado: r.estado,
    prioridad: r.prioridad,
    avance: Number(r.avance) || 0,
    riesgo: r.riesgo,
    responsable: r.responsable || '',
    proveedor: r.proveedor || '',
    equipo: r.equipo || '',
    fecha_inicio: r.fecha_inicio || '',
    fecha_fin_prevista: r.fecha_fin_prevista || '',
    fecha_fin_real: r.fecha_fin_real || '',
    bloqueo: r.bloqueo || '',
    hito: r.hito || '',
    area: r.area || 'gestion',
    activo: Number(r.activo) === 0 ? 0 : 1,
    descripcion: r.descripcion || '',
    orden: Number(r.orden) || 0,
    icono: r.icono || 'view_module',
    updated_at: r.updated_at || '',
  }));
}

function getCatalogos() {
  return {
    estados: ESTADOS_CLASICOS,
    prioridades: PRIORIDADES,
    riesgos: RIESGOS,
    areas: AREAS.map((id) => ({ id, label: AREA_LABELS[id] || id })),
  };
}

function getDbPath() {
  return dbPath;
}

function getStats() {
  const rows = listModulos().filter((r) => Number(r.activo) !== 0);
  const byEstado = {};
  const byRiesgo = {};
  const byArea = {};
  let avanceSum = 0;
  let riesgoAlto = 0;
  let vencidos = 0;
  let prioridadAlta = 0;
  let enPruebas = 0;
  const today = new Date().toISOString().slice(0, 10);

  rows.forEach((r) => {
    const estado = r.estado || 'Sin estado';
    const riesgo = r.riesgo || 'Medio';
    const area = r.area || 'gestion';
    byEstado[estado] = (byEstado[estado] || 0) + 1;
    byRiesgo[riesgo] = (byRiesgo[riesgo] || 0) + 1;
    byArea[area] = (byArea[area] || 0) + 1;
    avanceSum += Number(r.avance) || 0;
    if (String(riesgo).toLowerCase() === 'alto') riesgoAlto += 1;
    if (String(r.prioridad || '').toLowerCase() === 'alta') prioridadAlta += 1;
    if (String(estado).toLowerCase().includes('prueba')) enPruebas += 1;
    const fin = String(r.fecha_fin_prevista || '').trim();
    const cerrado = ['Operativo', 'Cancelado'].includes(estado);
    if (fin && fin < today && !cerrado) vencidos += 1;
  });

  const avance = [...rows]
    .sort((a, b) => (Number(b.avance) || 0) - (Number(a.avance) || 0))
    .slice(0, 10)
    .map((r) => ({
      id: r.id,
      modulo: r.modulo,
      avance: Number(r.avance) || 0,
      estado: r.estado,
      riesgo: r.riesgo,
      area: r.area,
    }));

  return {
    total: rows.length,
    avanceMedio: rows.length ? Math.round(avanceSum / rows.length) : 0,
    riesgoAlto,
    prioridadAlta,
    enPruebas,
    vencidos,
    byEstado,
    byRiesgo,
    byArea,
    avance,
  };
}

module.exports = {
  initSirhDb,
  listModulos,
  upsertModulo,
  deleteModulo,
  replaceAllModulos,
  exportModulosPayload,
  getDbPath,
  getCatalogos,
  getStats,
  ESTADOS_CLASICOS,
  AREAS,
  AREA_LABELS,
  SEED_MODULOS,
};
